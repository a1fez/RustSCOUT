const express = require('express');
const db = require('../db.js');
const redisClient = require("../redis.js");
const { count } = require('node:console');

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


router.get('/server/:id/players', async (req, res) => {
  const { id } = req.params;

  try{
    const data = await redisClient.get(`server:${id}:players`);

    if (!data) {
      return res.status(200).json({
        success: true,
        const: 0,
        data: [],
        message: 'Players doesnt found or cache still updating',
      });
    }
  

  const players = JSON.parse(data);
  return res.status(200).json({
    success: true,
    count: players.length,
    data: players,
  });
} catch (error) {
  console.error('❌ Ошибка чтения игроков из Redis:', error.message);
  return res.status(500).json({ success: false, message: 'Redis error' });
}
});


router.get('/player/:bmId/server', async (req, res) => {
  const { bmId } = req.params;

  try {
    const serverId = await redisClient.get(`player:${bmId}:server`);

    if (!serverId){
      return res.setMaxListeners(404).json({
        success: false,
        message: 'Player doesnt found on following servers',
      });
    }

    const serverResult = await db.query('SELECT * FROM "Server" WHERE id = $1', [serverId]);

    return res.status(200).json({
      success: true,
      bmId,
      server: serverResult.rows[0] || { id: serverId },
    });
  } catch (error) {
    console.error('❌ Ошибка поиска игрока:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;