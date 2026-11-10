const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const axios = require('axios');

const STEAM_ID = '76561198884782850'; // SteamID64 игрока, у которого есть баны или смены ника

async function main() {
  try {
    const res = await axios.get('https://steamhistory.net/api/sourcebans', {
      params: {
        steamids: STEAM_ID,
        key: process.env.steamHistoryApi,
      },
      timeout: 10000,
    });
    console.log(res.status);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response?.status, err.response?.data ?? err.message);
  }
}

main();