import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ReportingManagerSelector } from "./ReportingManagerSelector";

interface MISP {
  id: string;
  channel_partner_name: string;
  percentage?: number;
  employee_id?: string;
  reporting_manager_id?: string;
  reporting_manager_name?: string;
  type_of_dealer?: string;
  dealer_pan_number?: string;
  dealer_gst_number?: string;
  dealer_principal_firstname?: string;
  dealer_principal_lastname?: string;
  dealer_principal_phone_number?: string;
  dealer_principal_email_id?: string;
  sales_person_firstname?: string;
  sales_person_lastname?: string;
  sales_person_mobile_number?: string;
  sales_person_email_id?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  account_holder_name?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_type?: string;
}

interface EditMispModalProps {
  misp: MISP | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditMispModal({ misp, open, onOpenChange, onUpdate }: EditMispModalProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    channel_partner_name: '',
    percentage: 50,
    employee_id: '',
    reporting_manager_id: '',
    type_of_dealer: '',
    dealer_pan_number: '',
    dealer_gst_number: '',
    dealer_principal_firstname: '',
    dealer_principal_lastname: '',
    dealer_principal_phone_number: '',
    dealer_principal_email_id: '',
    sales_person_firstname: '',
    sales_person_lastname: '',
    sales_person_mobile_number: '',
    sales_person_email_id: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'savings'
  });

  useEffect(() => {
    if (misp) {
      setFormData({
        channel_partner_name: misp.channel_partner_name || '',
        percentage: misp.percentage || 50,
        employee_id: misp.employee_id || '',
        reporting_manager_id: misp.reporting_manager_id || '',
        type_of_dealer: misp.type_of_dealer || '',
        dealer_pan_number: misp.dealer_pan_number || '',
        dealer_gst_number: misp.dealer_gst_number || '',
        dealer_principal_firstname: misp.dealer_principal_firstname || '',
        dealer_principal_lastname: misp.dealer_principal_lastname || '',
        dealer_principal_phone_number: misp.dealer_principal_phone_number || '',
        dealer_principal_email_id: misp.dealer_principal_email_id || '',
        sales_person_firstname: misp.sales_person_firstname || '',
        sales_person_lastname: misp.sales_person_lastname || '',
        sales_person_mobile_number: misp.sales_person_mobile_number || '',
        sales_person_email_id: misp.sales_person_email_id || '',
        address: misp.address || '',
        city: misp.city || '',
        district: misp.district || '',
        state: misp.state || '',
        pincode: misp.pincode || '',
        account_holder_name: misp.account_holder_name || '',
        bank_name: misp.bank_name || '',
        account_number: misp.account_number || '',
        ifsc_code: misp.ifsc_code || '',
        account_type: misp.account_type || 'savings'
      });
    }
  }, [misp]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!misp) return;

    setLoading(true);
    try {
      // Get reporting manager name if ID is provided
      let reporting_manager_name = null;
      if (formData.reporting_manager_id) {
        const { data: manager } = await supabase
          .from('employees')
          .select('name')
          .eq('id', formData.reporting_manager_id)
          .single();
        reporting_manager_name = manager?.name || null;
      }

      const { error } = await supabase
        .from('misps')
        .update({
          ...formData,
          reporting_manager_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', misp.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "MISP updated successfully",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating MISP:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update MISP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!misp) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit MISP</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="channel_partner_name">Channel Partner Name *</Label>
                <Input
                  id="channel_partner_name"
                  value={formData.channel_partner_name}
                  onChange={(e) => handleInputChange('channel_partner_name', e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="percentage">Commission Percentage</Label>
                <Input
                  id="percentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percentage}
                  onChange={(e) => handleInputChange('percentage', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="col-span-2">
                <ReportingManagerSelector
                  value={formData.reporting_manager_id}
                  onChange={(value) => handleInputChange('reporting_manager_id', value)}
                  label="Reporting Manager"
                  placeholder="Select reporting manager..."
                />
              </div>
              
              <div>
                <Label htmlFor="type_of_dealer">Type of Dealer</Label>
                <Input
                  id="type_of_dealer"
                  value={formData.type_of_dealer}
                  onChange={(e) => handleInputChange('type_of_dealer', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dealer_principal_firstname">Principal First Name</Label>
                <Input
                  id="dealer_principal_firstname"
                  value={formData.dealer_principal_firstname}
                  onChange={(e) => handleInputChange('dealer_principal_firstname', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dealer_principal_lastname">Principal Last Name</Label>
                <Input
                  id="dealer_principal_lastname"
                  value={formData.dealer_principal_lastname}
                  onChange={(e) => handleInputChange('dealer_principal_lastname', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dealer_principal_phone_number">Principal Phone</Label>
                <Input
                  id="dealer_principal_phone_number"
                  value={formData.dealer_principal_phone_number}
                  onChange={(e) => handleInputChange('dealer_principal_phone_number', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="dealer_principal_email_id">Principal Email</Label>
                <Input
                  id="dealer_principal_email_id"
                  type="email"
                  value={formData.dealer_principal_email_id}
                  onChange={(e) => handleInputChange('dealer_principal_email_id', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Bank Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="account_holder_name">Account Holder Name</Label>
                <Input
                  id="account_holder_name"
                  value={formData.account_holder_name}
                  onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => handleInputChange('bank_name', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={formData.account_number}
                  onChange={(e) => handleInputChange('account_number', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={formData.ifsc_code}
                  onChange={(e) => handleInputChange('ifsc_code', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update MISP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}