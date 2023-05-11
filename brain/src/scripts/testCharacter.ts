import { sql, boss } from '../db';
import { embedding } from '../utils';

(async () => {
  const worlds = await sql`select * from worlds`;
  const world = worlds[0];

  const description = 'Raza Gooden is an assistant for a business mogul';
  const backstory = 'Raza Gooden is from Chicago in the USA, and came to Castor Town to work for a business mogul';

  const embed = await embedding(`${description} ${backstory}`);

  const charactersRes = await sql`insert into characters ${sql({
    world_id: world.id,
    name: 'Raza Gooden',
    description,
    backstory,
    personality: 'polite and sweet',
    writing_style: 'casual',
    embedding: JSON.stringify(embed),
  })} returning id`;
  const characterId = charactersRes[0].id;

  await boss.start();
  await boss.send('startCharacter', {
    worldId: world.id,
    playerCharacterId: characterId,
    prompt: 'Write a story mission where Raza Gooden needs to buy flowers for their boss from the local florist',
  });
  await boss.stop();
})();
