import { boss } from '../db';
import logger from '../logging';

(async () => {
  logger.info('Generating characters...');
  await boss.start();
  logger.debug(
    await boss.send('generateCharacters', {
      prompt: 'A research scientist, working for the AI overlord',
      rustNpcType: 'scientist',
      count: 1,
    })
  );
  await boss.stop();
})();
