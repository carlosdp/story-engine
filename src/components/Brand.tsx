import { Flex, Image, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

export const Brand = () => {
  return (
    <Flex alignItems="center" gap="8px">
      <Image width="42px" height="42px" alt="Whispering Fable Logo" src="/ai-rust-logo.png" />
      <Text as={Link} fontSize="lg" fontWeight="bold" to="/">
        Whispering Fable
      </Text>
    </Flex>
  );
};
