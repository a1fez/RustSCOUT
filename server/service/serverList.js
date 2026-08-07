const path = require('path');
const axios = require('axios');

// Загружаем переменные из .env файла
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

let cacheServers = [];
let lastUpdated = null;

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
        id: server.id,
        name: server.attributes.name,
        players: server.attributes.players,
        maxPlayers: server.attributes.maxPlayers,
        status: server.attributes.status,
      }));

      lastUpdated = new Date();
      console.log(`✅ [Cache Updated] Топ-200 серверов обновлены в ${lastUpdated.toLocaleTimeString()}`);
      console.table(cacheServers);
    }
  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка BattleMetrics API (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Ошибка сети/запроса:', error.message);
    }
  }
}

// Запускаем сразу при старте
getServers();

// Периодическое обновление каждые 3 минуты
setInterval(getServers, 3 * 60 * 1000);

function getCachedServers() {
  return {
    servers: cacheServers,
    lastUpdated
  };
}

module.exports = { getCachedServers };