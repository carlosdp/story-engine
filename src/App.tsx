import { Box, Text } from '@chakra-ui/react';
import { Routes, Route } from 'react-router-dom';

import { CharacterList } from './screens/CharacterList';
import { GenerateCharacters } from './screens/GenerateCharacters';

function App() {
  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="936px">
          <Text>Calamity Control</Text>
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/" element={<CharacterList />} />
        <Route path="/generate-characters" element={<GenerateCharacters />} />
      </Routes>
    </Box>
  );
}

export default App;
