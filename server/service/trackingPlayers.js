// Возвращает актуальные статусы всех отслеживаемых игроков из реестра.
// Базовый статус (online / покинул сервер) пишет playerScraper при обновлении
// сервера в ритме его тира; здесь только лёгкое до-обновление по свежему ключу
// player:<bmId>:server, чтобы ответ не отставал сильнее одного цикла скрапера.
//
// Дополнительно резолвим человекочитаемые имена серверов (currentServerName /
// serverName / initialServerName), чтобы фронт не держал свою карту id -> имя
// и не спотыкался о серверы вне топ-списка (см. serverNames.js).

const redisSingleton = require('../redis.js');
const { getAllTracked } = require('./trackingRegistry.js');
const { resolveServerNames } = require('./serverNames.js');

async function checkPlayersStatus(redisClient = redisSingleton) {
  const tracked = await getAllTracked();
  if (!tracked.length) return [];

  const withBm = tracked.filter((t) => t.bmId);
  const freshServerIds = withBm.length
    ? await redisClient.mGet(withBm.map((t) => `player:${t.bmId}:server`))
    : [];

  const freshBySteam = {};
  withBm.forEach((t, idx) => {
    freshBySteam[t.steamId] = freshServerIds[idx] || null;
  });

  const rows = tracked.map((t) => {
    const fresh = t.bmId ? freshBySteam[t.steamId] : null;
    const currentServerId = fresh ?? t.status?.currentServerId ?? null;
    const onInitialServer = currentServerId ? currentServerId === t.initialServerId : false;

    return {
      steamId: t.steamId,
      bmId: t.bmId,
      personaname: t.personaname,
      tier: t.tierKey,
      intervalMs: t.intervalMs,
      initialServerId: t.initialServerId,
      serverId: t.serverId,
      isOnline: Boolean(currentServerId) || Boolean(t.status?.stillListedByName),
      currentServerId,
      onInitialServer,
      hasLeftInitialServer: Boolean(currentServerId) && !onInitialServer,
      stillListedByName: t.status?.stillListedByName ?? null,
      lastCheckedAt: t.status?.lastCheckedAt ?? null,
      startedAt: t.startedAt,
      expiresAt: t.expiresAt,
    };
  });

  // Имена серверов одним пакетом на весь ответ.
  const nameById = await resolveServerNames(
    rows.flatMap((r) => [r.currentServerId, r.serverId, r.initialServerId])
  );

  return rows.map((r) => ({
    ...r,
    currentServerName: r.currentServerId ? nameById[String(r.currentServerId)] || null : null,
    serverName: r.serverId ? nameById[String(r.serverId)] || null : null,
    initialServerName: r.initialServerId ? nameById[String(r.initialServerId)] || null : null,
  }));
}

module.exports = { checkPlayersStatus };
