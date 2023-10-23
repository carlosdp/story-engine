import PgBoss from 'pg-boss';
import postgres from 'postgres';

const DB_URL = process.env.DB_URL ?? 'postgres://postgres:postgres@localhost:54322/postgres';

// @ts-ignore
export const boss = new PgBoss({
  connectionString: DB_URL,
  schema: 'public',
});

export const sql = postgres(DB_URL, {
  // needed in prod due to an issue with jsonb https://github.com/porsager/postgres/issues/379
  prepare: false,
  types: {
    point: {
      to: 600,
      from: [600],
      serialize: ([x, y]: number[]) => '(' + x + ',' + y + ')',
      parse: (x: string) =>
        x
          .slice(1, -1)
          .split(',')
          .map((v: string) => +v),
    },
    // carlos: pgvector doesn't have a stable oid -__-
    // vector: {
    //   to: 17_633,
    //   from: [17_633],
    //   serialize: (embed: number[]) => JSON.stringify(embed),
    //   parse: (x: string) => JSON.parse(x),
    // },
  },
});
