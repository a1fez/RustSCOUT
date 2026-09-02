const express = require('express');
const router = express.Router();
const { checkPlayersStatus } = require('../service/trackingPlayers');

// Передаем redisClient через замыкание или req.app
module.exports = (redisClient) => {
  router.post('/status', async (req, res) => {
    try {
      const data = await checkPlayersStatus(redisClient, req.body.players);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};