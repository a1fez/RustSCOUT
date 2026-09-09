const db = require('../db.js');
const { tierForRank } = require('./tiers.js');

/**
 * Определяет тир сервера по его позиции в рейтинге online-серверов (players DESC).
 * Возвращает { key, name, intervalMs, rank } или { key: null, ... } если сервер
 * вне отслеживаемого диапазона (или не найден в базе).
 */
async function resolveServerTier(serverId) {
  if (!serverId) return null;

  const { rows } = await db.query(
    `SELECT (
       SELECT COUNT(*)::int
       FROM "Server" s2
       WHERE s2.status = 'online' AND s2.players > s1.players
     ) AS rank
     FROM "Server" s1
     WHERE s1.id = $1`,
    [String(serverId)]
  );

  if (rows.length === 0) {
    return { key: null, name: 'UNKNOWN', intervalMs: null, rank: null };
  }

  const rank = rows[0].rank;
  const tier = tierForRank(rank);

  if (!tier) {
    return { key: null, name: 'UNTRACKED', intervalMs: null, rank };
  }

  return { key: tier.key, name: tier.name, intervalMs: tier.intervalMs, rank };
}

module.exports = { resolveServerTier };
