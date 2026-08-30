const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const db = require('../db.js');
const redisClient = require('../redis.js');

const BATCH_SIZE = 5;      // 5 одновременных запросов
const DELAY_MS = 2500;     // Пауза 2.5 сек между пачками
const TTL_SECONDS = 600;   // Время жизни кэша 10 минут

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndCacheServerPlayers(serverId, headers, retries = 2) {
  try {
    const res = await axios.get(
      `https://api.battlemetrics.com/servers/${serverId}?include=player`,
      { headers, timeout: 10000 }
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

    // Если BattleMetrics отдал 502/503/504 или таймаут — пробуем еще раз
    if ((status >= 500 || error.code === 'ECONNABORTED') && retries > 0) {
      await sleep(1500);
      return fetchAndCacheServerPlayers(serverId, headers, retries - 1);
    }

    if (status === 429) {
      console.warn(`⚠️ [BM 429] Лимит запросов на сервере ${serverId}`);
    } else if (status >= 500) {
      console.warn(`⚠️ [BM ${status}] Временный сбой на стороне BattleMetrics (сервер ${serverId})`);
    } else {
      console.error(`❌ Ошибка сервера ${serverId}:`, error.message);
    }
    return 0;
  }
}

async function scrapePlayers() {
  const token = process.env.battleMetricsKey;
  if (!token) {
    console.error('❌ [Player Scraper] battleMetricsKey не найден в process.env!');
    return;
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token.trim()}`,
    'User-Agent': 'RustScout/1.0 (contact@rustscout.local)',
  };

  try {
    const result = await db.query(
      'SELECT id FROM "Server" WHERE status = \'online\' ORDER BY players DESC LIMIT 200;'
    );

    const servers = result.rows;
    if (servers.length === 0) {
      console.log('⚠️ [Player Scraper] В базе PostgreSQL нет серверов для опроса');
      return;
    }

    console.log(`\n🔄 [Player Scraper] Запуск сбора игроков для ${servers.length} серверов...`);
    const startTime = Date.now();
    let totalPlayersCount = 0;

    for (let i = 0; i < servers.length; i += BATCH_SIZE) {
      const batch = servers.slice(i, i + BATCH_SIZE);

      const counts = await Promise.all(
        batch.map((srv) => fetchAndCacheServerPlayers(srv.id, headers))
      );

      totalPlayersCount += counts.reduce((acc, c) => acc + c, 0);

      if (i + BATCH_SIZE < servers.length) {
        await sleep(DELAY_MS);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [Player Scraper] Завершено за ${duration}с. Найдено и записано игроков: ${totalPlayersCount}`);
  } catch (error) {
    console.error('❌ [Player Scraper] Критическая ошибка:', error.message);
  }
}

// Запуск через 3 сек после старта и каждые 2 минуты
setTimeout(scrapePlayers, 3000);
setInterval(scrapePlayers, 2 * 60 * 1000);

module.exports = { scrapePlayers };