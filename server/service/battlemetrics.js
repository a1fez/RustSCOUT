/* let cacheServers = [];
let lastUpdated = null;

async function getServers() {
  try {
    const params = new URLSearchParams({
      'filter[game]': 'rust',
      'sort': '-players',
      'page[size]': '15'
    });

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json'
    };

    if (process.env.battleMetricsKey) {
      headers['Authorization'] = `Bearer ${process.env.battleMetricsKey.trim()}`;
    }

    // Используем нативный fetch вместо axios
    const response = await fetch(`https://api.battlemetrics.com/servers?${params}`, {
      method: 'GET',
      headers: headers
    });

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.data) {
      cacheServers = data.data.map(server => ({
        id: server.id,
        name: server.attributes.name,
        players: server.attributes.players, 
        maxPlayers: server.attributes.maxPlayers,
        status: server.attributes.status,
      }));

      lastUpdated = new Date();
      console.log(`✅ [Cache Updated] Топ-15 серверов обновлены в ${lastUpdated.toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error('❌ Ошибка BattleMetrics API:', error.message);
  }
}

// Запускаем сразу и каждые 3 минуты (180 000 мс)
getServers();
setInterval(getServers, 3 * 60 * 1000);

function getCachedServers() {
  return {
    servers: cacheServers,
    lastUpdated
  };
}

module.exports = { getCachedServers }; */