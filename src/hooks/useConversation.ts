import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useConversation = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['character_conversation', id],
    queryFn: async () => {
      const { data, error } = await client.from('character_conversations').select('*').eq('id', id).single();
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
