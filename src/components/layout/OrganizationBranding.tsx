import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OrganizationLogoManagement } from "./OrganizationLogoManagement";

interface Organization {
  id: string;
  name: string;
  logo_url?: string;
  contact_name?: string;
  city?: string;
  state?: string;
}

interface OrganizationBrandingProps {
  className?: string;
  allowEdit?: boolean;
  size?: "sm" | "md" | "lg";
}

export function OrganizationBranding({ 
  className, 
  allowEdit = false,
  size = "md" 
}: OrganizationBrandingProps) {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrganization = async () => {
      if (!profile?.org_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, logo_url, contact_name, city, state')
          .eq('id', profile.org_id)
          .single();

        if (error) throw error;
        setOrganization(data);
      } catch (error) {
        console.error('Error loading organization:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, [profile?.org_id]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  const handleLogoUpdate = (newLogoUrl: string | null) => {
    setOrganization(prev => prev ? { ...prev, logo_url: newLogoUrl } : null);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {allowEdit ? (
        <OrganizationLogoManagement
          organizationId={organization.id}
          currentLogoUrl={organization.logo_url}
          organizationName={organization.name}
          onLogoUpdate={handleLogoUpdate}
          size={size}
          readonly={false}
        />
      ) : (
        <>
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={`${organization.name} logo`}
              className={`object-cover rounded-lg border ${
                size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-10 h-10"
              }`}
            />
          ) : (
            <div className={`bg-primary/10 rounded-lg flex items-center justify-center ${
              size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-10 h-10"
            }`}>
              <Building2 className={`text-primary ${
                size === "sm" ? "h-4 w-4" : size === "lg" ? "h-8 w-8" : "h-5 w-5"
              }`} />
            </div>
          )}
        </>
      )}
      
      <div className="space-y-1">
        <p className="font-medium text-foreground">{organization.name}</p>
        {organization.city && organization.state && (
          <p className="text-xs text-muted-foreground">
            {organization.city}, {organization.state}
          </p>
        )}
      </div>
    </div>
  );
}