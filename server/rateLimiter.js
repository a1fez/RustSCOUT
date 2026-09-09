// Общий лимитер запросов к BattleMetrics на всё приложение.
// Ограничивает число ОДНОВРЕМЕННО летящих запросов и умеет
// автоматически притормаживать всех, если поймали 429.

const MAX_CONCURRENT = 40; // подтверждённый лимит ~50 одновременных, запас ~20%
const QUEUE_CHECK_INTERVAL_MS = 20;

let activeCount = 0;
const waitingQueue = [];

// Если поймали 429 — на это время все НОВЫЕ запросы будут ждать перед стартом
let cooldownUntil = 0;

function setCooldown(seconds) {
  const until = Date.now() + seconds * 1000;
  if (until > cooldownUntil) {
    cooldownUntil = until;
    console.warn(`🧊 [RateLimiter] Пауза для всех запросов на ${seconds}с из-за 429`);
  }
}

function tryStartNext() {
  if (waitingQueue.length === 0) return;
  if (activeCount >= MAX_CONCURRENT) return;
  if (Date.now() < cooldownUntil) return;

  const next = waitingQueue.shift();
  activeCount++;
  next();
}

setInterval(tryStartNext, QUEUE_CHECK_INTERVAL_MS);

async function scheduleRequest(fn) {
  await new Promise((resolve) => {
    waitingQueue.push(resolve);
  });

  try {
    return await fn();
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = Number(error.response.headers['retry-after']) || 5;
      setCooldown(retryAfter);
    }
    throw error;
  } finally {
    activeCount--;
  }
}

module.exports = { scheduleRequest };