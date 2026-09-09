// Реестр отслеживаемых игроков. Живёт в Redis, но при старте сервера очищается
// (см. server.js) — после рестарта фронт всё равно теряет карточки, а висящие
// записи привели бы к «фантомному» отслеживанию.
// Пишется из роутов (/track, /untrack, /untrack-all), обновляется из
// playerScraper.js при каждом обновлении сервера, читается из /status.

const redisClient = require('../redis.js');

const REG_KEY = 'tracked:players';        // Redis hash: field = steamId, value = JSON entry
const TRACK_TTL_MS = 5 * 60 * 1000;       // авто-стоп отслеживания по умолчанию — 5 минут
const TRACK_TTL_MAX_MS = 2 * 60 * 60 * 1000; // потолок — 2 часа

function isExpired(entry) {
  return !entry || !entry.expiresAt || Date.now() >= entry.expiresAt;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Ставит игрока на отслеживание (или продлевает, если уже стоит).
 */
async function addTracked({ steamId, bmId, personaname, serverId, tierKey, intervalMs, durationMs }) {
  const now = Date.now();
  const sid = serverId ? String(serverId) : null;
  const ttl = Math.min(
    Math.max(Number(durationMs) || TRACK_TTL_MS, 30 * 1000),
    TRACK_TTL_MAX_MS
  );

  const entry = {
    steamId: String(steamId),
    bmId: bmId ? String(bmId) : null,
    personaname: personaname || '',
    serverId: sid,            // сервер, по тиру которого сейчас идёт перепроверка (может смениться)
    initialServerId: sid,     // сервер, с которого началось отслеживание (не меняется)
    tierKey: tierKey || null,
    intervalMs: intervalMs || null,
    startedAt: now,
    expiresAt: now + ttl,
    status: {
      isOnline: null,
      currentServerId: null,
      onInitialServer: null,
      hasLeftInitialServer: false,
      stillListedByName: null,
      lastCheckedAt: null,
    },
  };

  await redisClient.hSet(REG_KEY, entry.steamId, JSON.stringify(entry));
  return entry;
}

async function removeTracked(steamId) {
  await redisClient.hDel(REG_KEY, String(steamId));
}

// Полностью очистить реестр отслеживания.
async function clearAllTracked() {
  await redisClient.del(REG_KEY);
}

async function countTracked() {
  return redisClient.hLen(REG_KEY);
}

/**
 * Все живые записи. Просроченные попутно вычищаются из Redis.
 */
async function getAllTracked() {
  const all = await redisClient.hGetAll(REG_KEY);
  const entries = Object.values(all).map(safeParse).filter(Boolean);

  const live = [];
  const expiredIds = [];
  for (const entry of entries) {
    if (isExpired(entry)) expiredIds.push(entry.steamId);
    else live.push(entry);
  }

  if (expiredIds.length > 0) {
    await redisClient.hDel(REG_KEY, expiredIds);
  }

  return live;
}

/**
 * Живые записи, привязанные к конкретному серверу (для хука в playerScraper).
 */
async function getTrackedByServer(serverId) {
  const target = String(serverId);
  const entries = await getAllTracked();
  return entries.filter((e) => e.serverId === target);
}

/**
 * Частичное обновление записи. patch.status мержится в существующий status.
 */
async function patchTracked(steamId, patch) {
  const raw = await redisClient.hGet(REG_KEY, String(steamId));
  const entry = raw && safeParse(raw);
  if (!entry) return null;

  const updated = {
    ...entry,
    ...patch,
    status: { ...entry.status, ...(patch.status || {}) },
  };

  await redisClient.hSet(REG_KEY, String(steamId), JSON.stringify(updated));
  return updated;
}

module.exports = {
  addTracked,
  removeTracked,
  clearAllTracked,
  countTracked,
  getAllTracked,
  getTrackedByServer,
  patchTracked,
  isExpired,
  TRACK_TTL_MS,
};
