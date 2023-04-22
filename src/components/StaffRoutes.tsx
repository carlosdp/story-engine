import { Navigate, Outlet } from 'react-router-dom';

import { useSupabase } from '../SupabaseProvider';

export const StaffRoutes = () => {
  const { user } = useSupabase();

  if (user && !user?.is_staff) {
    return <Navigate to="/" replace={true} />;
  }

  return <Outlet />;
};
