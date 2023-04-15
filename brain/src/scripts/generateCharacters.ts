import { boss } from '../db';

(async () => {
  console.log('Generating characters...');
  await boss.start();
  console.log(
    await boss.send('generate-characters', {
      prompt: 'A research scientist, working for the AI overlord',
      rustNpcType: 'scientist',
      count: 1,
    })
  );
  await boss.stop();
})();
