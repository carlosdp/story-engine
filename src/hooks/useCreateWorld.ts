import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { Database } from '../supabaseTypes';

export const useCreateWorld = () => {
  const { client } = useSupabase();

  const create = useCallback(
    async (world: Database['public']['Functions']['create_world']['Args']) => {
      const res = await client.rpc('create_world', world).select('id').single();
      if (res.error) {
        throw new Error(res.error.message);
      }

      return res.data.id;
    },
    [client]
  );

  return { create };
};
