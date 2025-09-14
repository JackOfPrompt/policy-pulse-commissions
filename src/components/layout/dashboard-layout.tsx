import { ReactNode } from "react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  role: string;
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
}

export function DashboardLayout({ children, role, user }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar role={role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}