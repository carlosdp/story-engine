import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';

export const AuthenticatedRoutes = () => {
  const { user } = useSupabase();
  const { pathname } = useLocation();

  if (user === null) {
    return <Navigate to="/login" replace={true} state={{ forward: pathname }} />;
  }

  return <Outlet />;
};
