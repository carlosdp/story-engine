import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useCharacters = () => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const { data, error } = await client.from('characters').select('*');
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
