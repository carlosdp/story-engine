import { useMutation, useQuery, useQueryClient } from 'react-query';

import { useSupabase } from '../SupabaseProvider.js';

export const useWorld = (id: string) => {
  const { client } = useSupabase();
  const queryClient = useQueryClient();

  const results = useQuery({
    queryKey: ['world', id],
    queryFn: async () => {
      const { data, error } = await client.from('worlds').select('*').eq('id', id).single();
      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
  });

  const { mutateAsync: sendMessage } = useMutation({
    mutationFn: async (message: string) => {
      if (!results.data) {
        throw new Error('No world data');
      }

      await client
        .from('worlds')
        .update({
          state: {
            ...(results.data.state as any),
            messages: [...(results.data.state as any).messages, { role: 'user', content: message }],
          },
        })
        .eq('id', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['world', id]);
    },
  });

  return { ...results, sendMessage };
};
