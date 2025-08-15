// This file has been replaced by ManageLocations.tsx
// The database has been consolidated into master_locations table
// Please use the new ManageLocations component instead

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ManageCitiesPincodes() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to the new locations management page
    navigate('/admin/locations');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to consolidated locations management...</p>
      </div>
    </div>
  );
}