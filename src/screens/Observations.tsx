import { Center, Flex } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { RustMap } from '../components/RustMap.js';
import { useObservations } from '../hooks/useObservations.js';

export const Observations = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: observations } = useObservations(worldId!);

  return (
    <PageContainer>
      <Center>
        <Flex flexDirection="column" width="800px" height="800px">
          <RustMap observations={observations} />
        </Flex>
      </Center>
    </PageContainer>
  );
};
