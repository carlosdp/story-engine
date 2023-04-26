import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useLetters = () => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['letters'],
    queryFn: async () => {
      const { data, error } = await client.from('letters').select('*');
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
