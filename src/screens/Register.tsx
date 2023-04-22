import { useSupabase } from '../SupabaseProvider';
import { LinkSteam } from './LinkSteam';
import { SteamLinked } from './SteamLinked';

export const Register = () => {
  const { user } = useSupabase();

  if (!user) {
    return null;
  }

  return !user.steam_id ? <LinkSteam /> : <SteamLinked />;
};
