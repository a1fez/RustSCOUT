const path = require('path');
const axios = require('axios');

// Загружаем переменные из .env файла
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const token = process.env.battleMetricsKey;
const MIRAGE_SERVER_ID = '26375548'; // ID сервера 


async function getPlayerList(serverId) {
    try {
        const response = await axios.get(`https://api.battlemetrics.com/servers/${serverId}`, {
            params: {
                'include': 'player'
            },
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token.trim()}`,
            }
        });
        const serverData = response.data.data;
    const included = response.data.included || [];

    // Фильтруем объекты из included, оставляя только игроков
    const players = included.filter(item => item.type === 'player');

    console.log(`\n🏰 Сервер: ${serverData.attributes.name}`);
    console.log(`👥 Игроков онлайн: ${serverData.attributes.players}/${serverData.attributes.maxPlayers}`);
    console.log(`📋 Найдено записей игроков в API: ${players.length}\n`);

    console.log(response.headers['x-ratelimit-limit']);     // Всего разрешено запросов
    console.log(response.headers['x-ratelimit-remaining']); // Сколько осталось в текущем окне
    console.log(response.headers['retry-after']);

    if (players.length > 0) {
      console.log('--- СНИСОК ИГРОКОВ ---');
      players.forEach((player, index) => {
        const name = player.attributes.name || 'Название скрыто/Аноним';
        console.log(`${index + 1}. ${name} (ID: ${player.id})`);
      });
    } else {
      console.log('⚠️ Сервер не отдаёт публичный список игроков (или он отключен в настройках сервера).');
    }

  } catch (error) {
    if (error.response) {
      console.error(`❌ Ошибка API (${error.response.status}):`, error.response.data);
    } else {
      console.error('❌ Ошибка запроса:', error.message);
    }
  }
}

// Подставь сюда реальный ID нужного сервера Mirage Rust из BattleMetrics
// Например, заменяем 12345678 на твой ID:
getPlayerList(MIRAGE_SERVER_ID);


setInterval(() => {
    getPlayerList(MIRAGE_SERVER_ID);
}, 60 * 1000);



