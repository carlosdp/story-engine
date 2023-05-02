import { Badge, Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCharacters } from '../hooks/useCharacters';

export const CharacterList = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: characters, isLoading } = useCharacters(worldId!);

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
        <Button as={Link} to={`/worlds/${worldId}/generate-characters`}>
          Generate
        </Button>
      </Box>
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
          </Tr>
        </Thead>
        <Tbody>
          {characters?.map(character => (
            <Tr key={character.id}>
              <Td>
                <Link to={`/characters/${character.id}`}>{`${character.title ? character.title + ' ' : ''}${
                  character.first_name
                } ${character.last_name}`}</Link>
              </Td>
              <Td>
                <Badge colorScheme="red">{character.rust_npc_type}</Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageContainer>
  );
};
