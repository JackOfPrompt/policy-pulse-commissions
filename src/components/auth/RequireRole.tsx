import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        setAuthorized(false);
        setChecking(false);
        navigate("/auth", { replace: true });
        return;
      }
      // Defer RPC to avoid deadlocks
      setTimeout(async () => {
        try {
          const { data: roleName, error } = await supabase.rpc("current_user_role_name");
          if (error) throw error;
          const isAllowed = !!roleName && allowedRoles.includes(roleName);
          setAuthorized(isAllowed);
          if (!isAllowed) {
            toast({
              title: "Access denied",
              description: "You do not have permission to view this page.",
              variant: "destructive",
            });
            // Try to redirect to user's default landing page if any
            if (roleName) {
              const { data: lr } = await supabase
                .from("login_roles")
                .select("default_landing_page")
                .eq("role_name", roleName)
                .maybeSingle();
              if (lr?.default_landing_page) {
                window.location.replace(lr.default_landing_page);
                return;
              }
            }
            navigate("/", { replace: true });
          }
        } catch (e: any) {
          console.error(e);
          toast({ title: "Authorization error", description: e?.message || String(e), variant: "destructive" });
          navigate("/auth", { replace: true });
        } finally {
          setChecking(false);
        }
      }, 0);
    });

    supabase.auth.getSession();

    return () => subscription.unsubscribe();
  }, [allowedRoles, navigate, toast]);

  if (checking) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 bg-muted rounded" />
          <div className="h-24 w-full bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-36 bg-muted rounded" />
            <div className="h-36 bg-muted rounded" />
            <div className="h-36 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
