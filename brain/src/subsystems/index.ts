import { MissionBuilder } from './missionBuilder';
import { Storyteller } from './storyteller';

const subsystems = {
  storyteller: new Storyteller(),
  missionBuilder: new MissionBuilder(),
};

export default subsystems;
