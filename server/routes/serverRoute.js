const express = require('express');
const prisma = require('../prisma.js');

const router = express.Router();

router.get('/servers', async (req, res) => {
  try {
    const servers = await prisma.server.findMany({
      orderBy: {
        players: 'desc',
      },
      take: 100,
    });

    return res.status(200).json({
      success: true,
      count: servers.length,
      data: servers,
    });
  } catch (error) {
    console.error('❌ Ошибка получения серверов из БД:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

module.exports = router;