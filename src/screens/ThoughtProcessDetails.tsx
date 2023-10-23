import {
  Badge,
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
  Text,
} from '@chakra-ui/react';
import moment from 'moment';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useHydratedThoughtProcess } from '../hooks/useHydratedThoughtProcess.js';
import { useThoughtProcess } from '../hooks/useThoughtProcess.js';

type ThoughtItem = NonNullable<ReturnType<typeof useHydratedThoughtProcess>['data']>['events'][number];

const ThoughtItem = ({ item }: { item: ThoughtItem }) => {
  const subsystem = item.subsystem;
  let fromSubsystem;
  let from;
  let to;
  let content;

  if ('from_subsystem' in item) {
    fromSubsystem = item.from_subsystem;
  }

  if ('role' in item) {
    from = item.role === 'assistant' ? { name: subsystem, color: 'blue' } : { name: 'Action Result', color: 'gray' };
  } else {
    from = { name: fromSubsystem, color: 'green' };
    to = { name: subsystem, color: 'red' };
  }

  if ('content' in item) {
    // thought
    if (item.role === 'assistant') {
      const payload = JSON.parse(item.content);
      content = payload.thought;
    } else {
      content = item.content;
    }
  } else if ('payload' in item) {
    // signal
    content = JSON.stringify(item.payload);
  } else {
    // action
    from = { name: subsystem, color: 'blue' };
    to = null;
    content = `${item.action}(${JSON.stringify(item.parameters)})}`;
  }

  return (
    <Flex alignItems="flex-start" gap="18px">
      <Flex alignItems="center" gap="12px">
        <Text>{moment(item.created_at).format('HH:mm:ss')}</Text>
        <Badge colorScheme={from.color}>{from.name}</Badge>
        {to && <Badge colorScheme={to.color}>{to.name}</Badge>}
      </Flex>
      <Text whiteSpace="pre">{content}</Text>
    </Flex>
  );
};

export const ThoughtProcessDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { data: thoughtProcess, isLoading } = useThoughtProcess(id!);
  const { data: hydratedThoughtProcess } = useHydratedThoughtProcess(id!);

  if (isLoading || !thoughtProcess || !hydratedThoughtProcess) {
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
            <BreadcrumbLink as={Link} to={`/worlds/${thoughtProcess.world_id}/thought_processes`}>
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
            <Flex flexDirection="column" gap="18px">
              {hydratedThoughtProcess.events.map(event => (
                <ThoughtItem key={event.id} item={event} />
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
