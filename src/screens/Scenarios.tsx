import { Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useScenarios } from '../hooks/useScenarios';

export const Scenarios = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: scenarios, isLoading } = useScenarios(worldId!);

  if (isLoading) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Box>
        <Button as={Link} to={`/worlds/${worldId}/scenarios/create`}>
          Create New
        </Button>
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
          </Tr>
        </Thead>
        <Tbody>
          {scenarios?.map(scenario => (
            <Tr key={scenario.id}>
              <Td>
                <Link to={`/scenarios/${scenario.id}`}>{scenario.name}</Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageContainer>
  );
};
