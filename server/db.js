const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Автоматически создаем таблицу Server при старте, если ее нет
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Server" (
        id VARCHAR(255) PRIMARY KEY,
        name TEXT NOT NULL,
        players INTEGER DEFAULT 0,
        "maxPlayers" INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'online',
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ [PostgreSQL] Таблица "Server" готова');

    // Подтверждённые связки Steam <-> BattleMetrics (см. service/verifiedPlayers.js)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "VerifiedPlayer" (
        "steamId" VARCHAR(32) PRIMARY KEY,
        "bmId" VARCHAR(32) NOT NULL,
        personaname TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS "VerifiedPlayer_bmId_idx" ON "VerifiedPlayer" ("bmId");');
    console.log('✅ [PostgreSQL] Таблица "VerifiedPlayer" готова');
  } catch (err) {
    console.error('❌ [PostgreSQL] Ошибка инициализации таблицы:', err.message);
  }
}

initDB();

module.exports = pool;