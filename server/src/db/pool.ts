import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/smarted',
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export { pool };
