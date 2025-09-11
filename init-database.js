const { Pool } = require('pg');

const createTables = async () => {
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL no configurada');
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Tablas creadas');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

module.exports = { createTables };
