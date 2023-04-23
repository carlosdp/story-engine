import { Box, Button, Flex, Heading, Image, Link, Text, useToken } from '@chakra-ui/react';
import { AiFillCheckCircle } from 'react-icons/ai';
import { BsFillHandThumbsUpFill } from 'react-icons/bs';

import { useSupabase } from '../SupabaseProvider';
import { PageContainer } from '../components/PageContainer';

export const SteamLinked = () => {
  const { user } = useSupabase();
  const [green400] = useToken('colors', ['green.400']);

  return (
    <PageContainer>
      <Flex alignItems="center" justifyContent="center" flexDirection="column" flex={1}>
        <Flex alignItems="center" flexDirection="column" gap="32px" minHeight="400px">
          <Flex alignItems="center" gap="18px">
            <Box background="white" borderRadius="full">
              <AiFillCheckCircle size="100px" color={green400} />
            </Box>
            <Heading>Your Steam is linked!</Heading>
          </Flex>
          <Flex>
            <Image width="200px" objectFit="cover" alt="Rust Logo" src="/rust-logo.png" />
            <Flex flexDirection="column" gap="12px">
              <Text fontSize="lg" fontWeight="bold">
                {user?.owns_rust === null
                  ? "Your Steam profile is private, so we don't if you own Rust. That's okay, just make sure you own Rust before the server starts!"
                  : !user?.owns_rust
                  ? "It looks like you don't own a copy of Rust on Steam..."
                  : 'It looks like you own a copy of Rust on Steam, you are good to go!'}
              </Text>
              {!user?.owns_rust ? (
                <>
                  <Text>
                    You will need a copy in order to play on the server, make sure you buy it before the server begins!
                  </Text>
                  <Box>
                    <Button
                      as={Link}
                      href="https://store.steampowered.com/app/252490/Rust/"
                      style={{ textDecoration: 'none' }}
                      target="_blank"
                    >
                      Buy Rust on Steam
                    </Button>
                  </Box>
                </>
              ) : (
                <Flex alignItems="center" justifyContent="center">
                  <BsFillHandThumbsUpFill size="100px" color={green400} />
                </Flex>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </PageContainer>
  );
};
