import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useScenario = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['scenario', id],
    queryFn: async () => {
      const { data, error } = await client.from('scenarios').select('*').eq('id', id).single();
      if (error) {
        throw new Error(error.message);
      }

      const { data: characters, error: charactersError } = await client
        .from('scenario_characters')
        .select('*')
        .eq('scenario_id', id);
      if (charactersError) {
        throw new Error(charactersError.message);
      }

      const { data: storylines, error: storylinesError } = await client
        .from('storylines')
        .select('*')
        .eq('scenario_id', id);
      if (storylinesError) {
        throw new Error(storylinesError.message);
      }

      const { data: storylineStories, error: storylineStoriesError } = await client
        .from('storyline_stories')
        .select('*')
        .in(
          'storyline_id',
          storylines.map(s => s.id)
        );
      if (storylineStoriesError) {
        throw new Error(storylineStoriesError.message);
      }

      return { ...data, characters, stories: storylineStories };
    },
  });
};
