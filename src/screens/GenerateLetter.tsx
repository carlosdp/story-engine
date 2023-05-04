import { Box, Button, Heading, useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCreateJob } from '../hooks/useCreateJob';

export const GenerateLetter = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { create } = useCreateJob();
  const toast = useToast();

  const generate = useCallback(async () => {
    await create({
      name: 'generateRandomLetters',
      data: {
        worldId: worldId!,
      },
    });
    toast({
      title: 'Generating Letters',
      description: 'Your letters are being generated. They will appear in the letter list once it is ready.',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    navigate(`/worlds/${worldId}/conversations`);
  }, [create, toast, navigate, worldId]);

  return (
    <PageContainer>
      <Heading>Generate Letters</Heading>
      <Box>
        <Button onClick={generate}>Generate</Button>
      </Box>
    </PageContainer>
  );
};
