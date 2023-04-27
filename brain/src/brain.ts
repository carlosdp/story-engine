import { boss } from './db';
import logger from './logging';
import generateCharacters from './tasks/generateCharacters';
import generateLetter from './tasks/generateLetter';
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
  generateLetter: generateLetter,
};

// eslint-disable-next-line @typescript-eslint/ban-types
const wrapExceptionLog = (jobFunction: Function) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (...args: any[]) => {
    try {
      return await jobFunction(...args);
    } catch (error) {
      const exception = error as Error;
      logger.error(`${exception.message}\n${exception.stack}`);
      throw error;
    }
  };
};

for (const [jobName, jobFunction] of Object.entries(jobFunctions)) {
  boss.work(jobName, wrapExceptionLog(jobFunction));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  boss.onComplete(jobName, (job: { failed: boolean; response: any }) => {
    logger.debug(job);
    if (job.failed) {
      logger.error(`Job ${jobName} failed: ${job.response}`);
    }
  });
}

boss.schedule('processSignals', '* * * * * *');
boss.schedule('processActions', '* * * * * *');
// every hour
boss.schedule('sendTimeSignal', '0 0 * * * *');

boss.on('error', error => logger.error(error));

logger.info('Brain running!');
