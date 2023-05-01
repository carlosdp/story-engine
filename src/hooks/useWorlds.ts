import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useWorlds = () => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['worlds'],
    queryFn: async () => {
      const { data, error } = await client.from('worlds').select('*');
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
