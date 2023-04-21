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
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';
import { useLetter } from '../hooks/useLetter';

export const LetterDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: letter, isLoading } = useLetter(id!);
  const { client } = useSupabase();
  const [letterWithSenders, setLetterWithSenders] = useState<any>();

  useEffect(() => {
    const makeLetter = async () => {
      const { data: sender } = await client.from('characters').select('*').eq('id', letter.sender).single();
      const { data: recipient } = await client.from('characters').select('*').eq('id', letter.recipient).single();

      const senderName = sender ? `${sender.first_name} ${sender.last_name}` : 'unknown';
      const recipientName = recipient ? `${recipient.first_name} ${recipient.last_name}` : 'unknown';
      setLetterWithSenders({ ...letter, senderName, recipientName });
    };

    if (letter && client) makeLetter();
  }, [letter, client]);

  if (isLoading || !letterWithSenders) {
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
            <BreadcrumbLink as={Link} to="/letters">
              Letters
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Text fontWeight="bold">{letterWithSenders.summary}</Text>
          </BreadcrumbItem>
        </Breadcrumb>
        <Divider />
        <Flex flexWrap="wrap">
          <Stat>
            <StatLabel>Sender</StatLabel>
            <StatNumber>{letterWithSenders.senderName}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Recipient</StatLabel>
            <StatNumber>{letterWithSenders.recipientName}</StatNumber>
          </Stat>
        </Flex>
        <Flex flexDirection="column" gap="22px">
          <Flex flexDirection="column" gap="12px">
            <Heading size="md">Content</Heading>
            <Text>{letterWithSenders.content}</Text>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
