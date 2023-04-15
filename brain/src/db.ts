import * as PgBoss from 'pg-boss';
import * as postgres from 'postgres';

// todo: parameterize
export const boss = new PgBoss({
  connectionString: 'postgres://postgres:postgres@localhost:54322/postgres',
  schema: 'public',
});

export const sql = postgres('postgres://postgres:postgres@localhost:54322/postgres');
