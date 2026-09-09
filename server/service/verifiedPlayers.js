// Подтверждённые связки Steam <-> BattleMetrics.
//
// Когда поиск игрока проходит всю цепочку (Steam -> ник в кэше сервера -> BM),
// пара steamId + bmId считается подтверждённой и сохраняется здесь.
// Дальше по этому steamId уже не нужно ловить игрока в Redis, чтобы узнать bmId:
//   - повторный поиск идёт сразу в BM, даже если игрок сейчас оффлайн;
//   - /track берёт bmId отсюда, если фронт его не прислал.

const db = require('../db.js');

async function getBySteamId(steamId) {
  if (!steamId) return null;
  const { rows } = await db.query(
    'SELECT "steamId", "bmId", personaname, "updatedAt" FROM "VerifiedPlayer" WHERE "steamId" = $1',
    [String(steamId)]
  );
  return rows[0] || null;
}

async function getByBmId(bmId) {
  if (!bmId) return null;
  const { rows } = await db.query(
    'SELECT "steamId", "bmId", personaname, "updatedAt" FROM "VerifiedPlayer" WHERE "bmId" = $1',
    [String(bmId)]
  );
  return rows[0] || null;
}

/**
 * Сохраняет/обновляет связку. bmId для steamId может измениться (смена аккаунта
 * BM, исправление ошибочного матча) — поэтому ON CONFLICT перезаписывает.
 */
async function upsertVerified({ steamId, bmId, personaname }) {
  if (!steamId || !bmId) return null;
  const { rows } = await db.query(
    `INSERT INTO "VerifiedPlayer" ("steamId", "bmId", personaname, "updatedAt")
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT ("steamId") DO UPDATE SET
       "bmId" = EXCLUDED."bmId",
       personaname = COALESCE(EXCLUDED.personaname, "VerifiedPlayer".personaname),
       "updatedAt" = NOW()
     RETURNING "steamId", "bmId", personaname, "updatedAt";`,
    [String(steamId), String(bmId), personaname || null]
  );
  return rows[0] || null;
}

module.exports = { getBySteamId, getByBmId, upsertVerified };
