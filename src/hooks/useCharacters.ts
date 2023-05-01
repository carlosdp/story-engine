import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useCharacters = (worldId: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['characters', worldId],
    queryFn: async () => {
      const { data, error } = await client.from('characters').select('*').eq('world_id', worldId);
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
