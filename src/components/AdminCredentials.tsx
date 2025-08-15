import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AdminCredentials = () => {
  const [showPasswords, setShowPasswords] = useState(false);
  const { toast } = useToast();

  const testCredentials = [
    { email: 'admin@system.com', password: 'admin123', role: 'System Admin', description: 'Full system access' },
    { email: 'tenant@admin.com', password: 'tenant123', role: 'Tenant Admin', description: 'Tenant management' },
    { email: 'employee@company.com', password: 'employee123', role: 'Employee', description: 'Employee dashboard' },
    { email: 'agent@insurance.com', password: 'agent123', role: 'Agent', description: 'Agent tools and client management' },
    { email: 'customer@email.com', password: 'customer123', role: 'Customer', description: 'Customer portal' }
  ];

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          Test Credentials
          <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
            Development Only
          </Badge>
        </CardTitle>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Test credentials for all user roles - click Login to use these
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Show Passwords</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPasswords(!showPasswords)}
            className="h-8"
          >
            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {testCredentials.map((cred, index) => (
            <div key={index} className="border border-amber-200 dark:border-amber-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-amber-900 dark:text-amber-100">{cred.role}</h4>
                <Badge variant="outline" className="text-xs">
                  {cred.description}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div>
                  <label className="text-xs font-medium text-amber-700 dark:text-amber-300">Email</label>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="bg-amber-100 dark:bg-amber-800 px-2 py-1 rounded text-xs flex-1 truncate">
                      {cred.email}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(cred.email, "Email")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-amber-700 dark:text-amber-300">Password</label>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="bg-amber-100 dark:bg-amber-800 px-2 py-1 rounded text-xs flex-1">
                      {showPasswords ? cred.password : "•••••••"}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(cred.password, "Password")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800 p-3 rounded">
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Click "Login" in the top navigation</li>
            <li>Copy and paste any email/password combination above</li>
            <li>After login, access role-specific dashboards from the user menu</li>
            <li>Each role has different permissions and dashboard access</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCredentials;