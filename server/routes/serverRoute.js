const express = require('express');
const db = require('../db.js');

const router = express.Router();

router.get('/servers', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "Server" ORDER BY players DESC LIMIT 200;'
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('❌ Ошибка получения серверов из БД:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;