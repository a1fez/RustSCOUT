const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { createClient } = require('redis');

// Загрузка .env и фоновых сервисов
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
require('./service/serverList.js');
require('./service/playerScraper.js');

// Импорт функции сбора данных по BM ID
const { getFullPlayerStatus } = require('./service/playerReq.js');

// Импорт роутов серверов (PostgreSQL)
const serverRoutes = require('./routes/serverRoute.js');

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

// Роуты серверов
app.use('/api', serverRoutes);

// Роут поиска игрока
app.get('/api/player/:steamId', async (req, res) => {
  const { steamId } = req.params;
  const targetServer = req.query.server;
  const steamApiKey = process.env.steamApiKey || process.env.STEAM_API_KEY;

  console.log('\n================== [ДЕБАГ ПОИСКА] ==================');
  console.log(`1. Входящий SteamID: "${steamId}"`);
  console.log(`2. Входящий сервер (query param): "${targetServer}"`);

  if (!steamApiKey) {
    console.error('❌ Ошибка: API ключ Steam отсутствует в .env');
    return res.status(500).json({ error: 'API ключ Steam не задан в .env' });
  }

  try {
    // 1. Steam API: получаем профиль и имя
    const steamRes = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
      {
        params: {
          key: steamApiKey.trim(),
          steamids: steamId,
        },
      }
    );

    const players = steamRes.data?.response?.players;
    if (!players || players.length === 0) {
      console.log('❌ Steam API не нашел профиль игрока');
      return res.status(404).json({ error: 'Пользователь Steam не найден' });
    }

    const steamUser = players[0];
    const steamName = steamUser.personaname;
    console.log(`3. Никнейм из Steam: "${steamName}"`);

    let foundBmId = null;

    // 2. Поиск в Redis по ключу server:<id>:players
    if (targetServer) {
      const redisKey = `server:${targetServer}:players`;
      console.log(`4. Читаем ключ из Redis: "${redisKey}"`);

      const rawData = await redisClient.get(redisKey);

      if (!rawData) {
        console.log(`⚠️ Ключ "${redisKey}" в Redis отсутствует или пуст`);
      } else {
        try {
          const serverPlayers = JSON.parse(rawData);
          console.log(`5. Игроков в кэше сервера: ${serverPlayers.length}`);

          // Поиск игрока по нику без учета регистра и крайних пробелов
          const matched = serverPlayers.find(
            (p) => p.name && p.name.trim().toLowerCase() === steamName.trim().toLowerCase()
          );

          if (matched) {
            foundBmId = String(matched.bmId);
            console.log(`✅ Игрок найден в Redis! bmId: ${foundBmId}`);
          } else {
            console.log(`⚠️ Игрок "${steamName}" не найден среди онлайн-игроков сервера`);
          }
        } catch (err) {
          console.error('❌ Ошибка парсинга JSON из Redis:', err.message);
        }
      }
    } else {
      console.log('⚠️ Параметр сервера не был передан');
    }

    // 3. Сбор подробной статистики через сервис BattleMetrics
    let bmData = null;
    if (foundBmId) {
      try {
        console.log(`6. Запрашиваем BattleMetrics для BM ID: ${foundBmId}...`);
        bmData = await getFullPlayerStatus(foundBmId);
        console.log('✅ Данные BattleMetrics успешно получены');
      } catch (bmErr) {
        console.error('❌ Ошибка вызова getFullPlayerStatus:', bmErr.message);
      }
    }

    // 4. Отправляем ответ клиенту
    return res.json({
      steamId,
      bmId: foundBmId,
      isOnline: bmData ? bmData.isOnline : false,
      currentServer: bmData ? bmData.currentServer : null,
      steam: {
        personaname: steamUser.personaname,
        avatarfull: steamUser.avatarfull,
        profileurl: steamUser.profileurl,
        personastate: steamUser.personastate,
      },
      battleMetrics: bmData ? bmData.battleMetrics : null,
      servers: bmData ? bmData.servers : [],
      nicknames: bmData ? bmData.nicknames : [steamName],
    });
  } catch (error) {
    console.error('❌ Ошибка роута /api/player/:steamId:', error.message);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});