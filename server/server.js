// Загрузка .env и фоновых сервисов
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, './.env') });
require('./service/serverList.js');
require('./service/playerScraper.js');
require('./auth.js');

const { searchRateLimit } = require('./service/searchRateLimit.js');
const { RedisStore } = require('connect-redis');
const session = require('express-session');
const express = require('express');
const cors = require('cors');
const redisClient = require('./redis.js')
const passport = require('passport');


// Поллер отслеживаемых игроков: раз в 10с перечитывает Redis по каждому
// отслеживаемому игроку и списку его сервера.
const { startTrackingPoller } = require('./service/trackingReconcile.js');
const { startActivityFlusher } = require('./service/activityRecorder.js');
const { startNameIndex } = require('./service/nameIndex.js');
const { clearAllTracked } = require('./service/trackingRegistry.js');

// При старте сервера сбрасываем реестр отслеживания — фронт всё равно потерял
// карточки, а висящие записи дали бы фантомное отслеживание.
clearAllTracked()
  .then(() => console.log('🧹 [Tracking] Реестр отслеживания очищен при старте'))
  .catch((err) => console.error('❌ [Tracking] Не удалось очистить реестр при старте:', err.message));

startTrackingPoller();
startActivityFlusher();
startNameIndex();

// Импорт функции сопоставления и сбора данных игрока
const { resolvePlayerOnServer, resolvePlayerByBmId, NoMatchReason } = require('./service/playerReq.js');

// Импорт роутов серверов (PostgreSQL)
const serverRoutes = require('./routes/serverRoute.js');
const playerRoutes = require('./routes/playerRoutes.js');
const statsRoutes = require('./routes/statsRoute.js');
const liveStatsRoutePlayers = require('./routes/liveStatsRoutePlayers.js')
const nameSearchRoute = require('./routes/nameSearchRoute.js');
const { analyticsMiddleware } = require('./service/analytics.js');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5001;



//redis

let redisStore = new RedisStore({
  client: redisClient,
  prefix: "myapp",
})



app.use(
  session({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 1}
}))

app.get('/api/session-test', (req, res) => {
  req.session.visits = (req.session.visits || 0) + 1;
  res.json({ visits: req.session.visits });
});

// Middlewares
app.use(cors({
  origin: process.env.APP_CLIENT_URL,
  credentials: true,
}));
app.use(express.json());



// Аналитика посещаемости (считает все запросы к API, кроме самого /api/stats)
app.use(analyticsMiddleware);

// Приватный дашборд статистики (гейт по STATS_TOKEN из .env)
app.use('/api', statsRoutes);
app.use('/api', liveStatsRoutePlayers);

// Роуты серверов
app.use('/api', serverRoutes);

// Роуты игроков
app.use('/api', playerRoutes(redisClient));

app.use('/api/players/search', searchRateLimit(redisClient, { name: 'suggest', limit: 120}));
app.use('/api', nameSearchRoute);

// Passport Auth Steam
app.use(passport.initialize());
app.use(passport.session());



app.get('/api/auth/steam', passport.authenticate('steam'));

app.get('/api/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), (req, res) => {
  // Успешная аутентификация, редирект на фронт
  res.redirect(process.env.APP_CLIENT_URL + '/');
});

app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({error: 'Не авторизован'})
  }
  res.json({
    name: req.user.personaname,
    steamId: req.user.steamId,
    avatarfull: req.user.avatarLink,
    profileUrl: 'https://steamcommunity.com/profiles/' + req.user.steamId,
    linkedAt: new Date(req.user.createdAt).toLocaleDateString('ru-Ru'),
    plan: 'FREE',
  })
})

app.post('/api/auth/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
});

// Роут поиска игрока
// Отдаёт данные, ТОЛЬКО когда вся цепочка Steam -> Redis -> BattleMetrics
// прошла успешно. Иначе — 404 с указанием причины, без фейковой карточки.
app.get('/api/player/:steamId', searchRateLimit(redisClient), async (req, res) => {
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


app.get('/api/player/bm/:bmId', searchRateLimit(redisClient), async(req, res) => {
  const {bmId} = req.params;
  if (!/^\d{1,18}$/.test(bmId)) {
    return res.status(400).json({ matched: false, reason: 'bm_player_not_found' });
  }

  try {
    const result = await resolvePlayerByBmId(bmId, redisClient);
    if (!result.matched) {
      const status = result.reason === NoMatchReason.BM_PLAYER_NOT_FOUND ? 404 : 502;
      return res.status(status).json({ matched: false, reason: result.reason });
    }
    return res.json(result);
  } catch (error) {
    console.error('❌ Ошибка роута /api/player/bm/:bmId:', error.message);
    return res.status(500).json({ matched: false, reason: 'bm_request_failed' });
  }
});
// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});