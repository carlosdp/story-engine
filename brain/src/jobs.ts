export type GenerateCharactersJob = {
  worldId: string;
  prompt: string;
  count: number;
  model?: 'gpt-3.5-turbo' | 'gpt-4';
};

export type GenerateLetterJob = {
  worldId: string;
  sender: string;
  recipient: string;
  model?: 'gpt-3.5-turbo' | 'gpt-4';
};

export type TimeSignalJob = {
  worldId: string;
};

export type StartCharacterJob = {
  worldId: string;
  playerCharacterId: string;
  prompt: string;
};

export type CreateScenarioJob = {
  scenarioId: string;
};

export type CreateCharacterJob = {
  storylineId: string;
  characterId: string;
};

export type SubmitDesignDocumentJob = {
  designDocumentId: string;
};
