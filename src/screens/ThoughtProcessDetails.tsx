import {
  Badge,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Center,
  Flex,
  Heading,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useThoughtProcess } from '../hooks/useThoughtProcess';

const ThoughtMessage = ({ message }: { message: { role: string; content: string } }) => {
  const from =
    message.role === 'assistant' ? { name: 'Subsystem', color: 'blue' } : { name: 'External', color: 'gray' };

  return (
    <Flex gap="18px">
      <Box>
        <Badge colorScheme={from.color}>{from.name}</Badge>
      </Box>
      <Text>{message.content}</Text>
    </Flex>
  );
};

export const ThoughtProcessDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: thoughtProcess, isLoading } = useThoughtProcess(id!);

  if (isLoading || !thoughtProcess) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="32px">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to="/thought_processes">
              Thought Processes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Text fontWeight="bold">{thoughtProcess.subsystem}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Flex flexWrap="wrap">
          <Stat>
            <StatLabel>Subsystem</StatLabel>
            <StatNumber>{thoughtProcess.subsystem}</StatNumber>
          </Stat>
        </Flex>
        <Flex gap="22px">
          <Flex flexDirection="column" gap="22px">
            <Heading size="lg">Thoughts</Heading>
            <Flex flexDirection="column">
              {/* @ts-ignore */}
              {thoughtProcess.messages
                // @ts-ignore
                .filter(m => m.role !== 'system')
                // @ts-ignore
                .map(message => (
                  <ThoughtMessage key={message.id} message={message} />
                ))}
            </Flex>
          </Flex>
          <Flex flexDirection="column" gap="22px">
            <Heading size="lg">Signals</Heading>
            <Table>
              <Tbody>
                {thoughtProcess.signals.map(signal => (
                  <Tr key={signal.id}>
                    <Td>
                      <Badge>{signal.direction}</Badge>
                    </Td>
                    <Td>{JSON.stringify(signal.payload)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
