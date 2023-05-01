import { Badge, Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';
import { useLetters } from '../hooks/useLetters';

export const LetterList = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: letters, isLoading } = useLetters(worldId!);
  const { client } = useSupabase();
  const [lettersWithSenders, setLettersWithSenders] = useState<any[]>();

  useEffect(() => {
    const makeLetters = async (_letters: any[]) => {
      const newList: any[] = [];
      for (const letter of _letters) {
        const { data: sender } = await client.from('characters').select('*').eq('id', letter.sender).single();
        const { data: recipient } = await client.from('characters').select('*').eq('id', letter.recipient).single();
        const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'unknown';
        const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : 'unknown';
        newList.push({ ...letter, senderName, recipientName });
      }
      setLettersWithSenders(newList);
    };

    if (letters && client) makeLetters(letters);
  }, [letters, client]);

  if (isLoading || !lettersWithSenders) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Box>
        <Button as={Link} to="/generate-letter">
          Generate
        </Button>
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Sender</Th>
            <Th>Recipient</Th>
          </Tr>
        </Thead>
        <Tbody>
          {lettersWithSenders.map(letter => (
            <Tr key={letter.id}>
              <Td>
                <Link to={`/letters/${letter.id}`}>{letter.summary}</Link>
              </Td>
              <Td>
                <Badge colorScheme="red">{letter.senderName}</Badge>
              </Td>
              <Td>
                <Badge colorScheme="red">{letter.recipientName}</Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageContainer>
  );
};
