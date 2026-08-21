const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Services 
const { getCachedServers } = require('./service/serverList.js');

const app = express();
const PORT = process.env.PORT || 5001; 

// Настройка CORS
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// ------------------------------------------------------------------
// 1. BattleMetrics Servers Service (ОТДЕЛЬНЫЙ РОУТ)
// ------------------------------------------------------------------
app.get('/api/servers', (req, res) => {
  try {
    const cachedData = getCachedServers();
    return res.json(cachedData);
  } catch (error) {
    console.error('❌ Ошибка при получении данных серверов:', error.message);
    return res.status(500).json({ error: 'Не удалось получить данные с BattleMetrics API' });
  }
});

// ------------------------------------------------------------------
// 2. Steam API Service (ОТДЕЛЬНЫЙ РОУТ)
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
          key: apiKey,
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