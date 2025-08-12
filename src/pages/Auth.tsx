import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanupAuthState } from "@/lib/auth-cleanup";

const AuthPage: React.FC = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Set up auth state listener first
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Defer DB calls out of the callback to avoid deadlocks
        setTimeout(async () => {
          try {
            const selectedRole = localStorage.getItem("selectedRole");

            if (selectedRole) {
              // Find the role_id and its landing page
              const { data: role, error: roleErr } = await supabase
                .from("login_roles")
                .select("role_id, role_name, default_landing_page")
                .eq("role_name", selectedRole)
                .maybeSingle();

              if (roleErr) {
                console.error(roleErr);
              } else if (role) {
                // Validate existing user role, if any
                const { data: existing, error: existingErr } = await supabase
                  .from("users")
                  .select("role_id")
                  .eq("user_id", session.user.id)
                  .maybeSingle();

                if (existingErr) console.error(existingErr);

                if (existing?.role_id && existing.role_id !== role.role_id) {
                  toast({
                    title: "Role mismatch",
                    description:
                      "Your account is assigned a different role. Please use the correct role or contact support.",
                    variant: "destructive",
                  });

                  const { data: existingRole } = await supabase
                    .from("login_roles")
                    .select("default_landing_page")
                    .eq("role_id", existing.role_id)
                    .maybeSingle();

                  if (existingRole?.default_landing_page) {
                    window.location.replace(existingRole.default_landing_page);
                  } else {
                    window.location.replace("/");
                  }
                  return;
                }

                // Ensure a users row exists or update email verification status
                const { error: upsertErr } = await supabase
                  .from("users")
                  .upsert(
                    {
                      user_id: session.user.id,
                      role_id: role.role_id,
                      is_email_verified: Boolean(session.user.email_confirmed_at),
                    },
                    { onConflict: "user_id" }
                  );

                if (upsertErr) console.error(upsertErr);

                // Redirect to the role's landing page
                if (role.default_landing_page) {
                  window.location.replace(role.default_landing_page);
                  return;
                }
              }
            }

            // Fallback: try to resolve by current role function
            const { data: roleName } = await supabase.rpc("current_user_role_name");
            if (roleName) {
              const { data: lr } = await supabase
                .from("login_roles")
                .select("default_landing_page")
                .eq("role_name", roleName)
                .maybeSingle();
              if (lr?.default_landing_page) {
                window.location.replace(lr.default_landing_page);
                return;
              } else if (roleName === "System Admin") {
                window.location.replace("/dashboard/system-admin");
                return;
              }
            }

            // Final fallback
            window.location.replace("/");
          } catch (e) {
            console.error(e);
          }
        }, 0);
      }
    });

    // Then fetch existing session
    supabase.auth.getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const pageTitle = useMemo(() => (mode === "login" ? "Login" : "Create account"), [mode]);

  const handleSignup = async () => {
    setLoading(true);
    try {
      // Cleanup to avoid auth limbo
      try { cleanupAuthState(); } catch {}
      try { await supabase.auth.signOut({ scope: "global" as any }); } catch {}

      const redirectUrl = `${window.location.origin}/`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl },
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "Confirm your email to finish signup." });
      setMode("login");
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Clean up possible stale auth state before logging in
      try { cleanupAuthState(); } catch {}
      try { await supabase.auth.signOut({ scope: "global" as any }); } catch {}

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "Logged in", description: "Welcome back!" });
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message || String(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = () => {
    try {
      localStorage.setItem("selectedRole", "System Admin");
    } catch {}
    setEmail("admin@system.com");
    setPassword("123456");
    setTimeout(() => {
      handleLogin();
    }, 0);
  };
  return (
    <>
      <Helmet>
        <title>{pageTitle} | Abiraksha Insurtech</title>
        <meta name="description" content="Login or sign up to access your Abiraksha Insurtech dashboard." />
        <link rel="canonical" href={`${window.location.origin}/auth`} />
      </Helmet>
      <main className="container mx-auto max-w-md px-4 py-12">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-2">Use your email and password to continue.</p>
        </header>

        <section className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          </div>

          {mode === "signup" ? (
            <Button onClick={handleSignup} disabled={loading} className="w-full">Create account</Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={handleLogin} disabled={loading} className="w-full">Log in</Button>
              <Button variant="outline" onClick={handleDemoAdminLogin} disabled={loading} className="w-full">Login as System Admin (demo)</Button>
            </div>
          )}

          <div className="text-sm text-center text-muted-foreground">
            {mode === "signup" ? (
              <button onClick={() => setMode("login")} className="underline">Have an account? Log in</button>
            ) : (
              <button onClick={() => setMode("signup")} className="underline">New here? Create an account</button>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default AuthPage;
