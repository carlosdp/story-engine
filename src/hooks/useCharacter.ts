import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useCharacter = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const { data, error } = await client.from('characters').select('*').eq('id', id).single();
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
