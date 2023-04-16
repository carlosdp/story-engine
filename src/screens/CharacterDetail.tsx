import {
  Badge,
  Center,
  Divider,
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
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { Link, useParams } from 'react-router-dom';

import { PageContainer } from '../components/PageContainer';
import { useCharacter } from '../hooks/useCharacter';
import { useCharacterRelationships } from '../hooks/useCharacterRelationships';

export const CharacterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: character, isLoading } = useCharacter(id!);
  const { data: relatedCharacters } = useCharacterRelationships(id!);

  if (isLoading || !character) {
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <PageContainer>
      <Flex flexDirection="column" gap="32px">
        <Heading>
          {character.title ? character.title + ' ' : ''}
          {character.first_name} {character.last_name}
        </Heading>
        <Divider />
        <Flex flexWrap="wrap">
          <Stat>
            <StatLabel>Title</StatLabel>
            <StatNumber>{character.title ?? 'None'}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>First Name</StatLabel>
            <StatNumber>{character.first_name}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Last Name</StatLabel>
            <StatNumber>{character.last_name}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Rust NPC Type</StatLabel>
            <StatNumber>{character.rust_npc_type}</StatNumber>
          </Stat>
        </Flex>
        <Flex flexDirection="column" gap="22px">
          <Flex flexDirection="column" gap="12px">
            <Heading size="md">Backstory</Heading>
            <Text>{character.backstory}</Text>
          </Flex>
          <Flex flexDirection="column" gap="12px">
            <Heading size="md">Personality</Heading>
            <Text>{character.personality}</Text>
          </Flex>
          <Flex flexDirection="column" gap="12px">
            <Heading size="md">Writing Style</Heading>
            <Text>{character.writing_style}</Text>
          </Flex>
        </Flex>
        <Flex flexDirection="column">
          <Heading size="md">Relationships</Heading>
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Relationship</Th>
                <Th>Interaction Details</Th>
              </Tr>
            </Thead>
            <Tbody>
              {relatedCharacters?.map(relatedCharacter => (
                <Tr key={relatedCharacter.id}>
                  <Td>
                    <Link to={`/characters/${relatedCharacter.id}`}>
                      {relatedCharacter.title ? relatedCharacter.title + ' ' : ''}
                      {relatedCharacter.first_name} {relatedCharacter.last_name}
                    </Link>
                  </Td>
                  <Td>
                    <Badge>{relatedCharacter.relationship_type}</Badge>
                  </Td>
                  <Td>{relatedCharacter.description_of_interactions}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
