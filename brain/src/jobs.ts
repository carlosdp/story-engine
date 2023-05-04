export type GenerateCharactersJob = {
  worldId: string;
  prompt: string;
  rustNpcType: string;
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
