const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

// Создаем пул соединений pg
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Инициализируем PrismaClient с адаптером
const prisma = new PrismaClient({ adapter });

module.exports = prisma;