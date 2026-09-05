const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const db = require('../db.js');
const redisClient = require('../redis.js');
const { scheduleRequest } = require('../rateLimiter.js');

const TTL_SECONDS = 240; // Время жизни кэша игроков в Redis

// Описание тиров: какие серверы (по рангу players DESC) и как часто опрашивать
const TIERS = [
  { name: 'TIER_1 (1-100)', limit: 100, offset: 0, intervalMs: 60 * 1000, startDelayMs: 3000 },
  { name: 'TIER_2 (101-200)', limit: 100, offset: 100, intervalMs: 120 * 1000, startDelayMs: 8000 },
  { name: 'TIER_3 (201-300)', limit: 100, offset: 200, intervalMs: 180 * 1000, startDelayMs: 13000 },
];

// Флаг "занят" отдельно на каждый тир, чтобы циклы не наезжали друг на друга
const tierBusy = {};

async function fetchAndCacheServerPlayers(serverId, headers) {
  try {
    const res = await scheduleRequest(() =>
      axios.get(
        `https://api.battlemetrics.com/servers/${serverId}?include=player`,
        { headers, timeout: 10000 }
      )
    );

    const included = res.data?.included || [];

    const players = included
      .filter((item) => item.type === 'player')
      .map((item) => ({
        bmId: String(item.id),
        name: item.attributes?.name || 'Unknown',
      }));

    if (players.length > 0) {
      await redisClient.set(
        `server:${serverId}:players`,
        JSON.stringify(players),
        { EX: TTL_SECONDS }
      );

      const multi = redisClient.multi();
      for (const p of players) {
        multi.set(`player:${p.bmId}:server`, String(serverId), { EX: TTL_SECONDS });
      }
      await multi.exec();
    }

    return players.length;
  } catch (error) {
    const status = error.response?.status;

    if (status === 429) {
      // rateLimiter уже поставил общий cooldown — тут просто фиксируем факт
      console.warn(`⚠️ [BM 429] Лимит запросов на сервере ${serverId}`);
    } else if (status >= 500) {
      console.warn(`⚠️ [BM ${status}] Временный сбой на стороне BattleMetrics (сервер ${serverId})`);
    } else {
      console.error(`❌ Ошибка сервера ${serverId}:`, error.message);
    }
    return 0;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeTier(tier) {
  if (tierBusy[tier.name]) {
    console.log(`⏭️  [${tier.name}] Пропуск: предыдущий опрос ещё не завершился`);
    return;
  }
  tierBusy[tier.name] = true;

  const token = process.env.battleMetricsKey;
  if (!token) {
    console.error('❌ [Player Scraper] battleMetricsKey не найден в process.env!');
    tierBusy[tier.name] = false;
    return;
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token.trim()}`,
    'User-Agent': 'localhost/127.0.1',
  };

  try {
    const result = await db.query(
      'SELECT id FROM "Server" WHERE status = \'online\' ORDER BY players DESC LIMIT $1 OFFSET $2;',
      [tier.limit, tier.offset]
    );

    const servers = result.rows;
    if (servers.length === 0) {
      console.log(`⚠️ [${tier.name}] В базе нет серверов для опроса на этом диапазоне`);
      return;
    }

    // Равномерно распределяем запросы по всему интервалу тира.
    // Пример для TIER_1: 60000мс / 100 серверов = 600мс между стартом каждого запроса.
    const delayPerServer = tier.intervalMs / servers.length;

    console.log(
      `\n🔄 [${tier.name}] Запуск сбора игроков для ${servers.length} серверов ` +
      `(интервал между запросами: ${delayPerServer.toFixed(0)}мс)...`
    );
    const startTime = Date.now();

    const pending = [];
    for (let i = 0; i < servers.length; i++) {
      pending.push(fetchAndCacheServerPlayers(servers[i].id, headers));

      // Не ждём завершения запроса — просто выдерживаем паузу перед стартом следующего
      if (i < servers.length - 1) {
        await sleep(delayPerServer);
      }
    }

    const counts = await Promise.all(pending);

    const totalPlayersCount = counts.reduce((acc, c) => acc + c, 0);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [${tier.name}] Завершено за ${duration}с. Найдено и записано игроков: ${totalPlayersCount}`);
  } catch (error) {
    console.error(`❌ [${tier.name}] Критическая ошибка:`, error.message);
  } finally {
    tierBusy[tier.name] = false;
  }
}

// Запуск каждого тира со своей задержкой старта и своим интервалом
for (const tier of TIERS) {
  setTimeout(() => {
    scrapeTier(tier);
    setInterval(() => scrapeTier(tier), tier.intervalMs);
  }, tier.startDelayMs);
}

module.exports = { scrapeTier, TIERS };