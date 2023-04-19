import { Logistics } from './logistics';
import { Military } from './military';
import { Overlord } from './overlord';

const subsystems = {
  overlord: new Overlord(),
  military: new Military(),
  logistics: new Logistics(),
};

export default subsystems;
