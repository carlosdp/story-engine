import { Button, Flex, Link, Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';
import { AiFillCaretDown } from 'react-icons/ai';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';

import { useWorlds } from '../hooks/useWorlds';

const nav = {
  Scenarios: '/scenarios',
  Characters: '/characters',
  'Thought Processes': '/thought_processes',
  Conversations: '/conversations',
  Observations: '/observations',
};

export const TopNav = () => {
  const navigate = useNavigate();
  const { data: worlds } = useWorlds();
  const { pathname } = useLocation();
  const [selectedWorldId, setSelectedWorldId] = useState<string | null>(null);

  useEffect(() => {
    if (worlds && worlds.length > 0) {
      const savedWorldId = localStorage.getItem('worldId');
      const worldId = savedWorldId || worlds[0].id;

      setSelectedWorldId(worldId);
    }
  }, [worlds]);

  const handleWorldChange = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      const worldId = event.currentTarget.value;

      setSelectedWorldId(worldId);
      localStorage.setItem('worldId', worldId);

      if (pathname.includes('/worlds')) {
        navigate(pathname.replace(/\/worlds\/(\w-)+/, `/worlds/${worldId}`));
      }
    },
    [navigate, pathname]
  );

  const selectedWorld = worlds?.find(world => world.id === selectedWorldId);

  return (
    <Flex alignItems="center" gap="18px" marginLeft="32px">
      <Menu>
        <MenuButton
          as={Button}
          fontSize="md"
          fontWeight="normal"
          rightIcon={<AiFillCaretDown size="12px" />}
          variant="unstyled"
        >
          {selectedWorld?.name ?? 'Select World'}
        </MenuButton>
        <MenuList>
          {worlds?.map(world => (
            <MenuItem key={world.id} onClick={handleWorldChange} value={world.id}>
              {world.name}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
      {selectedWorldId &&
        Object.entries(nav).map(([label, path]) => (
          <Link
            key={path}
            as={RouterLink}
            fontSize="md"
            fontWeight={pathname.includes(path) ? 'bold' : 'normal'}
            style={{ textDecoration: 'none' }}
            to={`/worlds/${selectedWorldId}${path}`}
          >
            {label}
          </Link>
        ))}
    </Flex>
  );
};
