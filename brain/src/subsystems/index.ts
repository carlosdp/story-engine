import { CharacterBuilder } from './characterBuilder';
import { MissionBuilder } from './missionBuilder';
import { Storyteller } from './storyteller';

const subsystems = {
  storyteller: new Storyteller(),
  characterBuilder: new CharacterBuilder(),
  missionBuilder: new MissionBuilder(),
};

export default subsystems;
