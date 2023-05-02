import { HumanResources } from './humanResources';
import { Intelligence } from './intelligence';
import { Logistics } from './logistics';
import { Military } from './military';
import { MissionCommander } from './missionCommander';
import { Overlord } from './overlord';

const subsystems = {
  overlord: new Overlord(),
  military: new Military(),
  logistics: new Logistics(),
  humanResources: new HumanResources(),
  intelligence: new Intelligence(),
  missionCommander: new MissionCommander(),
};

export default subsystems;
