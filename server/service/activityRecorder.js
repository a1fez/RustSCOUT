const redisClient = require('../redis.js');
const db = require('../db.js');


const MAX_GAP_MINUTES = 10; //  Сервер не опрашивали дольше -  не знаем, кто там был, интервал не засчитываем
const HOUR_KEY_TTL_SECONDS = 3 * 60 * 60; // 3 часа в секундах, чтобы ключи не занимали память в Redis слишком долго
const RETENTION_DAYS = 90; // Сколько дней хранить данные в Postgres, чтобы не раздувать таблицу
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // Каждые сутки чистим старые данные в Postgres

const lastScrapeAt = new Map();
const FLUSH_INTERVAL_MS = 5 * 60 * 1000; // Каждые 5 минут проверяем, есть ли завершенные часы для переноса в Postgres


let flushing = false; // Флаг, чтобы не запускать несколько параллельных flushFinishedHours

function hourKey(timeMs) {
    return `activity:${Math.floor(timeMs / (60 * 60 * 1000))}` // 
}


async function recordServerPlayers(serverId, players) {
    const now = Date.now();
    const prev = lastScrapeAt.get(serverId);
    lastScrapeAt.set(serverId, now);

    if (!prev) return;

    const minutes = Math.round((now - prev) / (60 * 1000));
    if (minutes < 1 || minutes > MAX_GAP_MINUTES) return;
    if (players.length === 0) return;

    const key = hourKey(now);
    const multi = redisClient.multi();
    for (const player of players) {
        multi.hIncrBy(key, player.bmId, minutes);
    }
    multi.expire(key, HOUR_KEY_TTL_SECONDS);
    await multi.exec();
}

async function flushHour(hour) {
    const key = `activity:${hour}`;
    const data = await redisClient.HGETALL(key);
    const bmIds = Object.keys(data);

    if (bmIds.length === 0) return 0;

    const minutes = bmIds.map((id) => Math.min(Number(data[id]), 60)); // Ограничиваем максимум 60 минут на игрока
    const hourStart = new Date(hour * 60 * 60 * 1000);
    const day = hourStart.toISOString().slice(0, 10); // Получаем дату в формате YYYY-MM-DD // toLocaleDateString спросить у ии
    const hourIndex = hourStart.getUTCHours() + 1; // 1..24: массивы в Postgres нумеруются с 1

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        await client.query(
            `INSERT INTO "PlayerActivity" ("bmId", day)
             SELECT unnest($1::bigint[]), $2::date
             ON CONFLICT ("bmId", day) DO NOTHING;`,
            [bmIds, day]
        );
        await client.query(
            `UPDATE "PlayerActivity" AS p
            SET minutes[$3] = v.m
            FROM unnest($1::bigint[], $4::smallint[]) AS v(b, m)
            WHERE p."bmId" = v.b AND p.day = $2::date;`,
            [bmIds, day, hourIndex, minutes]
        );

        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
    await redisClient.del(key); // Удаляем ключ после успешной записи в БД
    return bmIds.length;
}

async function flushFinishedHours() {
    if (flushing) return;
    flushing = true;
    try {
        const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
        for (const hour of [currentHour - 2, currentHour - 1]) {
            try {
                const count = await flushHour(hour);
                if (count > 0) {
                    console.log(`✅ [activity] Час ${hour} перенесен в Postgres: ${count} игроков`);
                }
            } catch (err) {
                console.error(`❌ [activity] Ошибка при переносе часа ${hour}:`, err.message);
            }
        }
    } finally {
        flushing = false;
    }

}

async function cleanupOldActivity() {
    try {
        const res = await db.query(
            `DELETE FROM "PlayerActivity"
             WHERE day < (NOW() AT TIME ZONE 'UTC')::date - $1::int;`,
             [RETENTION_DAYS]
        );
        if (res.rowCount > 0) {
            console.log(`🗑️ [activity] Удалено ${res.rowCount} строк старше ${RETENTION_DAYS} дней`);

        } 
    } catch (err) {
        console.error('❌ [activity] Ошибка при очистке старых данных:', err.message);
    }
}
function startActivityFlusher() {
    flushFinishedHours(); // Запускаем сразу при старте
    setInterval(flushFinishedHours, FLUSH_INTERVAL_MS);

    cleanupOldActivity(); // Раз в сутки чистим данные старше RETENTION_DAYS
    setInterval(cleanupOldActivity, CLEANUP_INTERVAL_MS);
}


module.exports = { recordServerPlayers, startActivityFlusher, flushHour, cleanupOldActivity };
