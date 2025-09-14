import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EntityFormModal } from '@/components/superadmin/shared/EntityFormModal';
import { useAgentPlans, useQualifications, Agent } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';

interface AgentProfileModalProps {
  agent?: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (agentData: Partial<Agent>) => Promise<{ success: boolean; error?: string }>;
}

export function AgentProfileModal({ agent, open, onOpenChange, onSave }: AgentProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const { plans } = useAgentPlans();
  const { qualifications } = useQualifications();
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<Partial<Agent>>({
    defaultValues: agent || {
      agent_type: 'MISP',
      status: 'active',
      kyc_status: 'pending',
      mobilepermissions: false,
      emailpermissions: false,
      delete_flag: false,
    }
  });

  useEffect(() => {
    if (agent) {
      reset(agent);
    } else {
      reset({
        agent_type: 'MISP',
        status: 'active',
        kyc_status: 'pending',
        mobilepermissions: false,
        emailpermissions: false,
        delete_flag: false,
      });
    }
  }, [agent, reset]);

  const onSubmit = async (data: Partial<Agent>) => {
    setLoading(true);
    try {
      const result = await onSave(data);
      if (result.success) {
        toast({
          title: "Success",
          description: `Agent ${agent ? 'updated' : 'created'} successfully`,
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${agent ? 'update' : 'create'} agent`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${agent ? 'update' : 'create'} agent`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <EntityFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={agent ? 'Edit Agent Profile' : 'Create New Agent'}
      description={agent ? 'Update agent information and documents' : 'Add a new agent to the system'}
      loading={loading}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      size="xl"
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="bank">Bank Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="agent_name">Agent Name *</Label>
              <Input
                id="agent_name"
                {...register('agent_name', { required: 'Agent name is required' })}
              />
              {errors.agent_name && (
                <p className="text-sm text-destructive">{errors.agent_name.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="agent_type">Agent Type *</Label>
              <Select 
                value={watch('agent_type')} 
                onValueChange={(value) => setValue('agent_type', value as 'MISP' | 'POSP')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MISP">MISP</SelectItem>
                  <SelectItem value="POSP">POSP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={watch('gender') || ''} 
                onValueChange={(value) => setValue('gender', value as 'male' | 'female' | 'other')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                {...register('dob')}
              />
            </div>
            
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Select 
                value={watch('qualification') || ''} 
                onValueChange={(value) => setValue('qualification', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  {qualifications.map((qual) => (
                    <SelectItem key={qual.id} value={qual.name}>
                      {qual.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="agent_plan_id">Agent Plan</Label>
              <Select 
                value={watch('agent_plan_id') || ''} 
                onValueChange={(value) => setValue('agent_plan_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} ({plan.commission_percentage}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={watch('status')} 
                onValueChange={(value) => setValue('status', value as 'active' | 'inactive' | 'suspended')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="kyc_status">KYC Status</Label>
              <Select 
                value={watch('kyc_status')} 
                onValueChange={(value) => setValue('kyc_status', value as 'approved' | 'pending' | 'rejected')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="reference">Reference</Label>
            <Textarea
              id="reference"
              {...register('reference')}
              placeholder="Enter reference details"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="contact" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+91-9876543210"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('mobilepermissions')}
                onCheckedChange={(checked) => setValue('mobilepermissions', checked)}
              />
              <Label>SMS Permissions</Label>
            </div>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="agent@example.com"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={watch('emailpermissions')}
                onCheckedChange={(checked) => setValue('emailpermissions', checked)}
              />
              <Label>Email Permissions</Label>
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Enter complete address"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="landmark">Landmark</Label>
              <Input
                id="landmark"
                {...register('landmark')}
              />
            </div>
            
            <div>
              <Label htmlFor="district">District</Label>
              <Input
                id="district"
                {...register('district')}
              />
            </div>
            
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('city')}
              />
            </div>
            
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('state')}
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('country')}
                defaultValue="India"
              />
            </div>
            
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                {...register('pincode')}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pan_card">PAN Card Number</Label>
              <Input
                id="pan_card"
                {...register('pan_card')}
                placeholder="ABCDE1234F"
              />
            </div>
            
            <div>
              <Label htmlFor="aadhar_card">Aadhaar Card Number</Label>
              <Input
                id="aadhar_card"
                {...register('aadhar_card')}
                placeholder="1234 5678 9012"
              />
            </div>
            
            <div>
              <Label htmlFor="pan_url">PAN Document URL</Label>
              <Input
                id="pan_url"
                {...register('pan_url')}
                placeholder="Upload PAN document"
              />
            </div>
            
            <div>
              <Label htmlFor="aadhar_url">Aadhaar Document URL</Label>
              <Input
                id="aadhar_url"
                {...register('aadhar_url')}
                placeholder="Upload Aadhaar document"
              />
            </div>
            
            <div>
              <Label htmlFor="degree_doc_url">Degree Document URL</Label>
              <Input
                id="degree_doc_url"
                {...register('degree_doc_url')}
                placeholder="Upload degree certificate"
              />
            </div>
            
            <div>
              <Label htmlFor="cheque_doc_url">Cancelled Cheque URL</Label>
              <Input
                id="cheque_doc_url"
                {...register('cheque_doc_url')}
                placeholder="Upload cancelled cheque"
              />
            </div>
            
            <div>
              <Label htmlFor="profile_doc_url">Profile Photo URL</Label>
              <Input
                id="profile_doc_url"
                {...register('profile_doc_url')}
                placeholder="Upload profile photo"
              />
            </div>
            
            <div>
              <Label htmlFor="other_doc_url">Other Documents URL</Label>
              <Input
                id="other_doc_url"
                {...register('other_doc_url')}
                placeholder="Upload other documents"
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="bank" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="account_name">Account Holder Name</Label>
              <Input
                id="account_name"
                {...register('account_name')}
              />
            </div>
            
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                {...register('bank_name')}
              />
            </div>
            
            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                {...register('account_number')}
              />
            </div>
            
            <div>
              <Label htmlFor="ifsc_code">IFSC Code</Label>
              <Input
                id="ifsc_code"
                {...register('ifsc_code')}
                placeholder="ABCD0123456"
              />
            </div>
            
            <div>
              <Label htmlFor="account_type">Account Type</Label>
              <Select 
                value={watch('account_type') || ''} 
                onValueChange={(value) => setValue('account_type', value as 'savings' | 'current')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="branch_name">Branch Name</Label>
              <Input
                id="branch_name"
                {...register('branch_name')}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="percentage">Commission Percentage</Label>
              <Input
                id="percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('percentage')}
                placeholder="2.50"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </EntityFormModal>
  );
}