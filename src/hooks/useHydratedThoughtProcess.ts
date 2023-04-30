import { useQuery } from 'react-query';

import { useSupabase } from '../SupabaseProvider';

export const useHydratedThoughtProcess = (id: string) => {
  const { client } = useSupabase();

  return useQuery({
    queryKey: ['hydrated_thought_process', id],
    queryFn: async () => {
      const { data: thoughtProcesses, error: thoughtProcessesError } = await client
        .from('thought_processes')
        .select('*')
        .or(`id.eq.${id},parent_thought_process_id.eq.${id}`);
      if (thoughtProcessesError) {
        throw thoughtProcessesError;
      }

      const { data: messages, error: messagesError } = await client
        .from('thought_process_messages')
        .select('*')
        .in(
          'thought_process_id',
          thoughtProcesses.map(thoughtProcess => thoughtProcess.id)
        );
      if (messagesError) {
        throw messagesError;
      }

      const { data: initiatingSignal, error: initiatingSignalError } = await client
        .from('messages')
        .select('*')
        .eq(
          'id',
          thoughtProcesses.find(thoughtProcess => !thoughtProcess.parent_thought_process_id)?.initiating_message_id
        )
        .single();
      if (initiatingSignalError) {
        throw initiatingSignalError;
      }

      const { data: actions, error: actionsError } = await client
        .from('thought_process_actions')
        .select('*')
        .in(
          'thought_process_id',
          thoughtProcesses.map(thoughtProcess => thoughtProcess.id)
        );
      if (actionsError) {
        throw actionsError;
      }

      const { data: signals, error: signalsError } = await client
        .from('messages')
        .select('*')
        .in(
          'from_action_id',
          actions.map(action => action.id)
        );
      if (signalsError) {
        throw signalsError;
      }

      const hydratedActions = actions.map(action => {
        const thoughtProcess = thoughtProcesses.find(tp => tp.id === action.thought_process_id);

        return {
          ...action,
          subsystem: thoughtProcess!.subsystem,
        };
      });

      const hydratedMessages = messages.map(message => {
        const thoughtProcess = thoughtProcesses.find(tp => tp.id === message.thought_process_id);

        return {
          ...message,
          subsystem: thoughtProcess!.subsystem,
        };
      });

      // sort alphabetically by created_at
      const events = [...hydratedMessages, ...signals, ...hydratedActions].flat().sort((a, b) => {
        if (a.created_at < b.created_at) {
          return -1;
        }
        if (a.created_at > b.created_at) {
          return 1;
        }
        return 0;
      });

      return { thoughtProcesses, initiatingSignal, events };
    },
  });
};
