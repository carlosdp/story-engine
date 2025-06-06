import { boss } from './db.js';
import logger from './logging.js';
import completeResearch from './tasks/completeResearch.js';
import createScenario from './tasks/createScenario.js';
import generateCharacters from './tasks/generateCharacters.js';
import generateDialogue from './tasks/generateDialogue.js';
import generateLetter from './tasks/generateLetter.js';
import generateRandomDialogue from './tasks/generateRandomDialogue.js';
import generateRandomLetters from './tasks/generateRandomLetters.js';
import processActions from './tasks/processActions.js';
import processSignals from './tasks/processSignals.js';
import sendTimeSignal from './tasks/sendTimeSignal.js';
import startCharacter from './tasks/startCharacter.js';
import submitDesignDocument from './tasks/submitDesignDocument.js';

logger.info('Brain booting up...');

boss.start();

const jobFunctions = {
  generateCharacters: generateCharacters,
  processSignals: processSignals,
  processActions: processActions,
  sendTimeSignal: sendTimeSignal,
  generateLetter: generateLetter,
  generateRandomLetters: generateRandomLetters,
  completeResearch: completeResearch,
  generateDialogue: generateDialogue,
  generateRandomDialogue: generateRandomDialogue,
  startCharacter: startCharacter,
  createScenario: createScenario,
  submitDesignDocument: submitDesignDocument,
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
// boss.schedule('completeResearch', '* * * * * *');
// every hour
// boss.schedule('sendTimeSignal', '0 0 * * * *');
// boss.schedule('generateRandomLetters', '0 0 * * * *');
// boss.schedule('generateRandomDialogue', '0 0 * * * *');

boss.on('error', error => logger.error(error));

logger.info('Brain running!');

process.on('SIGINT', async () => {
  logger.info('SIGINT received, stopping...');
  await boss.stop();
  process.exit();
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, stopping...');
  await boss.stop();
  process.exit();
});
