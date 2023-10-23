import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider.js';
import { Database } from '../supabaseTypes.js';

export const useSubmitDesignDocument = () => {
  const { client } = useSupabase();

  const create = useCallback(
    async (game: Database['public']['Functions']['submit_design_document']['Args']) => {
      const res = await client.rpc('submit_design_document', game);
      if (res.error) {
        throw new Error(res.error.message);
      }

      return res.data;
    },
    [client]
  );

  return { create };
};
