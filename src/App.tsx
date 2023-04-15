import { Box, Text } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';

import { CharacterDetail } from './screens/CharacterDetail';
import { CharacterList } from './screens/CharacterList';
import { GenerateCharacters } from './screens/GenerateCharacters';

function App() {
  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="1690px">
          <Text as={Link} fontSize="lg" fontWeight="bold" to="/">
            Calamity Control
          </Text>
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/" element={<CharacterList />} />
        <Route path="/generate-characters" element={<GenerateCharacters />} />
        <Route path="/characters/:id" element={<CharacterDetail />} />
      </Routes>
    </Box>
  );
}

export default App;
