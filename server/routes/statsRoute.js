const express = require('express');
const { readStats } = require('../service/analytics.js');

const router = express.Router();

// Приватный дашборд-эндпоинт. Доступ только по токену из .env (STATS_TOKEN).
// Токен принимаем из ?token=... или заголовка Authorization: Bearer <token>.
router.get('/stats', async (req, res) => {
  const expected = process.env.STATS_TOKEN;
  if (!expected) {
    console.warn('⚠️ [stats] STATS_TOKEN не задан в .env — эндпоинт закрыт');
    return res.status(503).json({ error: 'stats disabled: STATS_TOKEN not set' });
  }

  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = req.query.token || bearer;
  if (token !== expected) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const data = await readStats();
    // не кэшировать
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data });
  } catch (err) {
    console.error('❌ [stats] readStats:', err.message);
    return res.status(500).json({ success: false, error: 'internal error' });
  }
});

module.exports = router;
