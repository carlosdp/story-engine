import { CharacterBuilder } from './characterBuilder';
import { MissionBuilder } from './missionBuilder';
import { PlayerStarter } from './playerStarter';
import { Storyteller } from './storyteller';

const subsystems = {
  storyteller: new Storyteller(),
  characterBuilder: new CharacterBuilder(),
  missionBuilder: new MissionBuilder(),
  playerStarter: new PlayerStarter(),
};

export default subsystems;
