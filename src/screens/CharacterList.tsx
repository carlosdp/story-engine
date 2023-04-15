import { Badge, Box, Button, Center, Spinner, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCharacters } from '../hooks/useCharacters';

export const CharacterList = () => {
  const { data: characters, isLoading } = useCharacters();

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
        <Button as={Link} to="/generate-characters">
          Generate
        </Button>
      </Box>
      <Table>
        <Thead>
          <Th>Name</Th>
          <Th>Type</Th>
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
