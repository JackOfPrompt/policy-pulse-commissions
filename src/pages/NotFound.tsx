import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4 text-primary">404</h1>
          <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
          <p className="text-sm text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <BackButton 
            to="/" 
            label="Return to Home" 
            variant="default"
            className="w-full"
          />
          
          <div className="flex items-center justify-center">
            <Home className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Take me back to safety
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
