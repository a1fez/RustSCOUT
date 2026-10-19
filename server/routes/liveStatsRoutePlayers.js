const express = require('express');
const redisClient = require('../redis.js');
const { TIERS } = require('../service/tiers.js');

const router = express.Router();

// Публичная сводка для строки под поиском: сколько серверов опрашиваем и сколько игроков в Redis.
// Скрапер после каждого тира пишет stats:tier:<key>, тут просто складываем.
router.get('/live-stats', async (req, res) => {
  try {
    const raw = await redisClient.mGet(TIERS.map((t) => `stats:tier:${t.key}`));

    let servers = 0;
    let players = 0;
    let updatedAt = null;
    for (const item of raw) {
      if (!item) continue; // тир ещё не отработал или данные протухли
      const s = JSON.parse(item);
      servers += s.servers;
      players += s.players;
      updatedAt = Math.max(updatedAt ?? 0, s.updatedAt);
    }

    res.set('Cache-Control', 'public, max-age=30');
    return res.json({ success: true, data: { servers, players, updatedAt } });
  } catch (err) {
    console.error('❌ [live-stats] Ошибка чтения из Redis:', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;