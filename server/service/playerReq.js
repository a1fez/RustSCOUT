const axios = require('axios');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { getBySteamId, upsertVerified } = require('./verifiedPlayers.js');
const { scheduleRequest } = require('../rateLimiter.js');

const BROWSER_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return BROWSER_USER_AGENTS[Math.floor(Math.random() * BROWSER_USER_AGENTS.length)];
}

// Кэш полного ответа BM по игроку. Гасит повторные поиски того же bmId
// (удалил карточку и снова запросил, перезагрузка модалки и т.п.) — экономит
// 2 запроса к BattleMetrics (/players + /sessions) на каждое такое открытие.
//
// FRESH — сколько секунд ответ считается актуальным и отдаётся сразу.
// STALE — сколько ещё держим его в Redis, чтобы отдать при 429 / сбое BM,
//         не роняя карточку в ошибку.
const FULL_STATUS_FRESH_SECONDS = 120;
const FULL_STATUS_STALE_SECONDS = 20 * 60;

/**
 * Коды причин, по которым мы НЕ отдаём данные клиенту.
 * Используются в server.js, чтобы вернуть внятный ответ фронту.
 */
const NoMatchReason = {
  STEAM_NOT_FOUND: 'steam_not_found',
  NO_SERVER_PROVIDED: 'no_server_provided',
  REDIS_KEY_EMPTY: 'redis_key_empty',
  NAME_NOT_MATCHED: 'name_not_matched',
  BM_REQUEST_FAILED: 'bm_request_failed',
};

/**
 * Возвращает специальный объект-результат "не найдено" с указанием причины.
 */
function notFound(reason, extra = {}) {
  return { matched: false, reason, ...extra };
}

/**
 * Шаг 1: получить профиль Steam по SteamID64.
 */
async function fetchSteamProfile(steamId, steamApiKey) {
  const steamRes = await axios.get(
    'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
    { params: { key: steamApiKey.trim(), steamids: steamId } }
  );

  const players = steamRes.data?.response?.players;
  if (!players || players.length === 0) return null;
  return players[0];
}

/**
 * Шаг 2: найти bmId по нику среди онлайн-игроков конкретного сервера (кэш Redis).
 */
async function findBmIdOnServer(serverId, steamName, redisClient) {
  const redisKey = `server:${serverId}:players`;
  const rawData = await redisClient.get(redisKey);
  if (!rawData) return null;

  let serverPlayers;
  try {
    serverPlayers = JSON.parse(rawData);
  } catch {
    return null;
  }

  const matched = serverPlayers.find(
    (p) => p.name && p.name.trim().toLowerCase() === steamName.trim().toLowerCase()
  );

  return matched ? String(matched.bmId) : null;
}

/**
 * Шаг 3: полная статистика игрока по bmId (сервера, наигранное время, текущая сессия).
 * redisClient — опционален; если передан, свежий ответ отдаётся из кэша,
 * а при 429 / сбое BM отдаётся устаревшая копия вместо ошибки.
 */
async function getFullPlayerStatus(bmId, redisClient = null) {
  const cacheKey = `player:${bmId}:full`;

  // Из кэша: свежий — отдаём сразу; протухший — держим как запас на случай 429.
  let staleData = null;
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const entry = JSON.parse(cached);
        // Совместимость со старым форматом (голый объект результата без обёртки).
        const payload = entry && entry.data ? entry.data : entry;
        const cachedAt = entry && entry.cachedAt ? entry.cachedAt : 0;
        if (Date.now() - cachedAt < FULL_STATUS_FRESH_SECONDS * 1000) {
          console.log(`💾 [playerReq] кэш-хит по игроку ${bmId}`);
          return payload;
        }
        staleData = payload;
      }
    } catch (err) {
      console.warn(`⚠️ [playerReq] чтение кэша ${cacheKey}:`, err.message);
    }
  }

  const token = process.env.battleMetricsKey;

  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    'User-Agent': getRandomUserAgent(),
  };

  // Оба запроса к BM — через общий лимитер: он держит потолок одновременных
  // запросов и общий cooldown после 429. При сбое отдаём устаревший кэш,
  // если он есть, вместо жёсткой ошибки.
  let playerRes;
  let sessionsRes;
  try {
    playerRes = await scheduleRequest(() =>
      axios.get(`https://api.battlemetrics.com/players/${bmId}`, {
        params: { include: 'server,identifier' },
        headers,
      })
    );
    sessionsRes = await scheduleRequest(() =>
      axios.get('https://api.battlemetrics.com/sessions', {
        params: { 'filter[players]': bmId, include: 'server', 'page[size]': 10 },
        headers,
      })
    );
  } catch (err) {
    if (staleData) {
      const code = err.response?.status || err.code || err.message;
      console.warn(`⚠️ [playerReq] BM недоступен (${code}) — отдаю устаревший кэш по ${bmId}`);
      return staleData;
    }
    throw err;
  }

  const nicknamesBM = [];
  const player = playerRes.data.data;
  const included = playerRes.data.included || [];

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

  const sessions = sessionsRes.data.data || [];
  const sessionServers = sessionsRes.data.included || [];

  const sessionServerMap = {};
  sessionServers.forEach((srv) => {
    sessionServerMap[srv.id] = srv.attributes;
  });

  serversList.sort((a, b) => b.timePlayedSeconds - a.timePlayedSeconds);

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

  const result = {
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

  if (redisClient) {
    try {
      await redisClient.set(
        cacheKey,
        JSON.stringify({ data: result, cachedAt: Date.now() }),
        { EX: FULL_STATUS_STALE_SECONDS }
      );
    } catch (err) {
      console.warn(`⚠️ [playerReq] запись кэша ${cacheKey}:`, err.message);
    }
  }

  return result;
}

/**
 * Главная точка входа: проходит ВСЮ цепочку Steam -> Redis -> BattleMetrics.
 * Возвращает либо { matched: true, ...полные_данные }, либо { matched: false, reason }.
 * Ничего не отдаётся клиенту, пока эта функция не отработает до конца.
 */
async function resolvePlayerOnServer(steamId, serverId, redisClient) {
  const steamApiKey = process.env.steamApiKey || process.env.STEAM_API_KEY;
  if (!steamApiKey) {
    throw new Error('API ключ Steam не задан в .env');
  }

  // Шаг 1: Steam
  const steamUser = await fetchSteamProfile(steamId, steamApiKey);
  if (!steamUser) {
    return notFound(NoMatchReason.STEAM_NOT_FOUND);
  }

  // Шаг 2: определить bmId.
  // Если связка уже подтверждена прошлым поиском — берём bmId из БД и не ищем
  // игрока в Redis (работает даже когда игрок сейчас оффлайн / не в кэше).
  let foundBmId = null;
  try {
    const verified = await getBySteamId(steamId);
    if (verified?.bmId) foundBmId = String(verified.bmId);
  } catch (err) {
    console.error('❌ [verifiedPlayers] Чтение связки не удалось:', err.message);
  }

  if (!foundBmId) {
    if (!serverId || serverId === 'undefined' || serverId.trim() === '') {
      return notFound(NoMatchReason.NO_SERVER_PROVIDED, { steam: steamUser });
    }

    // Сопоставление по нику среди онлайн-игроков сервера (кэш Redis).
    foundBmId = await findBmIdOnServer(serverId.trim(), steamUser.personaname, redisClient);
    if (!foundBmId) {
      return notFound(NoMatchReason.NAME_NOT_MATCHED, { steam: steamUser });
    }
  }

  // Шаг 3: BattleMetrics (через лимитер, с кэшем свежести/устаревания по bmId)
  let bmData;
  try {
    bmData = await getFullPlayerStatus(foundBmId, redisClient);
  } catch (err) {
    return notFound(NoMatchReason.BM_REQUEST_FAILED, { steam: steamUser, error: err.message });
  }

  // Цепочка прошла целиком — подтверждаем связку steamId + bmId.
  try {
    await upsertVerified({ steamId, bmId: bmData.bmId, personaname: steamUser.personaname });
  } catch (err) {
    console.error('❌ [verifiedPlayers] Сохранение связки не удалось:', err.message);
  }

  // Всё прошло успешно — только теперь собираем финальный ответ
  return {
    matched: true,
    steamId,
    bmId: bmData.bmId,
    isOnline: bmData.isOnline,
    currentServer: bmData.currentServer,
    steam: {
      personaname: steamUser.personaname,
      avatarfull: steamUser.avatarfull,
      profileurl: steamUser.profileurl,
      personastate: steamUser.personastate,
    },
    battleMetrics: bmData.battleMetrics,
    servers: bmData.servers,
    nicknames: bmData.nicknames,
  };
}

module.exports = {
  resolvePlayerOnServer,
  NoMatchReason,
};