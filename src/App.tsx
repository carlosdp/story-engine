import { Box, Text } from '@chakra-ui/react';
import { Routes, Route, Link } from 'react-router-dom';

import { PageContainer } from './components/PageContainer';
import { CharacterDetail } from './screens/CharacterDetail';
import { CharacterList } from './screens/CharacterList';
import { GenerateCharacters } from './screens/GenerateCharacters';
import { MockSignals } from './screens/MockSignals';
import { ThoughtProcessDetails } from './screens/ThoughtProcessDetails';
import { ThoughtProcesses } from './screens/ThoughtProcesses';

const Home = () => {
  return (
    <PageContainer>
      <Text as={Link} fontSize="xl" fontWeight="bold" to="/characters">
        Characters
      </Text>
      <Text as={Link} fontSize="xl" fontWeight="bold" to="/thought_processes">
        Thought Processes
      </Text>
    </PageContainer>
  );
};

function App() {
  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="1690px" padding="0px 32px">
          <Text as={Link} fontSize="lg" fontWeight="bold" to="/">
            Calamity Control
          </Text>
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/generate-characters" element={<GenerateCharacters />} />
        <Route path="/characters/:id" element={<CharacterDetail />} />
        <Route path="/thought_processes" element={<ThoughtProcesses />} />
        <Route path="/thought_processes/:id" element={<ThoughtProcessDetails />} />
        <Route path="/send-signals" element={<MockSignals />} />
      </Routes>
    </Box>
  );
}

export default App;
