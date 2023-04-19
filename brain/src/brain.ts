import { boss } from './db';
import logger from './logging';
import generateCharacters from './tasks/generateCharacters';
import processActions from './tasks/processActions';
import processSignals from './tasks/processSignals';
import sendTimeSignal from './tasks/sendTimeSignal';

logger.info('Brain booting up...');

boss.start();

const jobFunctions = {
  generateCharacters: generateCharacters,
  processSignals: processSignals,
  processActions: processActions,
  sendTimeSignal: sendTimeSignal,
};

for (const [jobName, jobFunction] of Object.entries(jobFunctions)) {
  boss.work(jobName, jobFunction);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boss.onComplete(jobName, (job: { failed: boolean; response: any }) => {
    if (job.failed) {
      logger.error(`Job ${jobName} failed: ${job.response}`);
    }
  });
}

boss.schedule('processSignals', '*/10 * * * * *');
boss.schedule('processActions', '*/10 * * * * *');
// every hour
boss.schedule('sendTimeSignal', '0 0 * * * *');

boss.on('error', error => logger.error(error));

logger.info('Brain running!');
