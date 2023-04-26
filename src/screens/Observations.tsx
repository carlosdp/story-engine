import { Center, Flex } from '@chakra-ui/react';

import { PageContainer } from '../components/PageContainer';
import { RustMap } from '../components/RustMap';
import { useObservations } from '../hooks/useObservations';

export const Observations = () => {
  const { data: observations } = useObservations();

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
