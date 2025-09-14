import { useState } from "react";
import { Upload, X, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface OrganizationLogoManagementProps {
  organizationId: string;
  currentLogoUrl?: string | null;
  organizationName: string;
  onLogoUpdate: (newLogoUrl: string | null) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export function OrganizationLogoManagement({
  organizationId,
  currentLogoUrl,
  organizationName,
  onLogoUpdate,
  size = "md",
  readonly = false,
}: OrganizationLogoManagementProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${organizationId}-logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, logoFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleLogoUpdate = async () => {
    if (!logoFile) return;

    setIsUploading(true);
    try {
      const newLogoUrl = await uploadLogo();
      if (newLogoUrl) {
        // Update organization record
        const { error } = await supabase
          .from('organizations')
          .update({ logo_url: newLogoUrl })
          .eq('id', organizationId);

        if (error) throw error;

        onLogoUpdate(newLogoUrl);
        setLogoFile(null);
        setLogoPreview(null);
        
        toast({
          title: "Success",
          description: "Organization logo updated successfully",
        });
      }
    } catch (error) {
      console.error('Error updating logo:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update organization logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organizationId);

      if (error) throw error;

      onLogoUpdate(null);
      setLogoFile(null);
      setLogoPreview(null);
      
      toast({
        title: "Success",
        description: "Organization logo removed successfully",
      });
    } catch (error) {
      console.error('Error removing logo:', error);
      toast({
        title: "Remove Failed",
        description: "Failed to remove organization logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const logoToShow = logoPreview || currentLogoUrl;

  return (
    <div className="flex items-center space-x-3">
      <div className={`relative ${sizeClasses[size]} flex-shrink-0`}>
        {logoToShow ? (
          <img
            src={logoToShow}
            alt={`${organizationName} logo`}
            className="w-full h-full object-cover rounded-lg border"
          />
        ) : (
          <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
            <Upload className="w-1/2 h-1/2 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Preview Button */}
        {logoToShow && (
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{organizationName} Logo</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                <img
                  src={logoToShow}
                  alt={`${organizationName} logo`}
                  className="max-w-full max-h-64 object-contain rounded-lg"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit/Upload Controls */}
        {!readonly && (
          <>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id={`logo-upload-${organizationId}`}
            />
            <label htmlFor={`logo-upload-${organizationId}`}>
              <Button variant="outline" size="sm" asChild>
                <span className="cursor-pointer">
                  <Edit className="h-4 w-4" />
                </span>
              </Button>
            </label>

            {logoFile && (
              <Button
                variant="default"
                size="sm"
                onClick={handleLogoUpdate}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Save"}
              </Button>
            )}

            {(logoFile || currentLogoUrl) && (
              <Button
                variant="destructive"
                size="sm"
                onClick={logoFile ? () => {
                  setLogoFile(null);
                  setLogoPreview(null);
                } : handleLogoRemove}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}