// Лимит поисков игрока с одного IP: не больше SEARCH_LIMIT за SEARCH_WINDOW_SEC.
// Счётчик живёт в Redis — переживает перезапуск сервера.
const SEARCH_LIMIT = 15;
const SEARCH_WINDOW_SEC = 60;

function searchRateLimit(redisClient, { name = 'search', limit = SEARCH_LIMIT} = {}) {
  return async (req, res, next) => {
    const key = `ratelimit:${name}:${req.ip}`;
    try {
      const count = await redisClient.incr(key);
      if (count === 1) await redisClient.expire(key, SEARCH_WINDOW_SEC);

      if (count > limit) {
        const ttl = await redisClient.ttl(key);
        res.set('Retry-After', String(Math.max(ttl, 1)));
        return res.status(429).json({ matched: false, reason: 'rate_limited' });
      }
      next();
    } catch (err) {
      // Redis лёг — лучше пропустить поиск, чем сломать сайт целиком
      console.error('❌ [SearchRateLimit] Ошибка Redis, лимит пропущен:', err.message);
      next();
    }
  };
}

module.exports = { searchRateLimit };