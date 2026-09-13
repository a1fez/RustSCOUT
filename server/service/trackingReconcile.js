// Перепроверка отслеживаемых игроков — ТОЛЬКО по Redis, без запросов к BattleMetrics.
//
// Redis наполняет playerScraper, опрашивая сервера по тирам (60/120/180с).
// Здесь мы лишь читаем то, что уже лежит в Redis:
//   - server:<id>:players   — список игроков сервера
//   - player:<bmId>:server  — где игрок сейчас
//
// Триггеры (логика одна — reconcileEntry):
//   1) хук из playerScraper — как только сервер обновился в кэше;
//   2) поллер каждые 10с — перечитывает Redis по каждому отслеживаемому игроку.

const redisClient = require('../redis.js');
const {
  getAllTracked,
  getTrackedByServer,
  patchTracked,
  removeTracked,
  countTracked,
  isExpired,
} = require('./trackingRegistry.js');

const POLL_INTERVAL_MS = 10 * 1000; // как часто перечитываем Redis по отслеживаемым

/**
 * Пересобирает статус одного игрока по списку игроков его сервера (из Redis).
 * playersOnServer — массив { bmId, name } из server:<entry.serverId>:players.
 * opts.fresh — список только что получен скрапером именно для entry.serverId
 *   (а не прочитан из кэша, которому может быть до TTL_SECONDS). Только в этом
 *   случае «нет в списке» трактуется как выход и ключ player:<bmId>:server
 *   чистится сразу, не дожидаясь его TTL (иначе «покинул» приходил бы ~4 мин).
 * Возвращает новый status или null, если запись просрочена и удалена.
 */
async function reconcileEntry(entry, playersOnServer, { fresh = false } = {}) {
  if (isExpired(entry)) {
    await removeTracked(entry.clientId, entry.steamId);
    return null;
  }

  const list = Array.isArray(playersOnServer) ? playersOnServer : [];

  // 1) есть ли игрок сейчас в списке своего сервера — по нику или по bmId
  const norm = (s) => (s || '').trim().toLowerCase();
  const nameMatch = entry.personaname
    ? list.find((p) => p.name && norm(p.name) === norm(entry.personaname))
    : null;
  const bmIdListed = entry.bmId
    ? list.some((p) => String(p.bmId) === String(entry.bmId))
    : false;
  const listedHere = Boolean(nameMatch) || bmIdListed;

  // 2) где игрок сейчас по ключу player:<bmId>:server (его тоже пишет скрапер)
  let currentServerId = null;
  if (entry.bmId) {
    currentServerId = await redisClient.get(`player:${entry.bmId}:server`);
  }

  // Свежий скрейп именно этого сервера, список не пустой, а игрока в нём нет,
  // и ключ всё ещё указывает сюда — значит игрок ушёл отсюда. Чистим ключ
  // немедленно, чтобы «покинул» пришло за интервал скрейпа, а не за TTL (240с).
  if (
    fresh &&
    list.length > 0 &&
    !listedHere &&
    entry.bmId &&
    currentServerId &&
    String(currentServerId) === String(entry.serverId)
  ) {
    await redisClient.del(`player:${entry.bmId}:server`);
    currentServerId = null;
  }

  if (!currentServerId && nameMatch) {
    currentServerId = entry.serverId ? String(entry.serverId) : null;
  }

  const onInitialServer = currentServerId
    ? currentServerId === entry.initialServerId
    : false;

  const status = {
    isOnline: Boolean(currentServerId || nameMatch),
    currentServerId: currentServerId || (nameMatch && entry.serverId ? String(entry.serverId) : null),
    onInitialServer,
    hasLeftInitialServer: Boolean(currentServerId) && !onInitialServer,
    stillListedByName: Boolean(nameMatch),
    lastCheckedAt: Date.now(),
  };

  const patch = { status };

  // Игрок переехал — дальше сверяем со списком нового сервера.
  if (status.currentServerId && status.currentServerId !== entry.serverId) {
    patch.serverId = status.currentServerId;
  }

  await patchTracked(entry.clientId, entry.steamId, patch);
  return status;
}

function logStatus(tag, entry, status) {
  if (!status) return;
  console.log(
    `🎯 [Tracking/${tag}] ${entry.personaname || entry.steamId}: online=${status.isOnline} ` +
    `server=${status.currentServerId || '-'} listed=${status.stillListedByName} ` +
    `(initial=${entry.initialServerId})`
  );
}

/**
 * Хук скрапера: сервер serverId только что обновлён, players — его свежий список из Redis.
 */
async function reconcileTrackedOnServer(serverId, players) {
  let trackedHere;
  try {
    if ((await countTracked()) === 0) return;
    trackedHere = await getTrackedByServer(serverId);
  } catch (err) {
    console.error('❌ [Tracking] Не удалось прочитать реестр:', err.message);
    return;
  }
  if (trackedHere.length === 0) return;

  for (const entry of trackedHere) {
    try {
      logStatus('scrape', entry, await reconcileEntry(entry, players, { fresh: true }));
    } catch (err) {
      console.error(`❌ [Tracking] ${entry.steamId}:`, err.message);
    }
  }
}

let pollBusy = false;

/**
 * Поллер: раз в 10с перечитывает Redis по каждому отслеживаемому игроку.
 * server:<id>:players читается один раз на сервер, а не на каждого игрока.
 * Никаких запросов наружу — только Redis.
 */
async function reconcileAllFromRedis() {
  if (pollBusy) return;
  pollBusy = true;

  try {
    let tracked;
    try {
      tracked = await getAllTracked();
    } catch (err) {
      console.error('❌ [Tracking/poll] Реестр недоступен:', err.message);
      return;
    }
    if (tracked.length === 0) return;

    // Группируем по серверу — один redis.get(server:<id>:players) на сервер
    const byServer = new Map();
    for (const entry of tracked) {
      const sid = entry.serverId || '_none';
      if (!byServer.has(sid)) byServer.set(sid, []);
      byServer.get(sid).push(entry);
    }

    for (const [sid, entries] of byServer) {
      let players = [];
      if (sid !== '_none') {
        try {
          const raw = await redisClient.get(`server:${sid}:players`);
          if (raw) players = JSON.parse(raw);
        } catch (err) {
          console.error(`❌ [Tracking/poll] server:${sid}:players — ${err.message}`);
        }
      }

      for (const entry of entries) {
        try {
          logStatus('poll', entry, await reconcileEntry(entry, players));
        } catch (err) {
          console.error(`❌ [Tracking/poll] ${entry.steamId}:`, err.message);
        }
      }
    }
  } finally {
    pollBusy = false;
  }
}

let pollerHandle = null;

function startTrackingPoller(intervalMs = POLL_INTERVAL_MS) {
  if (pollerHandle) return pollerHandle;
  console.log(`🎯 [Tracking] Поллер запущен: чтение Redis по отслеживаемым каждые ${intervalMs / 1000}с`);
  pollerHandle = setInterval(() => {
    reconcileAllFromRedis().catch((err) =>
      console.error('❌ [Tracking/poll] Необработанная ошибка:', err.message)
    );
  }, intervalMs);
  return pollerHandle;
}

function stopTrackingPoller() {
  if (pollerHandle) {
    clearInterval(pollerHandle);
    pollerHandle = null;
  }
}

module.exports = {
  reconcileEntry,
  reconcileTrackedOnServer,
  reconcileAllFromRedis,
  startTrackingPoller,
  stopTrackingPoller,
  POLL_INTERVAL_MS,
};
