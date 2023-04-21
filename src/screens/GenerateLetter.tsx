import {
  Button,
  Center,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Select,
  Spinner,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCharacters } from '../hooks/useCharacters';
import { useCreateJob } from '../hooks/useCreateJob';

type LetterJob = {
  sender: string;
  recipient: string;
  prompt: string;
};

export const GenerateLetter = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<LetterJob>({});
  const { create } = useCreateJob();
  const toast = useToast();

  const { data: characters, isLoading } = useCharacters();

  const onSubmit: SubmitHandler<LetterJob> = useCallback(
    async data => {
      await create({
        name: 'generateLetter',
        data: {
          sender: data.sender,
          recipient: data.recipient,
          prompt: data.prompt,
        },
      });
      toast({
        title: 'Generating Letter',
        description: 'Your letter are being generated. It will appear in the letter list once it is ready.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/');
    },
    [create, toast, navigate]
  );
  if (isLoading) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }
  return (
    <PageContainer>
      <Heading>Generate Letter</Heading>
      <Flex flexDirection="column" gap="22px">
        <Flex flexDirection="column" gap="12px">
          <FormControl isRequired={true}>
            <FormLabel>Sender </FormLabel>
            <Select placeholder="Select a sender" {...register('sender')}>
              {characters?.map(character => (
                <option key={`sender-${character.id}`} value={`${character.id}`}>
                  {character.first_name} {character.last_name}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl isRequired={true}>
            <FormLabel>Recipient </FormLabel>
            <Select placeholder="Select a recipient" {...register('recipient')}>
              {characters?.map(character => (
                <option key={`recipient-${character.id}`} value={`${character.id}`}>
                  {character.first_name} {character.last_name}
                </option>
              ))}
            </Select>
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
