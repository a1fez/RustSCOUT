const path = require('path');
const axios = require('axios');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const token = process.env.battleMetricsKey;

// Размеры одновременных пачек, которые проверяем по очереди
const BURST_SIZES = [55, 60, 65, 70];
const PAUSE_BETWEEN_BURSTS_MS = 5000; // отдохнуть между ступенями, чтобы не смешивать результаты

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fireOne() {
  try {
    await axios.get('https://api.battlemetrics.com/servers?page[size]=1', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        'User-Agent': 'RustScout/1.0',
      },
    });
    return { ok: true };
  } catch (error) {
    if (error.response?.status === 429) {
      return { ok: false, status: 429, retryAfter: error.response.headers['retry-after'] };
    }
    return { ok: false, status: error.response?.status || 'network', message: error.message };
  }
}

async function testBurst(size) {
  const startTime = Date.now();
  const results = await Promise.all(Array.from({ length: size }, () => fireOne()));
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  const success = results.filter((r) => r.ok).length;
  const limited = results.filter((r) => r.status === 429).length;
  const otherErrors = results.filter((r) => !r.ok && r.status !== 429);

  return { size, success, limited, otherErrors, duration };
}

async function runBurstTest() {
  console.log('🚀 Поиск лимита BattleMetrics API через параллельные пачки (burst)...\n');

  for (const size of BURST_SIZES) {
    process.stdout.write(`💥 Пачка из ${size} одновременных запросов... `);
    const result = await testBurst(size);

    console.log(
      `✅ ${result.success}/${size} успешно, ⛔ ${result.limited} лимит (429), за ${result.duration}с`
    );

    if (result.otherErrors.length > 0) {
      console.log(`   ⚠️  Другие ошибки:`, result.otherErrors.map((e) => e.status));
    }

    if (result.limited > 0) {
      console.log(
        `\n📉 Лимит начал срабатывать на пачке из ${size} одновременных запросов.`
      );
      console.log(
        `✅ Безопасный уровень параллелизма — предыдущая протестированная пачка (${
          BURST_SIZES[BURST_SIZES.indexOf(size) - 1] ?? 'меньше минимальной'
        }).`
      );
      return;
    }

    await sleep(PAUSE_BETWEEN_BURSTS_MS);
  }

  console.log('\n🎉 Все протестированные размеры пачек прошли без 429.');
}

runBurstTest();