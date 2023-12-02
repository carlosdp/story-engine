import { Box } from '@chakra-ui/react';
import { Route, Routes } from 'react-router-dom';

import { AuthenticatedRoutes } from './components/AuthenticatedRoutes.js';
import { Brand } from './components/Brand.js';
import { TopNav } from './components/TopNav.js';
import { WorldDefault } from './components/WorldDefault.js';
import { CharacterDetail } from './screens/CharacterDetail.js';
import { CharacterList } from './screens/CharacterList.js';
import { ConversationDetail } from './screens/ConversationDetail.js';
import { ConversationList } from './screens/ConversationList.js';
import { CreateGame } from './screens/CreateGame.js';
import { CreateScenario } from './screens/CreateScenario.js';
import { CreateWorld } from './screens/CreateWorld.js';
import { GameChat } from './screens/GameChat.js';
import { GenerateCharacters } from './screens/GenerateCharacters.js';
import { GenerateLetter } from './screens/GenerateLetter.js';
import { Login } from './screens/Login.js';
import { MockSignals } from './screens/MockSignals.js';
import { Observations } from './screens/Observations.js';
import { ScenarioDetail } from './screens/ScenarioDetail.js';
import { Scenarios } from './screens/Scenarios.js';
import { ThoughtProcessDetails } from './screens/ThoughtProcessDetails.js';
import { ThoughtProcesses } from './screens/ThoughtProcesses.js';

function App() {
  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%" minHeight="100vh">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="1690px" padding="0px 32px">
          <Brand />
          <TopNav />
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/" element={<WorldDefault />} />
          <Route path="/worlds/create" element={<CreateWorld />} />
          <Route path="/worlds/:worldId/chat" element={<GameChat />} />
          <Route path="/worlds/:worldId/scenarios" element={<Scenarios />} />
          <Route path="/worlds/:worldId/characters" element={<CharacterList />} />
          <Route path="/worlds/:worldId/scenarios/create" element={<CreateScenario />} />
          <Route path="/worlds/:worldId/generate-characters" element={<GenerateCharacters />} />
          <Route path="/worlds/:worldId/documents/create" element={<CreateGame />} />
          <Route path="/scenarios/:id" element={<ScenarioDetail />} />
          <Route path="/characters/:id" element={<CharacterDetail />} />
          <Route path="/worlds/:worldId/thought_processes" element={<ThoughtProcesses />} />
          <Route path="/thought_processes/:id" element={<ThoughtProcessDetails />} />
          <Route path="/worlds/:worldId/send-signals" element={<MockSignals />} />
          <Route path="/worlds/:worldId/conversations" element={<ConversationList />} />
          <Route path="/worlds/:worldId/generate-letter" element={<GenerateLetter />} />
          <Route path="/conversations/:id" element={<ConversationDetail />} />
          <Route path="/worlds/:worldId/observations" element={<Observations />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
