// Единый источник правды по тирам опроса серверов.
// Используется и playerScraper.js (кто как часто опрашивается),
// и tierResolver.js / отслеживанием игроков (с каким кадэнсом
// перепроверять игрока — он совпадает с кадэнсом обновления его сервера).

const TIERS = [
  { key: 'TIER_1', name: 'TIER_1 (1-100)',   limit: 100, offset: 0,   intervalMs: 60 * 1000,  startDelayMs: 20000 },
  { key: 'TIER_2', name: 'TIER_2 (101-200)', limit: 100, offset: 100, intervalMs: 120 * 1000, startDelayMs: 25000 },
  { key: 'TIER_3', name: 'TIER_3 (201-300)', limit: 100, offset: 200, intervalMs: 180 * 1000, startDelayMs: 30000 },
];

// rank — позиция сервера (0-based) в списке "online" серверов, отсортированном по players DESC.
function tierForRank(rank) {
  if (typeof rank !== 'number' || rank < 0) return null;
  for (const tier of TIERS) {
    if (rank >= tier.offset && rank < tier.offset + tier.limit) return tier;
  }
  return null;
}

module.exports = { TIERS, tierForRank };
