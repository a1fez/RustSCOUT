const path = require('path');
const axios = require('axios');
const prisma = require('../prisma.js');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


let cacheServers = [];
let lastUpdated = null;

// Функция сохранения и обновления в БД
async function saveServersToDatabase(serversList) {
  if (!serversList || serversList.length === 0) return;

  try {
    const operations = serversList.map(server =>
      prisma.server.upsert({
        where: { id: String(server.id) },
        update: {
          name: server.name,
          players: server.players,
          maxPlayers: server.maxPlayers,
          status: server.status
        },
        create: {
          id: String(server.id),
          name: server.name,
          players: server.players,
          maxPlayers: server.maxPlayers,
          status: server.status
        }
      })
    );

    await prisma.$transaction(operations);
    console.log(`✅ [DB Synced] Синхронизировано ${serversList.length} серверов в БД`);
  } catch (error) {
    console.error('❌ Ошибка при сохранении серверов в БД:', error);
  }
}

async function getServers() {
  const token = process.env.battleMetricsKey;

  if (!token) {
    console.error('❌ Ошибка: Переменная battleMetricsKey не найдена в .env!');
    return;
  }

  try {
    const response = await axios.get('https://api.battlemetrics.com/servers', {
      params: {
        'filter[game]': 'rust',
        'sort': '-players',
        'page[size]': '100'
      },
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
        'User-Agent': 'RustScout/1.0 (contact@rustscout.local)'
      }
    });

    if (response.data && response.data.data) {
      cacheServers = response.data.data.map(server => ({
        id: String(server.id),
        name: server.attributes.name,
        players: server.attributes.players,
        maxPlayers: server.attributes.maxPlayers,
        status: server.attributes.status,
      }));

      lastUpdated = new Date();
      console.log(`✅ [Cache Updated] Получено ${cacheServers.length} серверов в ${lastUpdated.toLocaleTimeString()}`);

      // Сохраняем в базу данных
      await saveServersToDatabase(cacheServers);
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка BattleMetrics API (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Ошибка сети/запроса:', error.message);
    }
  }
}

// Запуск сразу при старте
getServers();

// Периодическое обновление каждые 3 минуты
setInterval(getServers, 3 * 60 * 1000);

function getCachedServers() {
  return {
    servers: cacheServers,
    lastUpdated
  };
}

module.exports = { 
  getCachedServers,
  saveServersToDatabase 
};