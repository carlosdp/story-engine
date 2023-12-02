import { Action, ActionResult, ReturnAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { LLMSubsystem } from './base.js';

class AdvancePhase extends Action {
  description = 'Advance to the given phase';
  parameters = {
    parentPhase: { type: 'string', description: 'the parent phase' },
    name: { type: 'string', description: 'the name of the phase' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const worldRes = await sql`select * from worlds where id = ${this.thoughtProcess.world_id}`;
    const world = worldRes[0];

    await sql`update worlds set ${sql({
      state: {
        ...world.state,
        currentPhase: parameters.name,
      },
    })} where id = ${this.thoughtProcess.world_id}`;

    return { status: 'complete', data: {} };
  }

  async result(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<string> {
    return `Current Phase updated to ${parameters.name}`;
  }
}

class AskUser extends Action {
  description = 'Query the user for some information, returns their plaintext response';
  parameters = {
    text: { type: 'string', description: 'the text of the question' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, data: any): Promise<ActionResult> {
    const worldRes = await sql`select * from worlds where id = ${this.thoughtProcess.world_id}`;
    const world = worldRes[0];

    if (!data || !data.state) {
      await sql`update worlds set ${sql({
        state: {
          ...world.state,
          messages: [
            ...(world.state?.messages ?? []),
            {
              role: 'system',
              content: parameters.text,
            },
          ],
        },
      })} where id = ${this.thoughtProcess.world_id}`;

      return { status: 'waiting', data: { state: 'waiting' } };
    } else if (world.state.messages && world.state.messages[world.state.messages.length - 1].role === 'user') {
      return {
        status: 'complete',
        data: { state: 'done', message: world.state.messages[world.state.messages.length - 1].content },
      };
    }

    return { status: 'waiting', data };
  }

  async result(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<string> {
    return `Current Phase updated to ${parameters.name}`;
  }
}

class EndGame extends ReturnAction {
  description = 'End the game';
  parameters = {};

  async payload(_worldId: string, _parameters: Record<string, string>): Promise<SignalActionPayload> {
    return { result: 'Game ended' };
  }
}

export class PhaseExecutor extends LLMSubsystem {
  description = 'Responsible for executing the phases of the game procedural loop';
  actions = [AdvancePhase, AskUser, EndGame];
  agentPurpose =
    'You are a superintelligent game phase execution machine. Your job is to execute the phases of the game procedural loop, as defined by the design document, in response to input and events.';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    const documentRes =
      await sql`select content from design_documents where world_id = ${this.thoughtProcess.world_id} order by created_at desc limit 1`;
    const document = documentRes[0];

    const worldRes = await sql`select * from worlds where id = ${this.thoughtProcess.world_id}`;
    const world = worldRes[0];

    const parentPhases = Object.entries(world.phases);

    const phases = {
      'Pre-Play':
        parentPhases
          .find((p: any) => p[0] === 'Pre-Play')
          ?.map((p: any) => ({ name: p.name, description: p.description })) ?? [],
      Play:
        parentPhases
          .find((p: any) => p[0] === 'Play')
          ?.map((p: any) => ({ name: p.name, description: p.description })) ?? [],
      'Post-Play':
        parentPhases
          .find((p: any) => p[0] === 'Post-Play')
          ?.map((p: any) => ({ name: p.name, description: p.description })) ?? [],
    };

    return [
      `The game's procedural loop is expressed as a list of phases, executed in order in three categories:
      > Pre-Play: Set of phases that happen before the main game loop begins
      > Play: The main game loop, phases are executed in order until the game is ended (so the last phase(s) should be checks to see if end conditions are met)
      > Post-Play: Set of phases that happen after the game ends`,
      'Based on the given event or user input, perform actions to execute the current phase',
      'If there is no current phase (the game has just started), start by advancing to the beginning phase',
      'If the current phase is complete or reached an end condition, advance to the next phase',
      'Continue running the phases until you run into an end condition defined by the current phase',
      `Phases: ${JSON.stringify(phases)}`,
      `Current Phase: ${world.state.currentPhase ?? 'None'}`,
      `Document:\n${document.content}`,
    ];
  }
}
