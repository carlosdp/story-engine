import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useThoughtProcesses = (worldId: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['thought_processes', worldId],
    queryFn: async () => {
      const { data, error } = await client
        .from('thought_processes')
        .select('*')
        .eq('world_id', worldId)
        .order('created_at', { ascending: false });
      if (error) {
        error.message && console.error(error.message);
        return [];
      }

      return data;
    },
  });
};
