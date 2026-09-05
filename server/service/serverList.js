const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const db = require('../db.js');

let cacheServers = [];
let lastUpdated = null;
let isFetching = false;

const REQUEST_DELAY_MS = 1500; // пауза между запросами page1 -> page2 -> page3

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Сохранение серверов в БД
async function saveServersToDatabase(serversList) {
  if (!serversList || serversList.length === 0) return;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const server of serversList) {
      await client.query(
        `INSERT INTO "Server" (id, name, players, "maxPlayers", status, "updatedAt")
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           players = EXCLUDED.players,
           "maxPlayers" = EXCLUDED."maxPlayers",
           status = EXCLUDED.status,
           "updatedAt" = NOW();`,
        [
          String(server.id),
          server.name,
          server.players ?? 0,
          server.maxPlayers ?? 0,
          server.status || 'online',
        ]
      );
    }

    await client.query('COMMIT');
    console.log(`✅ [DB Synced] Синхронизировано ${serversList.length} серверов в PostgreSQL`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка сохранения серверов в PostgreSQL:', error.message);
  } finally {
    client.release();
  }
}

async function getServers() {
  if (isFetching) {
    console.log('⏭️  Пропуск запуска: предыдущий цикл обновления ещё не завершился');
    return;
  }
  isFetching = true;

  const token = process.env.battleMetricsKey;

  if (!token) {
    console.error('❌ Ошибка: Переменная battleMetricsKey не найдена в .env!');
    isFetching = false;
    return;
  }

  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${token.trim()}`,
    'User-Agent': 'RustScout/1.0 (contact@rustscout.local)',
  };

  try {
    let allServers = [];

    // 1. Страница 1: серверы 1-100
    const page1Res = await axios.get('https://api.battlemetrics.com/servers', {
      params: {
        'filter[game]': 'rust',
        sort: '-players',
        'page[size]': '100',
      },
      headers,
    });

    if (page1Res.data?.data) {
      allServers.push(...page1Res.data.data);
    }

    await sleep(REQUEST_DELAY_MS);

    // 2. Страница 2: серверы 101-200 (курсор берётся из ответа страницы 1)
    const nextUrl1 = page1Res.data?.links?.next;
    let page2Res = null;
    if (nextUrl1) {
      page2Res = await axios.get(nextUrl1, { headers });
      if (page2Res.data?.data) {
        allServers.push(...page2Res.data.data);
      }
    }

    await sleep(REQUEST_DELAY_MS);

    // 3. Страница 3: серверы 201-300 (курсор берётся из ответа страницы 2, а не страницы 1!)
    const nextUrl2 = page2Res?.data?.links?.next;
    if (nextUrl2) {
      const page3Res = await axios.get(nextUrl2, { headers });
      if (page3Res.data?.data) {
        allServers.push(...page3Res.data.data);
      }
    }

    if (allServers.length > 0) {
      cacheServers = allServers.map((server) => ({
        id: String(server.id),
        name: server.attributes.name,
        players: server.attributes.players,
        maxPlayers: server.attributes.maxPlayers,
        status: server.attributes.status,
      }));

      lastUpdated = new Date();
      console.log(
        `✅ [Cache Updated] Получено ${cacheServers.length} серверов в ${lastUpdated.toLocaleTimeString()}`
      );

      await saveServersToDatabase(cacheServers);
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка BattleMetrics API (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Ошибка сети/запроса:', error.message);
    }
  } finally {
    isFetching = false;
  }
}

// Запуск сразу и затем каждые 60 секунд
getServers();
setInterval(getServers, 10 * 60 * 1000);

function getCachedServers() {
  return {
    servers: cacheServers,
    lastUpdated,
  };
}

module.exports = {
  getServers,
  getCachedServers,
  saveServersToDatabase,
};