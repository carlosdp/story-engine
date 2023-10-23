import { useSupabase } from '../SupabaseProvider.js';
import { LinkSteam } from './LinkSteam.js';
import { SteamLinked } from './SteamLinked.js';

export const Register = () => {
  const { user } = useSupabase();

  if (!user) {
    return null;
  }

  return !user.steam_id ? <LinkSteam /> : <SteamLinked />;
};
