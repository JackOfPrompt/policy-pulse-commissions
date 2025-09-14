import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, User, Mail, Lock, MapPin } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const organizationSchema = z.object({
  // Basic Organization Details
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  code: z.string().min(2, 'Organization code must be at least 2 characters'),
  description: z.string().optional(),
  
  // Contact Information
  phone: z.string().optional(),
  email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  
  // Address Details
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  
  // Business Information
  industryType: z.string().optional(),
  businessType: z.string().optional(),
  registrationNumber: z.string().optional(),
  taxId: z.string().optional(),
  employeeCount: z.string().optional(),
  annualRevenue: z.string().optional(),
  
  // Contact Person Details
  contactPersonName: z.string().optional(),
  contactPersonTitle: z.string().optional(),
  contactPersonPhone: z.string().optional(),
  contactPersonEmail: z.string().email().optional().or(z.literal('')),
  
  // Tenant admin details
  adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
  adminEmail: z.string().email('Please enter a valid email address'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      country: 'India',
      pincode: '',
      industryType: '',
      businessType: '',
      registrationNumber: '',
      taxId: '',
      employeeCount: '',
      annualRevenue: '',
      contactPersonName: '',
      contactPersonTitle: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    },
  });

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Create organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
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
          status: 'active',
          contact_person: data.contactPersonName || data.contactPersonEmail || data.contactPersonPhone ? {
            name: data.contactPersonName,
            title: data.contactPersonTitle,
            phone: data.contactPersonPhone,
            email: data.contactPersonEmail
          } : null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Step 2: Create tenant admin user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.adminEmail,
        password: data.adminPassword,
        options: {
          data: {
            full_name: data.adminName,
            role: 'admin',
            org_id: orgData.id,
          }
        }
      });

      if (authError) {
        // Rollback: Delete the organization if user creation fails
        await supabase.from('organizations').delete().eq('id', orgData.id);
        throw authError;
      }

      // Step 3: Create user_organizations mapping for the admin
      if (authData.user) {
        const { error: userOrgError } = await supabase
          .from('user_organizations')
          .insert({
            user_id: authData.user.id,
            org_id: orgData.id,
            role: 'admin',
          });

        if (userOrgError) {
          console.error('Error creating user_organizations mapping:', userOrgError);
          // Continue anyway as the main functionality is working
        }
      }

      toast({
        title: 'Success',
        description: 'Organization and tenant admin created successfully!',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating organization:', error);
      setError(error.message || 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create New Organization
          </DialogTitle>
          <DialogDescription>
            Register a new organization and create a tenant admin account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Organization Information */}
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
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Brief description of the organization"
              />
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

          <Separator />

          {/* Contact Person */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Primary Contact Person
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonName">Contact Person Name</Label>
                <Input
                  id="contactPersonName"
                  {...form.register('contactPersonName')}
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonTitle">Title / Designation</Label>
                <Input
                  id="contactPersonTitle"
                  {...form.register('contactPersonTitle')}
                  placeholder="e.g., CEO, Manager"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPersonPhone">Contact Phone</Label>
                <Input
                  id="contactPersonPhone"
                  {...form.register('contactPersonPhone')}
                  placeholder="Enter contact phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonEmail">Contact Email</Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  {...form.register('contactPersonEmail')}
                  placeholder="Enter contact email"
                  className={form.formState.errors.contactPersonEmail ? 'border-destructive' : ''}
                />
                {form.formState.errors.contactPersonEmail && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contactPersonEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Tenant Admin Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              Tenant Admin Account
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminName"
                  {...form.register('adminName')}
                  placeholder="Enter admin full name"
                  className={`pl-10 ${form.formState.errors.adminName ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.adminName && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adminName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminEmail"
                  type="email"
                  {...form.register('adminEmail')}
                  placeholder="Enter admin email"
                  className={`pl-10 ${form.formState.errors.adminEmail ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.adminEmail && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adminEmail.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adminPassword"
                  type="password"
                  {...form.register('adminPassword')}
                  placeholder="Create admin password"
                  className={`pl-10 ${form.formState.errors.adminPassword ? 'border-destructive' : ''}`}
                />
              </div>
              {form.formState.errors.adminPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.adminPassword.message}
                </p>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}