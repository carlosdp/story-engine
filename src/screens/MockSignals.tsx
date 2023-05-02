import { Box, Button, useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const MockSignals = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { client } = useSupabase();
  const toast = useToast();

  const sendPassageOfTime = useCallback(async () => {
    await client.from('job').insert({
      name: 'sendTimeSignal',
      data: {
        worldId: worldId!,
      },
    });

    toast({
      title: 'Passage of Time Signal Sent',
      status: 'success',
      description: 'Manually sent a passage of time signal to the Overlord subsystem',
      duration: 5000,
      isClosable: true,
    });
  }, [client, toast, worldId]);

  return (
    <PageContainer>
      <Box>
        <Button onClick={sendPassageOfTime}>Send Passage of Time</Button>
      </Box>
    </PageContainer>
  );
};
