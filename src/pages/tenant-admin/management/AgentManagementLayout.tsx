import { Outlet } from 'react-router-dom';

export const AgentManagementLayout = () => {
  return (
    <div className="space-y-6">
      <Outlet />
    </div>
  );
};