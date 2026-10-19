const express = require('express');
const { searchByName, MIN_QUERY_LENGTH } = require('../service/nameIndex.js');

const router = express.Router();

router.get('/players/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < MIN_QUERY_LENGTH || q.length > 64) {
    return res.status(400).json({ success: false, error: 'bad_query' });
  }

  try {
    const data = await searchByName(q);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Ошибка роута /api/players/search:', err.message);
    return res.status(500).json({ success: false, error: 'search_failed' });
  }
});

module.exports = router;