import { Box } from '@chakra-ui/react';
import { Route, Routes } from 'react-router-dom';

import { useSupabase } from './SupabaseProvider';
import { AuthenticatedRoutes } from './components/AuthenticatedRoutes';
import { Brand } from './components/Brand';
import { StaffRoutes } from './components/StaffRoutes';
import { TopNav } from './components/TopNav';
import { CharacterDetail } from './screens/CharacterDetail';
import { CharacterList } from './screens/CharacterList';
import { ConversationDetail } from './screens/ConversationDetail';
import { ConversationList } from './screens/ConversationList';
import { GenerateCharacters } from './screens/GenerateCharacters';
import { GenerateLetter } from './screens/GenerateLetter';
import { Login } from './screens/Login';
import { MockSignals } from './screens/MockSignals';
import { Observations } from './screens/Observations';
import { Register } from './screens/Register';
import { ThoughtProcessDetails } from './screens/ThoughtProcessDetails';
import { ThoughtProcesses } from './screens/ThoughtProcesses';

function App() {
  const { user } = useSupabase();

  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%" minHeight="100vh">
      <Box justifyContent="center" display="flex" width="100%" paddingTop="36px" paddingBottom="36px">
        <Box alignItems="center" flexDirection="row" display="flex" width="100%" maxWidth="1690px" padding="0px 32px">
          <Brand />
          {user?.is_staff && <TopNav />}
          <Box marginLeft="auto"></Box>
        </Box>
      </Box>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthenticatedRoutes />}>
          <Route path="/" element={<Register />} />
          <Route element={<StaffRoutes />}>
            <Route path="/worlds/:worldId/characters" element={<CharacterList />} />
            <Route path="/worlds/:worldId/generate-characters" element={<GenerateCharacters />} />
            <Route path="/characters/:id" element={<CharacterDetail />} />
            <Route path="/worlds/:worldId/thought_processes" element={<ThoughtProcesses />} />
            <Route path="/thought_processes/:id" element={<ThoughtProcessDetails />} />
            <Route path="/worlds/:worldId/send-signals" element={<MockSignals />} />
            <Route path="/worlds/:worldId/conversations" element={<ConversationList />} />
            <Route path="/worlds/:worldId/generate-letter" element={<GenerateLetter />} />
            <Route path="/conversations/:id" element={<ConversationDetail />} />
            <Route path="/worlds/:worldId/observations" element={<Observations />} />
          </Route>
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
