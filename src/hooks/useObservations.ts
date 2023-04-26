import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useObservations = () => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['observations'],
    queryFn: async () => {
      const { data, error } = await client
        .from('observations')
        .select('id, subsystem, text, location, created_at')
        .is('updated_observation_id', null);
      if (error) {
        throw new Error(error.message);
      }

      return data.map(o => ({
        ...o,
        location: (o.location as string)
          .slice(1, -1)
          .split(',')
          .map((v: string) => +v),
      }));
    },
  });
};
