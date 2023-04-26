import * as PgBoss from 'pg-boss';
import * as postgres from 'postgres';

// todo: parameterize
// @ts-ignore
export const boss = new PgBoss({
  connectionString: 'postgres://postgres:postgres@localhost:54322/postgres',
  schema: 'public',
  cronMonitorIntervalSeconds: 10,
});

export const sql = postgres('postgres://postgres:postgres@localhost:54322/postgres', {
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
