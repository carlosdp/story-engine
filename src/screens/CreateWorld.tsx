import { Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Textarea } from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useCreateWorld } from '../hooks/useCreateWorld.js';

type WorldCreationParameters = {
  name: string;
  description: string;
};

export const CreateWorld = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<WorldCreationParameters>();
  const { create } = useCreateWorld();

  const onSubmit: SubmitHandler<WorldCreationParameters> = useCallback(
    async data => {
      const newWorldId = await create({
        name: data.name,
        description: data.description,
      });

      navigate(`/worlds/${newWorldId}/scenarios/create`);
    },
    [create, navigate]
  );

  return (
    <PageContainer>
      <Heading paddingBottom="16px">Create New World</Heading>
      <Flex flexDirection="column" gap="22px">
        <Flex flexDirection="column" gap="12px">
          <FormControl isInvalid={!!formState.errors.name} isRequired={true}>
            <FormLabel>World Name</FormLabel>
            <Input {...register('name', { required: true })} />
            {formState.errors.name && <FormErrorMessage>{formState.errors.name.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!formState.errors.description} isRequired={true}>
            <FormLabel>Describe your world</FormLabel>
            <Textarea {...register('description', { required: true })} />
            {formState.errors.description && (
              <FormErrorMessage>{formState.errors.description.message}</FormErrorMessage>
            )}
          </FormControl>
        </Flex>
        <Button isDisabled={!formState.isValid} isLoading={formState.isLoading} onClick={handleSubmit(onSubmit)}>
          Create
        </Button>
      </Flex>
    </PageContainer>
  );
};
