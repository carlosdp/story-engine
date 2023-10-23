import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useScenarios = (worldId: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['scenarios', worldId],
    queryFn: async () => {
      const { data, error } = await client.from('scenarios').select('*').eq('world_id', worldId);
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
