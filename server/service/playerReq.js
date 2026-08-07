const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.battleMetricsKey;
const playerId = '1162188004'; // Замени на нужный BM ID игрока

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

// Перевод секунд в форматированные часы
function formatSeconds(seconds) {
  if (!seconds || seconds <= 0) return '0 ч';
  const hours = (seconds / 3600).toFixed(1);
  return `${hours} ч`;
}

// Перевод миллисекунд в "X ч Y мин"
function formatMs(ms) {
  if (ms <= 0) return '0 мин';
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} ч ${minutes} мин`;
  }
  return `${minutes} мин`;
}

async function getFullPlayerStatus(id) {
  try {
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token.trim()}`,
      'User-Agent': getRandomUserAgent()
    };

    // 1. Профиль игрока + включенные сервера и идентификаторы
    const playerRes = await axios.get(`https://api.battlemetrics.com/players/${id}`, {
      params: { 'include': 'server,identifier' },
      headers
    });

    const player = playerRes.data.data;
    const included = playerRes.data.included || [];

    // 2. Сессии для проверки реального онлайн-статуса
    const sessionsRes = await axios.get(`https://api.battlemetrics.com/sessions`, {
      params: {
        'filter[players]': id,
        'include': 'server',
        'page[size]': 10
      },
      headers
    });

    const sessions = sessionsRes.data.data || [];
    const sessionServers = sessionsRes.data.included || [];

    // Карта серверов сессий
    const sessionServerMap = {};
    sessionServers.forEach(srv => {
      sessionServerMap[srv.id] = srv.attributes;
    });

    // --- ОБРАБОТКА СЕРВЕРОВ И TIME PLAYED ---
    let grandTotalSeconds = 0;
    const serversList = [];

    included.forEach(item => {
      if (item.type === 'server') {
        const timePlayed = item.meta?.timePlayed || 0;
        grandTotalSeconds += timePlayed;

        serversList.push({
          serverId: item.id,
          name: item.attributes?.name || 'Неизвестный сервер',
          ip: item.attributes ? `${item.attributes.ip}:${item.attributes.port}` : 'N/A',
          timePlayedSeconds: timePlayed,
          lastSeen: item.meta?.lastSeen ? new Date(item.meta.lastSeen) : new Date(0)
        });
      }
    });

    // Сортируем сервера по наигранному времени (от лучших к худшим)
    serversList.sort((a, b) => b.timePlayedSeconds - a.timePlayedSeconds);

    // Проверка онлайна
    const activeSession = sessions.find(s => s.attributes.stop === null);
    const isOnlineNow = Boolean(activeSession);

    // --- ВЫВОД РЕЗУЛЬТАТА ---
    console.clear();
    console.log(`========================================`);
    console.log(`👤 ИГРОК: ${player.attributes.name} (ID: ${player.id})`);
    console.log(`🟢 СТАТУС: ${isOnlineNow ? 'ИГРАЕТ ПРЯМО СЕЙЧАС 🟢' : 'ОФФЛАЙН 🔴'}`);
    console.log(`⏱️ ВСЕГО НАИГРАНО: ${formatSeconds(grandTotalSeconds)} (${Math.round(grandTotalSeconds / 3600)} ч)`);
    console.log(`========================================\n`);

    // --- ИДЕНТИФИКАТОРЫ ---
    const identifiers = included.filter(item => item.type === 'identifier');
    console.log(`🆔 ИДЕНТИФИКАТОРЫ (${identifiers.length}):`);
    if (identifiers.length > 0) {
      identifiers.forEach(idObj => {
        const type = idObj.attributes.type;
        const val = idObj.attributes.identifier;
        if (type === 'steamID') {
          console.log(`   🔹 Steam ID 64: ${val}`);
          console.log(`      🔗 Профиль: https://steamcommunity.com/profiles/${val}`);
        } else {
          console.log(`   🔹 ${type}: ${val}`);
        }
      });
      console.log('');
    }

    // --- ТЕКУЩИЙ СЕРВЕР ---
    if (isOnlineNow) {
      const currentServerId = activeSession.relationships?.server?.data?.id;
      const currentServer = sessionServerMap[currentServerId];
      const startTime = new Date(activeSession.attributes.start);
      const durationMs = Date.now() - startTime.getTime();

      console.log(`🎮 ТЕКУЩИЙ СЕРВЕР:`);
      console.log(`   🏰 ${currentServer ? currentServer.name : 'Имя сервера скрыто'}`);
      console.log(`   🌐 IP: ${currentServer ? `${currentServer.ip}:${currentServer.port}` : 'N/A'}`);
      console.log(`   ⏱️ В игре: ${formatMs(durationMs)} (с ${startTime.toLocaleTimeString()})\n`);
    }

    // --- ТОП СЕРВЕРОВ ПО TIME PLAYED ---
    console.log(`🏆 ТОП СЕРВЕРОВ ПО НАИГРАННОМУ ВРЕМЕНИ (из ${serversList.length} всего):`);
    serversList.slice(0, 10).forEach((srv, idx) => {
      console.log(`   ${idx + 1}. ${srv.name}`);
      console.log(`      └─ Время на сервере: ${formatSeconds(srv.timePlayedSeconds)} | Заходил: ${srv.lastSeen.toLocaleDateString()}`);
    });

  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка API (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Ошибка запроса:', error.message);
    }
  }
}

getFullPlayerStatus(playerId);