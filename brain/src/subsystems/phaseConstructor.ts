import { ReturnAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { SubsystemMessage } from '../signal.js';
import { LLMSubsystem } from './base.js';

class FinalizePhase extends ReturnAction {
  description = 'Finalize the phase parameters';
  parameters = {
    parentPhase: { type: 'string', description: 'the parent phase' },
    name: { type: 'string', description: 'the name of the phase' },
    description: { type: 'string', description: 'a description of the phase' },
    procedure: {
      type: 'string',
      description:
        'a plain text, detailed procedure to follow for the phase, including any UI elements needed to collect or display information to the players',
    },
  };
  required = ['parentPhase', 'name', 'description', 'procedure'];

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    const worldRes = await sql`select * from worlds where id = ${this.thoughtProcess.world_id}`;
    const world = worldRes[0];

    let newPhases = { ...world.phases };

    if (this.thoughtProcess.data.phaseIndex !== null) {
      // replace the phase in place at the given index, where the index is the index of the phase across all parent phases (so if there are 2 phases in Pre-Play and 3 in Play, the index of the first phase in Play is 2)
      let i = 0;
      newPhases = Object.entries(newPhases).map(([parentPhase, phases]: any[]) => {
        if (parentPhase === parameters.parentPhase) {
          return [
            parentPhase,
            phases.map((phase: any) => {
              if (i++ === this.thoughtProcess.data.phaseIndex) {
                return {
                  name: parameters.name,
                  description: parameters.description,
                  procedure: parameters.procedure,
                };
              }

              return phase;
            }),
          ];
        }

        return [parentPhase, phases];
      });
    } else {
      newPhases = {
        ...newPhases,
        [parameters.parentPhase]: [
          ...(newPhases[parameters.parentPhase] ?? []),
          {
            name: parameters.name,
            description: parameters.description,
            procedure: parameters.procedure,
          },
        ],
      };
    }

    await sql`update worlds set ${sql({ phases: newPhases })} where id = ${this.thoughtProcess.world_id}`;

    return { result: `Updated phase ${parameters.name}` };
  }
}

export class PhaseConstructor extends LLMSubsystem {
  description = 'Responsible for building executable phases from a design document';
  actions = [FinalizePhase];
  agentPurpose =
    'You are a superintelligent game developer. Your job is to design (or modify) phases in a game procedural loop to meet the needs of the game design document, and the specified phase description.';
  model = 'gpt-4' as const;
  temperature = 0;

  override async instructions(): Promise<string[]> {
    const documentRes =
      await sql`select content from design_documents where id = ${this.thoughtProcess.data.designDocumentId}`;
    const document = documentRes[0];

    return [
      `The game's procedural loop is expressed as a list of phases, executed in order in three categories:
      > Pre-Play: Set of phases that happen before the main game loop begins
      > Play: The main game loop, phases are executed in order until the game is ended (so the last phase(s) should be checks to see if end conditions are met)
      > Post-Play: Set of phases that happen after the game ends`,
      'Each phase procedure must contain all the information necessary to display any options or UI data to the player that would be necessary to execute the phase, or for a UI designer to design a UI for the phase',
      'Use the provided relevant parts of the game design document to design the procedure for the phase',
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
        phaseIndex: message.payload.index ?? null,
      },
    })} where id = ${thoughtProcessId}`;
  }
}
