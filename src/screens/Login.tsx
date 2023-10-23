import { Button, Center, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider.js';
import { PageContainer } from '../components/PageContainer.js';

export const Login = () => {
  const { client, user } = useSupabase();
  const { state } = useLocation();

  const onDiscordLogin = useCallback(() => {
    client.auth.signInWithOAuth({ provider: 'discord' });
  }, [client]);

  if (user) {
    return <Navigate to={state?.forward ?? '/'} replace={true} />;
  }

  return (
    <PageContainer>
      <Center></Center>
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1}>
        <Flex alignItems="center" flexDirection="column" gap="32px" minHeight="400px">
          <Flex alignItems="center" flexDirection="column" gap="32px">
            <Heading size="4xl">Welcome</Heading>
            <Text fontSize="lg">
              Let's get you registered for <strong>Whispering Fable!</strong>
            </Text>
            <Button onClick={onDiscordLogin}>Login with Discord</Button>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
