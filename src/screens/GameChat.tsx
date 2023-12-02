import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  Center,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
} from '@chakra-ui/react';
import moment from 'moment';
import { ReactEventHandler, useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useWorld } from '../hooks/useWorld.js';

const ChatItem = ({ message }: { message: { role: string; content: string } }) => {
  return (
    <Flex alignItems="flex-start" gap="18px">
      <Flex alignItems="center" gap="12px">
        <Text>{moment().format('HH:mm:ss')}</Text>
        <Badge colorScheme={message.role === 'user' ? 'blue' : 'red'}>{message.role}</Badge>
      </Flex>
      <Text whiteSpace="pre">{message.content}</Text>
    </Flex>
  );
};

export const GameChat = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: world, isLoading, sendMessage } = useWorld(worldId!);
  const [composedMessage, setComposedMessage] = useState<string>('');

  const onMessageChange: ReactEventHandler<HTMLInputElement> = useCallback(e => {
    setComposedMessage(e.currentTarget.value);
  }, []);

  const onSendMessage = useCallback(async () => {
    await sendMessage(composedMessage);
    setComposedMessage('');
  }, [sendMessage, composedMessage]);

  if (isLoading || !world) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  const messages = (world.state as any).messages ?? [];

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="32px">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to={`/worlds`}>
              Worlds
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Text fontWeight="bold">{world.name}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Flex gap="22px">
          <Flex flexDirection="column" gap="22px">
            <Heading size="lg">Game</Heading>
            <Flex flexDirection="column" gap="18px">
              {messages.map((message: any, i: number) => (
                <ChatItem key={i} message={message} />
              ))}
            </Flex>
            <Flex flexDirection="row" gap="18px">
              <Input onChange={onMessageChange} placeholder="Type a message..." value={composedMessage} />
              <Button colorScheme="blue" onClick={onSendMessage}>
                Send
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
