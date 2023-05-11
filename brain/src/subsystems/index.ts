import { CharacterBuilder } from './characterBuilder';
import { Storyteller } from './storyteller';

const subsystems = {
  storyteller: new Storyteller(),
  characterBuilder: new CharacterBuilder(),
};

export default subsystems;
