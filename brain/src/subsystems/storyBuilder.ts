import { Action, ActionResult, SignalAction, SignalActionPayload } from '../action.js';
import { sql } from '../db.js';
import { embedding } from '../utils.js';
import { LLMSubsystem } from './base.js';
import { EntityBuilder } from './entityBuilder.js';

class CreateCharacter extends SignalAction {
  description = 'Create a character for use in the storyline, returns the name of the character';
  parameters = {
    description: { type: 'string', description: 'a description of the individual character that is needed' },
    story: { type: 'string', description: 'relevant parts of the story text to use as context' },
  };
  from_subsystem = StoryBuilder;
  subsystem = EntityBuilder;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return {
      command: `Create a character based on this description: ${parameters.description}`,
      story_reference: parameters.story,
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created character: ${JSON.stringify(response)}`;
  }
}

class WriteStory extends Action {
  description = 'Write the story for this storyline';
  parameters = {
    text: { type: 'string', description: 'the text of the story, can span multiple paragraphs' },
  };

  async execute(_thoughtActionId: string, parameters: Record<string, unknown>, _data: any): Promise<ActionResult> {
    const embed = await embedding(parameters.text as string);

    const stories = await sql`insert into stories ${sql({
      world_id: this.thoughtProcess.world_id,
      text: parameters.text as string,
      embedding: JSON.stringify(embed),
    })} returning id`;

    return { status: 'complete', data: { id: stories[0].id } };
  }

  async result(_thoughtActionId: string, _parameters: Record<string, unknown>, data: any): Promise<string> {
    return `Story written to ID ${data.id}`;
  }
}

class CreateLocation extends SignalAction {
  description = 'Create a location for use in the story, returns the name of the location';
  parameters = {
    description: { type: 'string', description: 'a description of the location' },
    story: { type: 'string', description: 'relevant parts of the story text to use as context' },
  };
  from_subsystem = StoryBuilder;
  subsystem = EntityBuilder;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return {
      command: `Create a location based on this description: ${parameters.description}`,
      story_reference: parameters.story,
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created location: ${JSON.stringify(response)}`;
  }
}

class CreateOrganization extends SignalAction {
  description = 'Create a an organization for use in the story, returns the name of the organization';
  parameters = {
    description: { type: 'string', description: 'a description of the organization' },
    story: { type: 'string', description: 'relevant parts of the story text to use as context' },
  };
  from_subsystem = StoryBuilder;
  subsystem = EntityBuilder;

  async payload(_worldId: string, parameters: Record<string, string>): Promise<SignalActionPayload> {
    return {
      command: `Create an organization based on this description: ${parameters.description}`,
      story_reference: parameters.story,
    };
  }

  async responseToResult(_parameters: Record<string, unknown>, response: SignalActionPayload): Promise<string> {
    return `Created organization: ${JSON.stringify(response)}`;
  }
}

export class StoryBuilder extends LLMSubsystem {
  description = 'Responsible for managing storylines';
  actions = [CreateCharacter, WriteStory, CreateLocation, CreateOrganization];
  agentPurpose =
    'You are a superintelligent story designer for a perisistent video-game world. Your job is to design narratives that follow and extend parent narratives, and write a story that will be turned into a mission.';
  model = 'gpt-4' as const;
  temperature = 0.1;

  override async instructions(): Promise<string[]> {
    return [
      'Dependencies that are mentioned in the story, such as specific individual characters (named or unnamed), organizations, or locations, must be created (or found via search) before they can be used in the story',
      'All characters, locations, etc. included in the story must be explicitly created before the story can be written',
      'Once you have the dependencies you need, write the story',
    ];
  }
}
