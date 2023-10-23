import { Button, Flex, FormControl, FormErrorMessage, FormLabel, Heading, Textarea } from '@chakra-ui/react';
import { useCallback } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useSubmitDesignDocument } from '../hooks/useSubmitDesignDocument.js';

type GameCreationParameters = {
  document: string;
};

export const CreateGame = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { register, handleSubmit, formState } = useForm<GameCreationParameters>();
  const { create } = useSubmitDesignDocument();

  const onSubmit: SubmitHandler<GameCreationParameters> = useCallback(
    async data => {
      const newDocumentId = await create({
        world_id: worldId!,
        content: data.document,
      });

      navigate(`/worlds/${worldId}/documents/${newDocumentId}`);
    },
    [create, navigate, worldId]
  );

  return (
    <PageContainer>
      <Heading paddingBottom="16px">Create New World</Heading>
      <Flex flexDirection="column" gap="22px">
        <Flex flexDirection="column" gap="12px">
          <FormControl isInvalid={!!formState.errors.document} isRequired={true}>
            <FormLabel>Design Document</FormLabel>
            <Textarea {...register('document', { required: true })} />
            {formState.errors.document && <FormErrorMessage>{formState.errors.document.message}</FormErrorMessage>}
          </FormControl>
        </Flex>
        <Button isDisabled={!formState.isValid} isLoading={formState.isLoading} onClick={handleSubmit(onSubmit)}>
          Create
        </Button>
      </Flex>
    </PageContainer>
  );
};
