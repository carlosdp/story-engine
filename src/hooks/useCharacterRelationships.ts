import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useCharacterRelationships = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['character_relationships', id],
    queryFn: async () => {
      const { data, error } = await client.rpc('related_characters', { p_character_id: id }).select('*');
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
