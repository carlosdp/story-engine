import { Button, Center } from '@chakra-ui/react';
import { useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

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
      <Center>
        <Button onClick={onDiscordLogin}>Login with Discord</Button>
      </Center>
    </PageContainer>
  );
};
