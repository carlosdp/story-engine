import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Center,
  Divider,
  Flex,
  Heading,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useConversation } from '../hooks/useConversation';

export const ConversationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: conversation, isLoading } = useConversation(id!);

  if (isLoading || !conversation) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="32px">
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} to={`/worlds/${conversation.world_id}/conversations`}>
              Conversations
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Text fontWeight="bold">{conversation.id}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Divider />
        <Flex flexWrap="wrap">
          <Stat>
            <StatLabel>Sender</StatLabel>
            <StatNumber>{conversation.source_character_id}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Recipient</StatLabel>
            <StatNumber>{conversation.target_character_id}</StatNumber>
          </Stat>
        </Flex>
        <Flex flexDirection="column" gap="22px">
          <Flex flexDirection="column" gap="12px">
            <Heading size="md">Content</Heading>
            {/* @ts-ignore */}
            <Text whiteSpace="pre">{conversation.data.text}</Text>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
