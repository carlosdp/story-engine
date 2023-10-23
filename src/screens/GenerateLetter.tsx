import { Box, Button, Heading, useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useCreateJob } from '../hooks/useCreateJob.js';

export const GenerateLetter = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { create } = useCreateJob();
  const toast = useToast();

  const generateLetters = useCallback(async () => {
    await create({
      name: 'generateRandomLetters',
      data: {
        worldId: worldId!,
      },
    });
    toast({
      title: 'Generating Letters',
      description: 'Your letters are being generated. They will appear in the conversation list once ready.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate(`/worlds/${worldId}/conversations`);
  }, [create, toast, navigate, worldId]);

  const generateDialogue = useCallback(async () => {
    await create({
      name: 'generateRandomDialogue',
      data: {
        worldId: worldId!,
      },
    });
    toast({
      title: 'Generating Dialogue',
      description: 'Your dialogue is being generated. They will appear in the conversation list once ready.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate(`/worlds/${worldId}/conversations`);
  }, [create, toast, navigate, worldId]);

  return (
    <PageContainer>
      <Heading>Generate Conversations</Heading>
      <Box>
        <Button onClick={generateLetters}>Generate Letters</Button>
      </Box>
      <Box>
        <Button onClick={generateDialogue}>Generate Dialogue</Button>
      </Box>
    </PageContainer>
  );
};
