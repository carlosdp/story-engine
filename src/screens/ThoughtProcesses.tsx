import { Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import moment from 'moment';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useThoughtProcesses } from '../hooks/useThoughtProcesses.js';

export const ThoughtProcesses = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: thoughtProcesses, isLoading } = useThoughtProcesses(worldId!);

  if (isLoading) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Box>
        <Button as={Link} to={`/worlds/${worldId}/send-signals`}>
          Mock Signal
        </Button>
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Subsystem</Th>
            <Th>Started At</Th>
          </Tr>
        </Thead>
        <Tbody>
          {thoughtProcesses
            ?.filter(process => !process.parent_thought_process_id)
            .map(process => (
              <Tr key={process.id}>
                <Td>
                  <Link to={`/thought_processes/${process.id}`}>{process.subsystem}</Link>
                </Td>
                <Td>{moment(process.created_at).format('YYYY-MM-DD HH:mm:ss')}</Td>
              </Tr>
            ))}
        </Tbody>
      </Table>
    </PageContainer>
  );
};
