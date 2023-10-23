import { Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Input, Textarea } from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useCreateScenario } from '../hooks/useCreateScenario.js';

type ScenarioCreationParameters = {
  name: string;
  description: string;
};

export const CreateScenario = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<ScenarioCreationParameters>();
  const { create } = useCreateScenario();

  const onSubmit: SubmitHandler<ScenarioCreationParameters> = useCallback(
    async data => {
      const newScenarioId = await create({
        world_id: worldId!,
        name: data.name,
        description: data.description,
      });

      navigate(`/scenarios/${newScenarioId}`);
    },
    [create, navigate, worldId]
  );

  return (
    <PageContainer>
      <Heading paddingBottom="16px">Create New Scenario</Heading>
      <Flex flexDirection="column" gap="22px">
        <Flex flexDirection="column" gap="12px">
          <FormControl isInvalid={!!formState.errors.name} isRequired={true}>
            <FormLabel>Scenario Name</FormLabel>
            <Input {...register('name', { required: true })} />
            {formState.errors.name && <FormErrorMessage>{formState.errors.name.message}</FormErrorMessage>}
          </FormControl>
          <FormControl isInvalid={!!formState.errors.description} isRequired={true}>
            <FormLabel>Describe the story of the scenario</FormLabel>
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
