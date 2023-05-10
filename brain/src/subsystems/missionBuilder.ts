import { Action, ActionResult } from '../action';
import { LLMSubsystem } from './base';

const BASE_PROMPT = `You are superintelligent misson designer for a perisistent video-game world. Your job is to take a given storyline, and generate a Mission Graph that will be used by a game engine to implement the story in the game world.

- You can make one or more Mission Graphs, which can be assigned to players or NPC characters that you create.

You have access to several actions to place objects, characters, and triggers to implement the mission, as well as actions to build the final Mission Graphs themselves, using those built dependencies:
{actions}

Based on the input, think about the next action to take. For example:

{ "thought": "I need to do X", "action": "action name here", "parameters": {} }

You can only perform the actions you have have been given. You must only respond in this thought/action format.

Set "action" to null if the thought chain is complete (no further action needed)`;

class MissionGraph extends Action {
  name = 'mission-graph';
  description = 'Define a mission graph for a player or NPC character';
  parameters = {};

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    return { status: 'complete', data: 'Mission Graph created succesfully' };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return data;
  }
}

export class MissionBuilder extends LLMSubsystem {
  name = 'Mission Builder';
  description = 'Responsible for managing missions';
  actions = [new MissionGraph()];
  basePrompt = BASE_PROMPT;
}
