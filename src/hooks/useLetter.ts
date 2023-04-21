import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useLetter = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['letter', id],
    queryFn: async () => {
      const { data, error } = await client.from('letters').select('*').eq('id', id).single();
      if (error) {
        error.message && console.error(error.message);
        return undefined;
      }

      return data;
    },
  });
};
