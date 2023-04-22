import { Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useCallback } from 'react';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const LinkSteam = () => {
  const { client } = useSupabase();

  const linkSteam = useCallback(async () => {
    const sessionRes = await client.auth.getSession();
    const session = sessionRes.data?.session;

    if (!session) {
      return;
    }

    const res = await fetch('/.netlify/functions/steam-auth-redirect', {
      method: 'GET',
      headers: {
        'x-supabase-access-token': session.access_token,
      },
    });
    const { redirectUrl } = await res.json();
    window.location = redirectUrl;
  }, [client]);

  return (
    <PageContainer>
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1}>
        <Flex alignItems="center" flexDirection="column" gap="32px" minHeight="400px">
          <Flex alignItems="center" flexDirection="column" gap="18px">
            <Heading>Welcome!</Heading>
            <Text fontSize="lg">In order to complete your registration, click below to link your Steam account</Text>
            <Button onClick={linkSteam}>Link Steam Account</Button>
            <Text fontSize="12px">
              <strong>Why?</strong> We use your Steam ID to whitelist you on our servers
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
