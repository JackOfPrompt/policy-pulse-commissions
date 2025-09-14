import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, User, Mail, MapPin, Edit2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Organization } from '@/types/organization';

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  code: z.string().min(2, 'Organization code must be at least 2 characters'),
  description: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  industryType: z.string().optional(),
  businessType: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  employeeCount: z.string().optional(),
  annualRevenue: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface EnhancedEditTenantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSuccess: () => void;
}

export function EnhancedEditTenantModal({
  open,
  onOpenChange,
  organization,
  onSuccess,
}: EnhancedEditTenantModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      industryType: '',
      businessType: '',
      registrationNumber: '',
      taxId: '',
      employeeCount: '',
      annualRevenue: '',
      status: 'active',
    },
  });

  // Update form when organization changes
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name || '',
        code: organization.code || '',
        description: organization.description || '',
        phone: organization.phone || '',
        email: organization.email || '',
        website: organization.website || '',
        address: organization.address || '',
        city: organization.city || '',
        state: organization.state || '',
        country: organization.country || '',
        pincode: organization.pincode || '',
        industryType: organization.industry_type || '',
        businessType: organization.business_type || '',
        registrationNumber: organization.registration_number || '',
        taxId: organization.tax_id || '',
        employeeCount: organization.employee_count || '',
        annualRevenue: organization.annual_revenue || '',
        status: (organization.status as 'active' | 'inactive' | 'suspended') || 'active',
      });
      
      // Set existing logo preview
      if (organization.logo_url) {
        setLogoPreview(organization.logo_url);
      }
    }
  }, [organization, form]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(organization?.logo_url || null);
  };

  const uploadLogo = async (orgId: string): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${orgId}-logo-${Date.now()}.${fileExt}`;
      
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
        title: "Logo Upload Failed",
        description: "Failed to upload organization logo",
        variant: "destructive",
      });
      return null;
    }
  };

  const onSubmit = async (data: OrganizationFormData) => {
    if (!organization) return;

    setIsLoading(true);
    setError(null);

    try {
      // Upload logo if new file selected
      let logoUrl = organization.logo_url;
      if (logoFile) {
        const newLogoUrl = await uploadLogo(organization.id);
        if (newLogoUrl) {
          logoUrl = newLogoUrl;
        }
      }

      const { error: updateError } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          code: data.code,
          description: data.description,
          phone: data.phone,
          email: data.email,
          website: data.website,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pincode: data.pincode,
          industry_type: data.industryType,
          business_type: data.businessType,
          registration_number: data.registrationNumber,
          tax_id: data.taxId,
          employee_count: data.employeeCount,
          annual_revenue: data.annualRevenue,
          status: data.status,
          logo_url: logoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Organization details updated successfully!',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating organization:', error);
      setError(error.message || 'Failed to update organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            Edit Organization Details
          </DialogTitle>
          <DialogDescription>
            Update organization information, settings, and logo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo Upload Section */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Organization Logo</h3>
                
                {logoPreview ? (
                  <div className="relative w-32 h-32 mx-auto">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover rounded-lg border"
                    />
                    {logoFile && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">Upload organization logo</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Basic Information
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Enter organization name"
                  className={form.formState.errors.name ? 'border-destructive' : ''}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Organization Code *</Label>
                <Input
                  id="code"
                  {...form.register('code')}
                  placeholder="Enter organization code"
                  className={form.formState.errors.code ? 'border-destructive' : ''}
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.code.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Brief description of the organization"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive' | 'suspended')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4" />
              Contact Information
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="Enter email address"
                  className={form.formState.errors.email ? 'border-destructive' : ''}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  {...form.register('website')}
                  placeholder="Enter website URL"
                  className={form.formState.errors.website ? 'border-destructive' : ''}
                />
                {form.formState.errors.website && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.website.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Address Details
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                {...form.register('address')}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...form.register('state')}
                  placeholder="Enter state"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  {...form.register('pincode')}
                  placeholder="Enter pincode"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4" />
              Business Information
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="industryType">Industry Type</Label>
                <Input
                  id="industryType"
                  {...form.register('industryType')}
                  placeholder="e.g., Insurance, Healthcare"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type</Label>
                <Input
                  id="businessType"
                  {...form.register('businessType')}
                  placeholder="e.g., Private, Public, Partnership"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  {...form.register('registrationNumber')}
                  placeholder="Enter company registration number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID / GST Number</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                  placeholder="Enter tax identification number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input
                  id="employeeCount"
                  {...form.register('employeeCount')}
                  placeholder="e.g., 1-10, 11-50, 51-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue</Label>
                <Input
                  id="annualRevenue"
                  {...form.register('annualRevenue')}
                  placeholder="e.g., <1M, 1-10M, >10M"
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Updating...' : 'Update Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}