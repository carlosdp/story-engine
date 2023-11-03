import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { SubsystemMessage } from '../signal.js';
import { LLMSubsystem } from './base.js';
import { StoryBuilder } from './storyBuilder.js';

class ModifyStory extends SignalAction {
  description = 'Modify the world story based on the given relevant text from the document';
  parameters = {
    text: { type: 'string', description: 'text of the story' },
  };
  required = ['text'];
  subsystem = StoryBuilder;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return { command: 'Modify or create stories based on this text', story_text: parameters.text };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created story: ${JSON.stringify(response)}`;
  }
}

class ModifyRules extends Action {
  description = 'Modify the world game rules and procedures';
  parameters = {
    rules: { type: 'string', description: 'the new rules in plain text' },
  };
  required = ['rules'];

  async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    return { status: 'complete', data: {} };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<string> {
    return 'Rules modified';
  }
}

// class ModifyEntities extends Action {
//   description = 'Modify the world entities, such as characters, locations, etc.';
//   parameters = {
//     rules: { type: 'string', description: 'the new rules in plain text' },
//   };
//   required = ['rules'];

//   async execute(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
//     return { status: 'complete', data: {} };
//   }

//   async result(_thoughtActionId: string, _parameters: Record<string, unknown>, _data: any): Promise<string> {
//     return 'Rules modified';
//   }
// }

export class Designer extends LLMSubsystem {
  description = 'Responsible for making changes to the world based on a design document';
  actions = [ModifyStory, ModifyRules];
  agentPurpose =
    'You are a superintelligent game designer. Your job is to make changes in a video-game world and structure based on the given design document (or changes to the existing design).';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    return [
      'Break up the document using the provided actions to store individual concepts',
      'Use one action for each semantic concept, for example one story for each distinct narrative, rules should be grouped by ones that are related, etc.',
      'Once every relevant concept has been stored, you are done',
    ];
  }

  override async prepareThoughtProcess(thoughtProcessId: string, message: SubsystemMessage): Promise<void> {
    const thoughtProcessRes = await sql`select * from thought_processes where id = ${thoughtProcessId}`;
    const thoughtProcess = thoughtProcessRes[0];

    if (!thoughtProcess) {
      throw new Error(`No thought process found for id ${thoughtProcessId}`);
    }

    await sql`update thought_processes set ${sql({
      data: {
        ...thoughtProcess.data,
        designDocumentId: message.payload.designDocumentId,
      },
    })} where id = ${thoughtProcessId}`;
  }
}
