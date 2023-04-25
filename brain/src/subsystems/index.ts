import { HumanResources } from './humanResources';
import { Intelligence } from './intelligence';
import { Logistics } from './logistics';
import { Military } from './military';
import { Overlord } from './overlord';

const subsystems = {
  overlord: new Overlord(),
  military: new Military(),
  logistics: new Logistics(),
  humanResources: new HumanResources(),
  intelligence: new Intelligence(),
};

export default subsystems;
