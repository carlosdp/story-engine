import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { Database } from '../supabaseTypes';

export const useCreateJob = () => {
  const { client } = useSupabase();

  const create = useCallback(
    async (job: Database['public']['Tables']['job']['Insert']) => {
      const res = await client.from('job').insert(job).select('id').single();

      if (res.error) {
        throw new Error(res.error.message);
      }

      return res.data.id;
    },
    [client]
  );

  return { create };
};
