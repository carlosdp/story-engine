export type GenerateCharactersJob = {
  prompt: string;
  rustNpcType: string;
  count: number;
  model?: 'gpt-3.5-turbo' | 'gpt-4';
};
