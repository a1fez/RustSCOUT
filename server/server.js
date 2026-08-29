const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// Загрузка .env и запуск фонового сервиса обновления серверов
require('dotenv').config({ path: path.resolve(__dirname, './.env') });
require('./service/serverList.js');

// Подключаем роуты серверов (PostgreSQL)
const serverRoutes = require('./routes/serverRoute.js');

const app = express();
const PORT = process.env.PORT || 5001; 

// Middlewares
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// 1. Роуты серверов (PostgreSQL pg pool)
// ------------------------------------------------------------------
app.use('/api', serverRoutes); // Роут /api/servers

// ------------------------------------------------------------------
// 2. Steam API Service
// ------------------------------------------------------------------
app.get('/api/player/:steamId', async (req, res) => {
  const { steamId } = req.params;
  const apiKey = process.env.steamApiKey;   

  console.log(`\n--- [НОВЫЙ ЗАПРОС] ---`);
  console.log(`Запрос на SteamID: ${steamId}`);
  console.log(`Ключ Steam: ${apiKey ? 'Найден' : '❌ НЕ НАЙДЕН'}`);

  if (!apiKey) {
    return res.status(500).json({ error: 'API ключ Steam не задан в .env файле!' });
  }

  try {
    const response = await axios.get(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
      {
        params: {
          key: apiKey.trim(),
          steamids: steamId,
        },
      }
    );

    const players = response.data?.response?.players;

    if (!players || players.length === 0) {
      console.log('⚠️ Steam вернул пустой массив');
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const steamUser = players[0];
    console.log(`✅ Игрок найден: ${steamUser.personaname}`);

    return res.json({
      steamId: steamId,
      steam: {
        personaname: steamUser.personaname,
        avatarfull: steamUser.avatarfull,
        profileurl: steamUser.profileurl,
        personastate: steamUser.personastate,
      },
      battleMetrics: null
    });

  } catch (error) {
    console.error('❌ Ошибка Steam API:', error.response?.status, error.message);
    return res.status(500).json({ error: 'Не удалось получить данные из Steam' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});