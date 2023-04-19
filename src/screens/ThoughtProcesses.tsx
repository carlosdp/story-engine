import { Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import moment from 'moment';
import { Link } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useThoughtProcesses } from '../hooks/useThoughtProcesses';

export const ThoughtProcesses = () => {
  const { data: thoughtProcesses, isLoading } = useThoughtProcesses();

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
        <Button as={Link} to="/send-signals">
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
          {thoughtProcesses?.map(process => (
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
