import { Logistics } from './logistics';
import { Military } from './military';

const subsystems = {
  military: new Military(),
  logistics: new Logistics(),
};

export default subsystems;
