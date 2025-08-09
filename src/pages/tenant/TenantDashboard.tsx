import { Outlet } from "react-router-dom";
import { TenantSidebar } from "@/components/tenant/TenantSidebar";

const TenantDashboard = () => {
  return (
    <div className="flex h-screen bg-background">
      <TenantSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default TenantDashboard;
