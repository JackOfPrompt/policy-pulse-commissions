import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cleanupAuthState } from "@/lib/auth-cleanup";
export default function AdminLayout({ children, showSidebar = true }: { children: ReactNode; showSidebar?: boolean }) {
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: "global" as any });
      } catch {}
      window.location.href = "/auth";
    } catch (error: any) {
      toast({ title: "Logout error", description: error?.message || String(error), variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <header className="h-14 flex items-center border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {showSidebar && <SidebarTrigger />}
            <span className="font-semibold">Abiraksha Insurtech Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] w-full">
        {showSidebar && <AppSidebar />}
        <SidebarInset className="flex-1">
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
