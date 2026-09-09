const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6380',
});

redisClient.on('error', (err) => console.error('❌ Ошибка Redis:', err.message));
redisClient.on('connect', () => console.log('✅ [Redis] Клиент подключен'));

(async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
})();

module.exports = redisClient;