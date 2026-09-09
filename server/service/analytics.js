// Лёгкая аналитика посещаемости. Всё живёт в Redis, без внешних сервисов.
//
// Что считаем (ключи по локальной дате сервера, TTL ~45 дней):
//   stats:playerReq:<YYYY-MM-DD> — сколько раз за день запрашивали игрока
//                                  (GET /api/player/:steamId), INCR
//   stats:uv:<YYYY-MM-DD>        — уникальные посетители за день (HyperLogLog, PFADD)
//   stats:active                 — sorted set: visitorId -> время последнего запроса (мс)
//
// visitorId — это sha256(ip + user-agent + соль), первые 16 символов.
// Грубо: за одним NAT несколько людей склеятся в одного, при смене сети —
// раздвоятся. Для «примерно сколько народу» этого достаточно.

const crypto = require('crypto');
const redis = require('../redis.js');

const DAY_TTL_SEC = 45 * 24 * 60 * 60;
const ACTIVE_WINDOW_MS = 5 * 60 * 1000; // «активные сейчас» = запрос за последние 5 минут
const SALT = process.env.STATS_SALT || 'rustscout-default-salt';

// GET /api/player/<steamId> — поиск игрока. Исключаем /api/player/<id>/server.
const PLAYER_LOOKUP_RE = /^\/api\/player\/[^/]+$/;

function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || 'unknown';
}

function visitorId(req) {
  const raw = `${clientIp(req)}|${req.headers['user-agent'] || ''}|${SALT}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Express-middleware: вешать ПОСЛЕ express.json(), но до роутов.
 * Сам эндпоинт /api/stats не считаем, чтобы дашборд не накручивал цифры.
 */
function analyticsMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') return next();
  if (req.path === '/api/stats' || req.path === '/stats') return next();

  const day = dayKey();
  const vid = visitorId(req);
  const now = Date.now();

  const isPlayerLookup = req.method === 'GET' && PLAYER_LOOKUP_RE.test(req.path);

  // Не блокируем ответ — счётчики пишем «в фоне», ошибки только логируем.
  Promise.all([
    redis.pfAdd(`stats:uv:${day}`, vid).then(() => redis.expire(`stats:uv:${day}`, DAY_TTL_SEC)),
    redis.zAdd('stats:active', { score: now, value: vid }),
    isPlayerLookup
      ? redis
          .incr(`stats:playerReq:${day}`)
          .then((n) => (n === 1 ? redis.expire(`stats:playerReq:${day}`, DAY_TTL_SEC) : null))
      : null,
    // ~1% запросов подчищают протухшие записи «активных», чтобы set не рос,
    // даже если дашборд никто не открывает.
    Math.random() < 0.01
      ? redis.zRemRangeByScore('stats:active', 0, now - ACTIVE_WINDOW_MS)
      : null,
  ]).catch((err) => console.error('❌ [analytics] запись метрики:', err.message));

  next();
}

/**
 * Сводка для дашборда: активные сейчас, сегодня и за последние 7 дней.
 */
async function readStats() {
  const now = Date.now();

  // Чистим протухшие «активные» и считаем оставшихся.
  await redis.zRemRangeByScore('stats:active', 0, now - ACTIVE_WINDOW_MS).catch(() => {});
  const active = await redis.zCard('stats:active').catch(() => 0);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000);
    days.push(dayKey(d));
  }

  const perDay = await Promise.all(
    days.map(async (day) => {
      const [playerLookups, uniqueVisitors] = await Promise.all([
        redis.get(`stats:playerReq:${day}`).then((v) => Number(v) || 0),
        redis.pfCount(`stats:uv:${day}`).then((v) => Number(v) || 0).catch(() => 0),
      ]);
      return { date: day, playerLookups, uniqueVisitors };
    })
  );

  return {
    active,
    activeWindowMinutes: ACTIVE_WINDOW_MS / 60000,
    today: {
      playerLookups: perDay[0].playerLookups,
      uniqueVisitors: perDay[0].uniqueVisitors,
    },
    last7days: perDay, // [0] = сегодня
    generatedAt: new Date(now).toISOString(),
  };
}

module.exports = { analyticsMiddleware, readStats };
