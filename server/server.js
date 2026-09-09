const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('redis');

// Загрузка .env и фоновых сервисов
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
require('./service/serverList.js');
require('./service/playerScraper.js');

// Поллер отслеживаемых игроков: раз в 10с перечитывает Redis по каждому
// отслеживаемому игроку и списку его сервера.
const { startTrackingPoller } = require('./service/trackingReconcile.js');
const { clearAllTracked } = require('./service/trackingRegistry.js');

// При старте сервера сбрасываем реестр отслеживания — фронт всё равно потерял
// карточки, а висящие записи дали бы фантомное отслеживание.
clearAllTracked()
  .then(() => console.log('🧹 [Tracking] Реестр отслеживания очищен при старте'))
  .catch((err) => console.error('❌ [Tracking] Не удалось очистить реестр при старте:', err.message));

startTrackingPoller();

// Импорт функции сопоставления и сбора данных игрока
const { resolvePlayerOnServer, NoMatchReason } = require('./service/playerReq.js');

// Импорт роутов серверов (PostgreSQL)
const serverRoutes = require('./routes/serverRoute.js');
const playerRoutes = require('./routes/playerRoutes.js');
const statsRoutes = require('./routes/statsRoute.js');
const { analyticsMiddleware } = require('./service/analytics.js');

const app = express();
const PORT = process.env.PORT || 5001;

// Инициализация Redis клиента
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://redis:6379',
});

redisClient.on('error', (err) => console.error('❌ Ошибка Redis Client:', err));
redisClient.connect().then(() => {
  console.log('✅ Успешное подключение к Redis');
}).catch((err) => {
  console.error('❌ Не удалось подключиться к Redis:', err.message);
});

// Middlewares
app.use(cors());
app.use(express.json());

// Аналитика посещаемости (считает все запросы к API, кроме самого /api/stats)
app.use(analyticsMiddleware);

// Приватный дашборд статистики (гейт по STATS_TOKEN из .env)
app.use('/api', statsRoutes);

// Роуты серверов
app.use('/api', serverRoutes);

// Роуты игроков
app.use('/api', playerRoutes(redisClient));

// Роут поиска игрока
// Отдаёт данные, ТОЛЬКО когда вся цепочка Steam -> Redis -> BattleMetrics
// прошла успешно. Иначе — 404 с указанием причины, без фейковой карточки.
app.get('/api/player/:steamId', async (req, res) => {
  const { steamId } = req.params;
  const targetServer = req.query.server;

  console.log('\n================== [ДЕБАГ ПОИСКА] ==================');
  console.log(`SteamID: "${steamId}", сервер: "${targetServer}"`);

  try {
    const result = await resolvePlayerOnServer(steamId, targetServer, redisClient);

    if (!result.matched) {
      console.log(`❌ Не найдено. Причина: ${result.reason}`);

      const statusByReason = {
        [NoMatchReason.STEAM_NOT_FOUND]: 404,
        [NoMatchReason.NO_SERVER_PROVIDED]: 400,
        [NoMatchReason.REDIS_KEY_EMPTY]: 404,
        [NoMatchReason.NAME_NOT_MATCHED]: 404,
        [NoMatchReason.BM_REQUEST_FAILED]: 502,
      };

      return res.status(statusByReason[result.reason] || 404).json({
        matched: false,
        reason: result.reason,
        steam: result.steam || null,
      });
    }

    console.log(`✅ Подтверждено. bmId: ${result.bmId}`);
    return res.json(result);
  } catch (error) {
    console.error('❌ Ошибка роута /api/player/:steamId:', error.message);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});