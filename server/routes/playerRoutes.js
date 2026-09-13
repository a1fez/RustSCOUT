const express = require('express');
const router = express.Router();
const redis = require('../redis.js');
const { checkPlayersStatus } = require('../service/trackingPlayers');
const { addTracked, removeTracked, clearTrackedForClient, getAllTracked } = require('../service/trackingRegistry');
const { resolveServerTier } = require('../service/tierResolver');
const { reconcileAllFromRedis } = require('../service/trackingReconcile');
const { getBySteamId } = require('../service/verifiedPlayers');

// Каждый анонимный клиент (браузер) шлёт свой X-Client-Id — так реестр
// отслеживания не расползается на всех пользователей разом (см. trackingRegistry.js).
function getClientId(req) {
  const id = req.headers['x-client-id'] || req.body?.clientId;
  return id ? String(id).slice(0, 200) : null;
}

module.exports = (redisClient) => {
  // Начать отслеживание игрока.
  // Кадэнс перепроверки определяется тиром сервера (см. tiers.js) и совпадает
  // с ритмом обновления этого сервера в playerScraper.
  router.post('/track', async (req, res) => {
    try {
      const { steamId, bmId, personaname, serverId, durationMs } = req.body || {};
      const clientId = getClientId(req);

      if (!clientId) {
        return res.status(400).json({ success: false, error: 'X-Client-Id обязателен' });
      }
      if (!steamId || !serverId) {
        return res.status(400).json({ success: false, error: 'steamId и serverId обязательны' });
      }

      // bmId нужен реконсайлеру (player:<bmId>:server). Если фронт его не прислал —
      // берём из подтверждённой связки, а не заставляем ловить игрока в Redis.
      let resolvedBmId = bmId ? String(bmId) : null;
      if (!resolvedBmId) {
        try {
          const verified = await getBySteamId(steamId);
          if (verified?.bmId) resolvedBmId = String(verified.bmId);
        } catch (err) {
          console.error('❌ [track] Чтение связки не удалось:', err.message);
        }
      }

      const tier = await resolveServerTier(serverId);
      const entry = await addTracked({
        clientId,
        steamId,
        bmId: resolvedBmId,
        personaname,
        serverId,
        durationMs,
        tierKey: tier?.key || null,
        intervalMs: tier?.intervalMs || null,
      });

      // Сразу посчитать статус, чтобы фронт не ждал первого цикла поллера.
      reconcileAllFromRedis().catch(() => {});

      res.json({
        success: true,
        tier: tier?.key || null,
        tierName: tier?.name || null,
        intervalMs: tier?.intervalMs || null,
        rank: tier?.rank ?? null,
        expiresAt: entry.expiresAt,
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Остановить отслеживание игрока.
  router.post('/untrack', async (req, res) => {
    try {
      const { steamId } = req.body || {};
      const clientId = getClientId(req);
      if (!clientId) {
        return res.status(400).json({ success: false, error: 'X-Client-Id обязателен' });
      }
      if (!steamId) {
        return res.status(400).json({ success: false, error: 'steamId обязателен' });
      }
      await removeTracked(clientId, steamId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Снять с отслеживания всех игроков ЭТОГО клиента (вызывается фронтом при
  // удалении карточки) — чужие записи в реестре не трогаем.
  router.post('/untrack-all', async (req, res) => {
    try {
      const clientId = getClientId(req);
      if (!clientId) {
        return res.status(400).json({ success: false, error: 'X-Client-Id обязателен' });
      }
      await clearTrackedForClient(clientId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Текущий статус отслеживаемых игроков ЭТОГО клиента (фронт опрашивает этот роут).
  // Читаем через тот же Redis-клиент (redis.js), которым пишет playerScraper.
  router.post('/status', async (req, res) => {
    try {
      const clientId = getClientId(req);
      if (!clientId) {
        return res.status(400).json({ success: false, error: 'X-Client-Id обязателен' });
      }
      const data = await checkPlayersStatus(clientId);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Диагностика: что реально лежит в реестре и в Redis по каждому отслеживаемому.
  router.get('/track/debug', async (_req, res) => {
    try {
      const entries = await getAllTracked();
      const now = Date.now();

      const tracked = [];
      for (const e of entries) {
        const playerServerKey = e.bmId
          ? await redis.get(`player:${e.bmId}:server`)
          : null;

        let serverListAgeSec = null;
        let serverListLen = null;
        let nameInList = null;
        if (e.serverId) {
          const raw = await redis.get(`server:${e.serverId}:players`);
          const ttl = await redis.ttl(`server:${e.serverId}:players`);
          if (raw) {
            try {
              const arr = JSON.parse(raw);
              serverListLen = arr.length;
              nameInList = e.personaname
                ? arr.some(
                    (p) =>
                      p.name &&
                      p.name.trim().toLowerCase() === e.personaname.trim().toLowerCase()
                  )
                : null;
            } catch {
              /* ignore */
            }
          }
          // ttl<0 → ключа нет; возраст = TTL_SECONDS(240) - ttl
          serverListAgeSec = ttl >= 0 ? 240 - ttl : null;
        }

        tracked.push({
          clientId: e.clientId,
          steamId: e.steamId,
          bmId: e.bmId,
          personaname: e.personaname,
          serverId: e.serverId,
          initialServerId: e.initialServerId,
          tierKey: e.tierKey,
          expiresInSec: Math.round((e.expiresAt - now) / 1000),
          status: e.status,
          redis: {
            playerServerKey,                 // player:<bmId>:server — где игрок сейчас
            serverListLen,                   // сколько игроков в server:<serverId>:players
            serverListAgeSec,                // сколько секунд назад скрапер обновлял этот список
            personanameFoundInServerList: nameInList,
          },
        });
      }

      res.json({ success: true, count: tracked.length, tracked });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
};
