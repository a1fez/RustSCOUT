// Чистая функция: принимает массив ID, возвращает статусы из Redis
async function checkPlayersStatus(redisClient, players) {
  if (!players?.length) return [];

  const valid = players.filter(p => p.bmId);
  const keys = valid.map(p => `player:${p.bmId}:server`);

  const serverResults = await redisClient.mGet(keys);

  return valid.map((p, idx) => {
    const currentServerId = serverResults[idx] || null;
    return {
      steamId: p.steamId,
      bmId: p.bmId,
      isOnline: Boolean(currentServerId),
      currentServerId,
      hasLeftInitialServer: p.initialServerId ? currentServerId !== String(p.initialServerId) : false,
    };
  });
}

module.exports = { checkPlayersStatus };