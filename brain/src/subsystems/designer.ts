import { SignalAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { SubsystemMessage } from '../signal.js';
import { LLMSubsystem } from './base.js';
import { PhaseConstructor } from './phaseConstructor.js';
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

class AddPhase extends SignalAction {
  description = 'Add a new phase to the procedural loop';
  parameters = {
    parentPhase: {
      type: 'string',
      description: 'which parent phase this phase belongs to',
      enum: ['Pre-Play', 'Play', 'Post-Play'],
    },
    name: { type: 'string', description: 'a name for the phase' },
    description: {
      type: 'string',
      description: 'detailed description of what happens in this phase',
    },
    // todo: add optional ordering parameter
  };
  required = ['parentPhase', 'name', 'description'];
  subsystem = PhaseConstructor;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return { command: 'Create this phase', parameters, designDocumentId: this.thoughtProcess.data.designDocumentId };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return response.result;
  }
}

export class Designer extends LLMSubsystem {
  description = 'Responsible for making changes to the world based on a design document';
  actions = [ModifyStory, AddPhase];
  agentPurpose =
    'You are a superintelligent game designer. Your job is to make changes in a video-game world and structure based on the given design document (or changes to the existing design).';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    const documentRes =
      await sql`select content from design_documents where id = ${this.thoughtProcess.data.designDocumentId}`;
    const document = documentRes[0];

    return [
      'Break up the document using the provided actions to store individual concepts',
      'Use one action for each semantic concept, for example one story for each distinct narrative, etc.',
      `The game's procedural loop is expressed as a list of phases, executed in order in three categories:
      > Pre-Play: Set of phases that happen before the main game loop begins
      > Play: The main game loop, phases are executed in order until the game is ended (so the last phase(s) should be checks to see if end conditions are met)
      > Post-Play: Set of phases that happen after the game ends`,
      'Avoid overlap in responsibility between phases',
      'Once every relevant concept has been acted on, you are done',
      'Start with the phases, then move on to the story elements',
      `Document:\n${document.content}`,
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
