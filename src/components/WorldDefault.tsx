import { Navigate } from 'react-router-dom';

import { useWorlds } from '../hooks/useWorlds.js';

export const WorldDefault = () => {
  const { data: worlds } = useWorlds();

  if (!worlds) {
    return null;
  }

  if (worlds && worlds.length === 0) {
    return <Navigate to="/worlds/create" replace={true} />;
  }

  return <Navigate to={`/worlds/${worlds[0].id}/characters`} />;
};
