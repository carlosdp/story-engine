import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider.js';
import { Database } from '../supabaseTypes.js';

export const useCreateScenario = () => {
  const { client } = useSupabase();

  const create = useCallback(
    async (scenario: Database['public']['Functions']['create_scenario']['Args']) => {
      const res = await client.rpc('create_scenario', scenario);
      if (res.error) {
        throw new Error(res.error.message);
      }

      return res.data;
    },
    [client]
  );

  return { create };
};
