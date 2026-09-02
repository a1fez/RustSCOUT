const axios = require('axios');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

/**
 * Получение полного статуса и истории игрока по его BattleMetrics ID
 * @param {string|number} id - BattleMetrics Player ID
 * @returns {Promise<object>}
 */
async function getFullPlayerStatus(id) {
  const token = process.env.battleMetricsKey;

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    'User-Agent': getRandomUserAgent(),
  };

  // 1. Профиль игрока + связанные сервера и идентификаторы
  const playerRes = await axios.get(`https://api.battlemetrics.com/players/${id}`, {
    params: { include: 'server,identifier' },
    headers,
  });
  
  const nicknamesBM = [];
  const player = playerRes.data.data;
  const included = playerRes.data.included || [];

  // 2. Сессии для проверки реального онлайн-статуса
  const sessionsRes = await axios.get(`https://api.battlemetrics.com/sessions`, {
    params: {
      'filter[players]': id,
      include: 'server',
      'page[size]': 10,
    },
    headers,
  });

  const sessions = sessionsRes.data.data || [];
  const sessionServers = sessionsRes.data.included || [];

  const sessionServerMap = {};
  sessionServers.forEach((srv) => {
    sessionServerMap[srv.id] = srv.attributes;
  });

  // Обработка серверов и наигранного времени
  let grandTotalSeconds = 0;
  const serversList = [];

  included.forEach((item) => {
    if (item.type === 'server') {
      const timePlayed = item.meta?.timePlayed || 0;
      grandTotalSeconds += timePlayed;

      serversList.push({
        serverId: item.id,
        name: item.attributes?.name || 'Неизвестный сервер',
        ip: item.attributes ? `${item.attributes.ip}:${item.attributes.port}` : 'N/A',
        timePlayedSeconds: timePlayed,
        lastSeen: item.meta?.lastSeen
          ? new Date(item.meta.lastSeen).toLocaleDateString('ru-RU')
          : '—',
      });

    }

    if (item.type === 'identifier') {
      nicknamesBM.push(item.attributes?.identifier);

    }
  });



  // Сортировка серверов по наигранному времени
  serversList.sort((a, b) => b.timePlayedSeconds - a.timePlayedSeconds);

  // Проверка активности
  const activeSession = sessions.find((s) => s.attributes.stop === null);
  const isOnlineNow = Boolean(activeSession);

  let currentServer = null;
  if (isOnlineNow && activeSession) {
    const currentServerId = activeSession.relationships?.server?.data?.id;
    const currentServerAttr = sessionServerMap[currentServerId];
    currentServer = {
      id: currentServerId,
      name: currentServerAttr ? currentServerAttr.name : 'Имя сервера скрыто',
      ip: currentServerAttr ? `${currentServerAttr.ip}:${currentServerAttr.port}` : 'N/A',
    };
  }


  
  

  return {
    bmId: String(player.id),
    isOnline: isOnlineNow,
    currentServer,
    battleMetrics: {
      playtime: Math.round(grandTotalSeconds / 3600),
      firstSeen: player.attributes?.createdAt
        ? new Date(player.attributes.createdAt).toLocaleDateString('ru-RU')
        : '—',
    },
    servers: serversList,
    nicknames: nicknamesBM,
  };
}

module.exports = {
  getFullPlayerStatus,
};