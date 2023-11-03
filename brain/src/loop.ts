import processActions from './tasks/processActions.js';
import processSignals from './tasks/processSignals.js';

function sleep(timeInMillis: number) {
  return new Promise(resolve => setTimeout(resolve, timeInMillis));
}

// eslint-disable-next-line
while (true) {
  await processSignals();
  await processActions({ id: 'test' } as any);
  await sleep(1000);
}
