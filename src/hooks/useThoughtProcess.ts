import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useThoughtProcess = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['thought_process', id],
    queryFn: async () => {
      const { data, error } = await client.from('thought_processes').select('*').eq('id', id).single();
      if (error) {
        throw new Error(error.message);
      }

      const { data: thoughtMessages, error: thoughtMessagesError } = await client
        .from('thought_process_messages')
        .select('*')
        .eq('thought_process_id', id);
      if (thoughtMessagesError) {
        throw new Error(thoughtMessagesError.message);
      }

      const { data: actions, error: actionsError } = await client
        .from('thought_process_actions')
        .select('*')
        .eq('thought_process_id', id);
      if (actionsError) {
        throw new Error(actionsError.message);
      }

      const { data: signals, error: signalsError } = await client
        .from('signals')
        .select('*')
        .in(
          'from_action_id',
          actions.map(action => action.id)
        );
      if (signalsError) {
        throw new Error(signalsError.message);
      }

      const { data: responseSignals, error: responseSignalsError } = await client
        .from('signals')
        .select('*')
        .in(
          'response_to',
          signals.map(signal => signal.id)
        );
      if (responseSignalsError) {
        throw new Error(responseSignalsError.message);
      }

      const combinedSignals = [...signals, ...responseSignals].sort((a, b) => a.created_at.localeCompare(b.created_at));

      return { ...data, messages: thoughtMessages, actions, signals: combinedSignals };
    },
  });
};
