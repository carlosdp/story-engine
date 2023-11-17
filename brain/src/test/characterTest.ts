import { PhaseExecutor } from '../subsystems/phaseExecutor.js';

const subsystem = new PhaseExecutor();
await subsystem.createSignal('6d2cb791-703c-4ea4-afbf-a605fbad68b0', {
  command: 'Start game',
});

// eslint-disable-next-line
process.exit();
