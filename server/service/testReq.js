const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.battleMetricsKey;

async function testRateLimit() {
  console.log('🚀 Начинаем тест лимитов API BattleMetrics...\n');
  
  let successCount = 0;
  const startTime = Date.now();

  for (let i = 1; i <= 301; i++) {
    try {
      await axios.get('https://api.battlemetrics.com/servers?page[size]=1', {
        headers: {
          'Authorization': `Bearer ${token.trim()}`,
          'User-Agent': 'RustScout/1.0'
        }
      });

      successCount++;
      process.stdout.write(`\r✅ Успешных запросов: ${successCount}`);

      // Небольшая пауза 100 мс между запросами
      await new Promise(res => setTimeout(res, 100));

    } catch (error) {
      if (error.response && error.response.status === 429) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        const retryAfter = error.response.headers['retry-after'] || 'N/A';
        
        console.log(`\n\n🛑 Поймали 429 Too Many Requests!`);
        console.log(`📊 Итог: Успешно выполнено ${successCount} запросов за ${duration} секунд.`);
        console.log(`⏳ Заголовок Retry-After требует подождать: ${retryAfter} сек.`);
        return;
      } else {
        console.error(`\n❌ Ошибка (${error.response?.status || 'Network'}):`, error.message);
        return;
      }
    }
  }

  console.log(`\n\n🎉 Успешно отправлено 150 запросов без блокировок!`);
}

testRateLimit();