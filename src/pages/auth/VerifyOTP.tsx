import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const VerifyOTP = () => {
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempUser, setTempUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem("tempUser");
    if (!userData) {
      navigate("/auth/login");
      return;
    }
    setTempUser(JSON.parse(userData));
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!tempUser) {
      setError("Session expired. Please login again.");
      navigate("/auth/login");
      return;
    }

    try {
      // Fetch user with OTP details
      const { data: user, error: fetchError } = await supabase
        .from("users_auth")
        .select("*")
        .eq("id", tempUser.id)
        .single();

      if (fetchError || !user) {
        setError("User not found");
        return;
      }

      // Check if OTP is valid and not expired
      const now = new Date();
      const otpExpiresAt = new Date(user.otp_expires_at);

      if (!user.otp_code || user.otp_code !== otpCode) {
        setError("Invalid OTP code");
        return;
      }

      if (now > otpExpiresAt) {
        setError("OTP has expired. Please login again.");
        navigate("/auth/login");
        return;
      }

      // Update last login and clear OTP
      const { error: updateError } = await supabase
        .from("users_auth")
        .update({
          last_login: now.toISOString(),
          otp_code: null,
          otp_expires_at: null,
        })
        .eq("id", user.id);

      if (updateError) {
        setError("Failed to verify OTP");
        return;
      }

      // Store user session
      sessionStorage.setItem("currentUser", JSON.stringify({
        id: user.id,
        phoneNumber: user.phone_number,
        role: user.role,
        isActive: user.is_active,
      }));

      // Clear temporary user data
      sessionStorage.removeItem("tempUser");

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // Redirect based on role
      console.log("Redirecting user with role:", user.role);
      navigate("/admin/overview");
    } catch (err) {
      setError("An error occurred during OTP verification");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!tempUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">
            Enter the 6-digit OTP sent to {tempUser.phoneNumber}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otpCode">OTP Code</Label>
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate("/auth/login")}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyOTP;