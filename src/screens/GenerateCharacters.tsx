import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useCreateJob } from '../hooks/useCreateJob.js';

type CharacterJob = {
  count: number;
  prompt: string;
};

export const GenerateCharacters = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<CharacterJob>({
    defaultValues: {
      count: 1,
    },
  });
  const { create } = useCreateJob();
  const toast = useToast();

  const onSubmit: SubmitHandler<CharacterJob> = useCallback(
    async data => {
      await create({
        name: 'generateCharacters',
        data: {
          worldId: worldId!,
          count: data.count,
          prompt: data.prompt,
        },
      });
      toast({
        title: 'Generating Characters',
        description: 'Your characters are being generated. They will appear in the character list once they are ready.',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
      navigate(`/worlds/${worldId}/characters`);
    },
    [create, toast, navigate, worldId]
  );

  return (
    <PageContainer>
      <Heading>Generate Characters</Heading>
      <Flex flexDirection="column" gap="22px">
        <Flex flexDirection="column" gap="12px">
          <FormControl isInvalid={!!formState.errors.count} isRequired={true}>
            <FormLabel>Count</FormLabel>
            <NumberInput>
              <NumberInputField {...register('count', { required: true })} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {formState.errors.count && <FormErrorMessage>{formState.errors.count.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!formState.errors.prompt} isRequired={true}>
            <FormLabel>Prompt</FormLabel>
            <Textarea {...register('prompt')} />
            {formState.errors.prompt && <FormErrorMessage>{formState.errors.prompt.message}</FormErrorMessage>}
          </FormControl>
        </Flex>
        <Button isDisabled={!formState.isValid} isLoading={formState.isLoading} onClick={handleSubmit(onSubmit)}>
          Generate
        </Button>
      </Flex>
    </PageContainer>
  );
};
