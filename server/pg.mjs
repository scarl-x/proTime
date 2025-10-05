import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'protime',
  port: 5433,
  // Без пароля, так как используется trust authentication
});


