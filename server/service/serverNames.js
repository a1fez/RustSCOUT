// Резолвер человекочитаемых имён серверов по их id.
//
// Порядок поиска — батчами, а не по одному id за запрос:
//   1) память процесса (короткий кэш, чтобы не долбить БД/BM на каждый /status);
//   2) таблица "Server" в PostgreSQL — один запрос WHERE id = ANY(...);
//   3) BattleMetrics /servers?filter[ids]=... — ОДИН запрос на всю пачку
//      недостающих id (а не N штук). Ответ попутно апсертим в "Server",
//      чтобы дальше имя бралось уже из БД.
//
// Отрицательный результат кэшируется так же долго, как положительный: сервер
// вне топа не появится в BM внезапно, а на 10-секундном поллере /status каждый
// такой id раньше стоил отдельного запроса к BattleMetrics.

const axios = require('axios');
const db = require('../db.js');
const { scheduleRequest } = require('../rateLimiter.js');

const POSITIVE_TTL_MS = 30 * 60 * 1000; // имя нашли — держим 30 минут
const NEGATIVE_TTL_MS = 30 * 60 * 1000; // имя не нашли — тоже 30 минут, не долбим BM
const BM_IDS_PER_REQUEST = 100;         // потолок page[size] у BattleMetrics

/** @type {Map<string, { name: string | null, expiresAt: number }>} */
const cache = new Map();
// Чтобы параллельные /status не слали одинаковые запросы к BM по одному id.
const inFlight = new Map();

function readCache(id) {
  const hit = cache.get(id);
  if (!hit) return undefined;
  if (Date.now() >= hit.expiresAt) {
    cache.delete(id);
    return undefined;
  }
  return hit.name;
}

function writeCache(id, name) {
  cache.set(id, {
    name: name || null,
    expiresAt: Date.now() + (name ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS),
  });
}

async function namesFromDb(ids) {
  if (ids.length === 0) return {};
  try {
    const { rows } = await db.query('SELECT id, name FROM "Server" WHERE id = ANY($1)', [ids]);
    const out = {};
    for (const r of rows) if (r.name) out[String(r.id)] = r.name;
    return out;
  } catch (err) {
    console.error('❌ [serverNames] БД не ответила по пачке id:', err.message);
    return {};
  }
}

async function upsertServerRow(id, attr) {
  try {
    await db.query(
      `INSERT INTO "Server" (id, name, players, "maxPlayers", status, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         players = EXCLUDED.players,
         "maxPlayers" = EXCLUDED."maxPlayers",
         status = EXCLUDED.status,
         "updatedAt" = NOW();`,
      [String(id), attr.name, attr.players ?? 0, attr.maxPlayers ?? 0, attr.status || 'online']
    );
  } catch (err) {
    console.error(`❌ [serverNames] Не удалось сохранить сервер ${id} в БД:`, err.message);
  }
}

/**
 * Один (или несколько, пачками по 100) батч-запрос к BM на все недостающие id.
 * Возвращает { [id]: name } только по тем серверам, что BM реально знает;
 * отсутствие ключа = имя не нашлось.
 */
async function namesFromBattleMetrics(ids) {
  if (ids.length === 0) return {};

  const token = process.env.battleMetricsKey;
  const headers = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token.trim()}` } : {}),
    'User-Agent': 'RustScout/1.0 (contact@rustscout.local)',
  };

  const out = {};
  for (let i = 0; i < ids.length; i += BM_IDS_PER_REQUEST) {
    const chunk = ids.slice(i, i + BM_IDS_PER_REQUEST);
    try {
      const res = await scheduleRequest(() =>
        axios.get('https://api.battlemetrics.com/servers', {
          params: { 'filter[ids]': chunk.join(','), 'page[size]': BM_IDS_PER_REQUEST },
          headers,
          timeout: 10000,
        })
      );

      for (const row of res.data?.data || []) {
        const attr = row.attributes;
        if (attr?.name) {
          out[String(row.id)] = attr.name;
          // Апсерт вне критического пути — не ждём, ошибку глотаем внутри.
          upsertServerRow(String(row.id), attr);
        }
      }
    } catch (err) {
      const status = err.response?.status;
      console.warn(
        `⚠️ [serverNames] BM не отдал пачку из ${chunk.length} id${status ? ` (${status})` : ''}: ${err.message}`
      );
    }
  }
  return out;
}

/**
 * Пакетный резолв. Возвращает объект { [id]: name | null }.
 * Память -> БД одним запросом -> BM одним батч-запросом. Параллельные вызовы
 * по одному и тому же id не дублируют запрос к BM.
 */
async function resolveServerNames(ids) {
  const unique = [...new Set((ids || []).filter(Boolean).map(String))];
  const result = {};
  if (unique.length === 0) return result;

  // 1) Память процесса.
  const missing = [];
  for (const id of unique) {
    const cached = readCache(id);
    if (cached !== undefined) result[id] = cached;
    else missing.push(id);
  }
  if (missing.length === 0) return result;

  // 2) БД одним запросом.
  const fromDb = await namesFromDb(missing);
  const stillMissing = [];
  for (const id of missing) {
    if (fromDb[id]) {
      result[id] = fromDb[id];
      writeCache(id, fromDb[id]);
    } else {
      stillMissing.push(id);
    }
  }
  if (stillMissing.length === 0) return result;

  // 3) BM — один батч-запрос, с дедупом параллельных вызовов по каждому id.
  const toFetch = stillMissing.filter((id) => !inFlight.has(id));
  if (toFetch.length > 0) {
    const batch = namesFromBattleMetrics(toFetch);
    for (const id of toFetch) {
      const p = batch.then((map) => map[id] || null);
      inFlight.set(id, p);
      p.finally(() => {
        if (inFlight.get(id) === p) inFlight.delete(id);
      });
    }
  }

  await Promise.all(
    stillMissing.map(async (id) => {
      const pending = inFlight.get(id);
      let name = null;
      if (pending) {
        try {
          name = (await pending) || null;
        } catch {
          name = null;
        }
      }
      if (name == null) {
        const rc = readCache(id);
        if (rc) name = rc;
      }
      result[id] = name;
      writeCache(id, name);
    })
  );

  return result;
}

/**
 * Имя одного сервера по id. Тонкая обёртка над пакетным резолвом.
 */
async function resolveServerName(id) {
  if (!id) return null;
  const map = await resolveServerNames([id]);
  return map[String(id)] ?? null;
}

module.exports = { resolveServerName, resolveServerNames };
