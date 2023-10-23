import { Badge, Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer.js';
import { useConversations } from '../hooks/useConversations.js';

export const ConversationList = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: conversations, isLoading } = useConversations(worldId!);

  if (isLoading || !conversations) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Box>
        <Button as={Link} to={`/worlds/${worldId}/generate-letter`}>
          Generate
        </Button>
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Sender</Th>
            <Th>Recipient</Th>
          </Tr>
        </Thead>
        <Tbody>
          {conversations.map(conversation => (
            <Tr key={conversation.id}>
              <Td>
                <Link to={`/conversations/${conversation.id}`}>{conversation.type}</Link>
              </Td>
              <Td>
                <Badge colorScheme="blue">{conversation.type}</Badge>
              </Td>
              <Td>
                <Badge colorScheme="red">{conversation.source_character_id}</Badge>
              </Td>
              <Td>
                <Badge colorScheme="red">{conversation.target_character_id}</Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageContainer>
  );
};
