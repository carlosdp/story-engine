import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useThoughtProcesses = () => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['thought_processes'],
    queryFn: async () => {
      const { data, error } = await client
        .from('thought_processes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });
};
