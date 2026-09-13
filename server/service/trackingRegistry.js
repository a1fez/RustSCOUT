// Реестр отслеживаемых игроков. Живёт в Redis, но при старте сервера очищается
// (см. server.js) — после рестарта фронт всё равно теряет карточки, а висящие
// записи привели бы к «фантомному» отслеживанию.
// Пишется из роутов (/track, /untrack, /untrack-all), обновляется из
// playerScraper.js при каждом обновлении сервера, читается из /status.
//
// Записи в реестре принадлежат конкретному клиенту (см. clientId в роутах) —
// иначе все анонимные пользователи делили бы один и тот же список
// отслеживаемых и видели бы чужой журнал. Поле хеша — "<clientId>::<steamId>",
// это позволяет разным клиентам независимо отслеживать одного и того же
// игрока. getAllTracked()/getTrackedByServer() отдают записи всех клиентов —
// они используются только внутренним реконсайлером, который обновляет статус
// вне зависимости от того, чей это трекинг.

const redisClient = require('../redis.js');

const REG_KEY = 'tracked:players';        // Redis hash: field = "<clientId>::<steamId>", value = JSON entry
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

function fieldFor(clientId, steamId) {
  return `${clientId}::${steamId}`;
}

/**
 * Ставит игрока на отслеживание. Если по этому клиенту уже есть живая
 * (не просроченная) запись — не трогаем её и просто возвращаем как есть:
 * не сбрасываем накопленный status (например, hasLeftInitialServer) и не
 * продлеваем TTL сверх того, что было запрошено изначально.
 */
async function addTracked({ clientId, steamId, bmId, personaname, serverId, tierKey, intervalMs, durationMs }) {
  const field = fieldFor(clientId, steamId);
  const existingRaw = await redisClient.hGet(REG_KEY, field);
  const existing = existingRaw && safeParse(existingRaw);
  if (existing && !isExpired(existing)) return existing;

  const now = Date.now();
  const sid = serverId ? String(serverId) : null;
  const ttl = Math.min(
    Math.max(Number(durationMs) || TRACK_TTL_MS, 30 * 1000),
    TRACK_TTL_MAX_MS
  );

  const entry = {
    clientId: String(clientId),
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

  await redisClient.hSet(REG_KEY, field, JSON.stringify(entry));
  return entry;
}

async function removeTracked(clientId, steamId) {
  await redisClient.hDel(REG_KEY, fieldFor(clientId, steamId));
}

// Полностью очистить реестр отслеживания (используется только при старте сервера).
async function clearAllTracked() {
  await redisClient.del(REG_KEY);
}

// Снять с отслеживания всех игроков конкретного клиента, не трогая чужие записи.
async function clearTrackedForClient(clientId) {
  const all = await redisClient.hGetAll(REG_KEY);
  const fields = Object.entries(all)
    .filter(([, raw]) => safeParse(raw)?.clientId === clientId)
    .map(([field]) => field);
  if (fields.length > 0) await redisClient.hDel(REG_KEY, fields);
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
  const expiredFields = [];
  for (const entry of entries) {
    if (isExpired(entry)) expiredFields.push(fieldFor(entry.clientId, entry.steamId));
    else live.push(entry);
  }

  if (expiredFields.length > 0) {
    await redisClient.hDel(REG_KEY, expiredFields);
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
async function patchTracked(clientId, steamId, patch) {
  const field = fieldFor(clientId, steamId);
  const raw = await redisClient.hGet(REG_KEY, field);
  const entry = raw && safeParse(raw);
  if (!entry) return null;

  const updated = {
    ...entry,
    ...patch,
    status: { ...entry.status, ...(patch.status || {}) },
  };

  await redisClient.hSet(REG_KEY, field, JSON.stringify(updated));
  return updated;
}

module.exports = {
  addTracked,
  removeTracked,
  clearAllTracked,
  clearTrackedForClient,
  countTracked,
  getAllTracked,
  getTrackedByServer,
  patchTracked,
  isExpired,
  TRACK_TTL_MS,
};
