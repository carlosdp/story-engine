import { SignalAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { SubsystemMessage } from '../signal.js';
import { LLMSubsystem } from './base.js';
import { Storyteller } from './storyteller.js';

class ModifyStory extends SignalAction {
  description = 'Modify the world story based on the given document sections';
  parameters = {
    sections: { type: 'array', description: 'the document sections relevant to the story', items: { type: 'number' } },
  };
  from_subsystem = DocumentProcessor;
  subsystem = Storyteller;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    // get document sections

    return { command: `Modify or create stories based on the following specifications: ` };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created character: ${JSON.stringify(response)}`;
  }
}

export class DocumentProcessor extends LLMSubsystem {
  description = 'Responsible for making changes to the world and scenario based on a design document';
  actions = [];
  agentPurpose =
    'You are a superintelligent game designer. Your job is to direct changes in a video-game world and structure based on the given design document (or changes to the existing design).';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    return [];
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
        scenarioId: message.payload.scenarioId,
      },
    })} where id = ${thoughtProcessId}`;
  }
}
