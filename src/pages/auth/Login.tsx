import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import bcrypt from "bcryptjs";

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with phone:", phoneNumber);
      
      // Fetch user by phone number with role information
      const { data: user, error: fetchError } = await supabase
        .from("users_auth")
        .select(`
          *,
          roles (
            id,
            name,
            slug,
            default_dashboard,
            is_active
          )
        `)
        .eq("phone_number", phoneNumber)
        .eq("is_active", true)
        .single();

      console.log("Database query result:", { user, fetchError });

      if (fetchError || !user) {
        console.error("User fetch error:", fetchError);
        setError("Invalid phone number or user not found");
        return;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        setError("Invalid password");
        return;
      }

      // Store user data in sessionStorage and navigate to role's default dashboard
      sessionStorage.setItem("currentUser", JSON.stringify({ 
        id: user.id, 
        phoneNumber: user.phone_number, 
        role: user.role,
        roleInfo: user.roles
      }));

      toast({
        title: "Login Successful",
        description: `Welcome, ${user.roles?.name || 'User'}!`,
      });

      // Navigate to role's default dashboard or fallback to overview
      const defaultDashboard = user.roles?.default_dashboard || "/admin/overview";
      navigate(defaultDashboard);
    } catch (err) {
      setError("An error occurred during login");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your phone number and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;