const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const axios = require('axios');
const db = require('../db.js');

let cacheServers = [];
let lastUpdated = null;
let isFetching = false;

const REQUEST_DELAY_MS = 1500; // пауза между запросами страниц
const TARGET_SERVER_COUNT = 300;
const MAX_PAGES = 8; // защитный потолок, чтобы не уйти в бесконечный цикл

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Сервера, с которыми мы не работаем: официальные Facepunch и китайский регион
function isBlockedServer(server) {
  const country = server.attributes?.country;
  const isOfficial = server.attributes?.details?.official === true;
  const isChina = country === 'CN';
  return isOfficial || isChina;
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
    let allowedServers = [];
    let nextUrl = null;
    let pageCount = 0;

    // Первый запрос — топ по players, дальше идём по курсорным ссылкам links.next
    let requestConfig = {
      params: {
        'filter[game]': 'rust',
        sort: '-players',
        'page[size]': '100',
      },
      headers,
    };

    while (allowedServers.length < TARGET_SERVER_COUNT && pageCount < MAX_PAGES) {
      const url = nextUrl || 'https://api.battlemetrics.com/servers';
      const res = await axios.get(url, nextUrl ? { headers } : requestConfig);
      pageCount++;

      const pageServers = res.data?.data || [];
      if (pageServers.length === 0) break; // BattleMetrics больше ничего не отдаёт

      const filtered = pageServers.filter((s) => !isBlockedServer(s));
      allowedServers.push(...filtered);

      nextUrl = res.data?.links?.next || null;
      if (!nextUrl) break; // страниц больше нет

      await sleep(REQUEST_DELAY_MS);
    }

    const allServers = allowedServers.slice(0, TARGET_SERVER_COUNT);

    console.log(
      `ℹ️  [Filter] Запрошено страниц: ${pageCount}, годных серверов после фильтра: ${allowedServers.length}, ` +
      `взято: ${allServers.length}`
    );

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

// Запуск сразу и затем каждые 10 минут
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