import {
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Center,
  Divider,
  Flex,
  Heading,
  Spinner,
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
import { useScenario } from '../hooks/useScenario';

export const ScenarioDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: scenario, isLoading } = useScenario(id!);

  if (isLoading || !scenario) {
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
            <BreadcrumbLink as={Link} to={`/worlds/${scenario.world_id}/scenarios`}>
              Scenarios
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Text fontWeight="bold">{scenario.name}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Heading>{scenario.name}</Heading>
        <Divider />
        <Heading size="md">Story</Heading>
        <Text whiteSpace="pre-wrap">{scenario.stories.map(s => s.text).join('\n\n')}</Text>
        <Divider />
        <Flex flexDirection="column">
          <Heading size="md">Characters</Heading>
          <Table>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Description</Th>
              </Tr>
            </Thead>
            <Tbody>
              {scenario.characters?.map(character => (
                <Tr key={character.id}>
                  <Td>
                    <Link to={`/characters/${character.id}`}>{character.name}</Link>
                  </Td>
                  <Td>{character.description}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
