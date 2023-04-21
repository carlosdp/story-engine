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
  Select,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCreateJob } from '../hooks/useCreateJob';

type CharacterJob = {
  count: number;
  rustNpcType: string;
  prompt: string;
};

export const GenerateCharacters = () => {
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
          count: data.count,
          rustNpcType: data.rustNpcType,
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
      navigate('/characters');
    },
    [create, toast, navigate]
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
          <FormControl isInvalid={!!formState.errors.rustNpcType} isRequired={true}>
            <FormLabel>Rust NPC Type</FormLabel>
            <Select placeholder="Select a role" {...register('rustNpcType', { required: true })}>
              <option value="scientist">Scientist</option>
              <option value="bandit">Bandit</option>
            </Select>
            {formState.errors.rustNpcType && (
              <FormErrorMessage>{formState.errors.rustNpcType.message}</FormErrorMessage>
            )}
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
