import { Box, Button, useToast } from '@chakra-ui/react';
import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const MockSignals = () => {
  const { client } = useSupabase();
  const toast = useToast();

  const sendPassageOfTime = useCallback(async () => {
    await client.from('job').insert({
      name: 'sendTimeSignal',
    });

    toast({
      title: 'Passage of Time Signal Sent',
      status: 'success',
      description: 'Manually sent a passage of time signal to the Overlord subsystem',
      duration: 5000,
    });
  }, [client, toast]);

  return (
    <PageContainer>
      <Box>
        <Button onClick={sendPassageOfTime}>Send Passage of Time</Button>
      </Box>
    </PageContainer>
  );
};
