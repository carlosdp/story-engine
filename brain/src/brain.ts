import { boss } from './db';
import logger from './logging';
import generateCharacters from './tasks/generateCharacters';
import processActions from './tasks/processActions';
import processSignals from './tasks/processSignals';

logger.info('Brain booting up...');

boss.start();

boss.work('generateCharacters', generateCharacters);
boss.work('processSignals', processSignals);
boss.work('processActions', processActions);

boss.schedule('processSignals', '*/10 * * * * *');
boss.schedule('processActions', '*/10 * * * * *');

boss.on('error', error => logger.error(error));

logger.info('Brain running!');
