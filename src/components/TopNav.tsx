import { Flex, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const nav = {
  Characters: '/characters',
  'Thought Processes': '/thought_processes',
  Letters: '/letters',
};

export const TopNav = () => {
  const { pathname } = useLocation();

  return (
    <Flex alignItems="center" gap="18px" marginLeft="32px">
      {Object.entries(nav).map(([label, path]) => (
        <Link
          key={path}
          as={RouterLink}
          fontSize="md"
          fontWeight={pathname.includes(path) ? 'bold' : 'normal'}
          style={{ textDecoration: 'none' }}
          to={path}
        >
          {label}
        </Link>
      ))}
    </Flex>
  );
};
