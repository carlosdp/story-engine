import { sql } from '../db.js';
import { PhaseExecutor } from '../subsystems/phaseExecutor.js';

await sql`update worlds set ${sql({
  state: {},
})} where id = '6d2cb791-703c-4ea4-afbf-a605fbad68b0'`;

const subsystem = new PhaseExecutor();
await subsystem.createSignal('6d2cb791-703c-4ea4-afbf-a605fbad68b0', {
  command: 'Start game',
});

// eslint-disable-next-line
process.exit();
