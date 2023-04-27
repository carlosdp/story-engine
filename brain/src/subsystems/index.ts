import { HumanResources } from './humanResources';
import { Intelligence } from './intelligence';
import { Logistics } from './logistics';
import { Military } from './military';
import { Overlord } from './overlord';
import { ResourceDepot } from './resourceDepot';

const subsystems = {
  overlord: new Overlord(),
  military: new Military(),
  logistics: new Logistics(),
  humanResources: new HumanResources(),
  intelligence: new Intelligence(),
  resourceDepot: new ResourceDepot(),
};

export default subsystems;
