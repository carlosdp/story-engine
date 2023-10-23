import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useConversations = (worldId: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['character_conversations', worldId],
    queryFn: async () => {
      const { data, error } = await client.from('character_conversations').select('*').eq('world_id', worldId);
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
