import { AuthUser, SupabaseClient } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { Database } from './supabaseTypes.js';

type User = AuthUser & Database['public']['Views']['users']['Row'];
type SupabaseContextProps = {
  client: SupabaseClient<Database>;
  logout: () => void;
  user?: User | null;
};

const SupabaseContext = createContext<SupabaseContextProps>(null!);

export type SupabaseProviderProps = {
  client: SupabaseClient<Database>;
  children: React.ReactNode | React.ReactNode[];
};

export const SupabaseProvider = ({ client, children }: SupabaseProviderProps) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    client.auth
      .getUser()
      .then(res =>
        res.data.user
          ? client
              .from('users')
              .select('*')
              .eq('id', res.data.user.id)
              .single()
              .then(resu => setUser({ ...res.data.user, ...resu.data } as User))
          : setUser(res.data.user)
      )
      .catch(console.error);

    client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // eslint-disable-next-line promise/catch-or-return
        client
          .from('users')
          .select('*')
          .eq('id', session!.user!.id)
          .single()
          .then(resu => setUser({ ...session!.user!, ...resu.data } as User));
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });
  }, [client]);

  const logout = useCallback(() => {
    if (user) {
      client.auth.signOut();
    }
  }, [user, client]);

  return <SupabaseContext.Provider value={{ client, logout, user }}>{children}</SupabaseContext.Provider>;
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }

  return context;
};
