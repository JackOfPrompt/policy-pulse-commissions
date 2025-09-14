import { useState } from "react";
import { Briefcase, Plus, Search, Edit, Eye, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { supabase } from "@/integrations/supabase/client";

// Mock data for now - replace with actual hook
const mockMisps = [
  {
    id: '1',
    channel_partner_name: 'Sample MISP',
    type_of_dealer: 'Individual',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

export default function MispManagement() {
  const { toast } = useToast();
  const [misps] = useState(mockMisps);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  const filteredMisps = misps.filter(misp =>
    misp.channel_partner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    misp.type_of_dealer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const templateHeaders = [
    'channel_partner_name',
    'type_of_dealer',
    'dealer_pan_number',
    'dealer_gst_number',
    'dealer_principal_firstname',
    'dealer_principal_lastname',
    'dealer_principal_phone_number',
    'dealer_principal_email_id',
    'sales_person_firstname',
    'sales_person_lastname',
    'sales_person_mobile_number',
    'sales_person_email_id',
    'address',
    'city',
    'state',
    'district',
    'pincode',
    'landmark',
    'account_holder_name',
    'bank_name',
    'account_type',
    'account_number',
    'ifsc_code'
  ];

  const requiredFields = ['channel_partner_name', 'type_of_dealer'];

  const validateMispRow = (row: any) => {
    const errors: string[] = [];
    
    if (row.dealer_pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.dealer_pan_number)) {
      errors.push('Invalid PAN format');
    }
    
    if (row.dealer_gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(row.dealer_gst_number)) {
      errors.push('Invalid GST format');
    }

    if (row.dealer_principal_email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.dealer_principal_email_id)) {
      errors.push('Invalid principal email format');
    }

    if (row.sales_person_email_id && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.sales_person_email_id)) {
      errors.push('Invalid sales person email format');
    }

    if (row.pincode && !/^\d{6}$/.test(row.pincode)) {
      errors.push('Pincode must be 6 digits');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const handleBulkUpload = async (data: any[], isUpdate: boolean) => {
    try {
      const processedData = data.map(row => ({
        channel_partner_name: row.channel_partner_name,
        type_of_dealer: row.type_of_dealer,
        dealer_pan_number: row.dealer_pan_number || null,
        dealer_gst_number: row.dealer_gst_number || null,
        dealer_principal_firstname: row.dealer_principal_firstname || null,
        dealer_principal_lastname: row.dealer_principal_lastname || null,
        dealer_principal_phone_number: row.dealer_principal_phone_number || null,
        dealer_principal_email_id: row.dealer_principal_email_id || null,
        sales_person_firstname: row.sales_person_firstname || null,
        sales_person_lastname: row.sales_person_lastname || null,
        sales_person_mobile_number: row.sales_person_mobile_number || null,
        sales_person_email_id: row.sales_person_email_id || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        district: row.district || null,
        pincode: row.pincode || null,
        landmark: row.landmark || null,
        account_holder_name: row.account_holder_name || null,
        bank_name: row.bank_name || null,
        account_type: row.account_type || null,
        account_number: row.account_number || null,
        ifsc_code: row.ifsc_code || null,
        org_id: 'default-org-id', // Replace with actual org_id
        created_by: 'current-user-id' // Replace with actual user_id
      }));

      let results;
      if (isUpdate) {
        const { data: result, error } = await supabase
          .from('misps')
          .upsert(processedData, {
            onConflict: 'channel_partner_name,org_id',
            ignoreDuplicates: false
          })
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Updated successfully' }));
      } else {
        const { data: result, error } = await supabase
          .from('misps')
          .insert(processedData)
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Inserted successfully' }));
      }

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">MISP Management</h1>
            <p className="text-muted-foreground">
              Manage Motor Insurance Service Providers and channel partners
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add MISP
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MISPs</CardTitle>
              <Briefcase className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{misps.length}</div>
              <p className="text-xs text-muted-foreground">Active partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Individual Dealers</CardTitle>
              <Briefcase className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {misps.filter(m => m.type_of_dealer === 'Individual').length}
              </div>
              <p className="text-xs text-muted-foreground">Individual partners</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corporate Dealers</CardTitle>
              <Briefcase className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {misps.filter(m => m.type_of_dealer === 'Corporate').length}
              </div>
              <p className="text-xs text-muted-foreground">Corporate partners</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>MISP Directory</CardTitle>
            <CardDescription>
              View and manage Motor Insurance Service Providers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search MISPs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMisps.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No MISPs found. Use bulk upload to add channel partners.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMisps.map((misp) => (
                    <TableRow key={misp.id}>
                      <TableCell>
                        <div className="font-medium">{misp.channel_partner_name}</div>
                      </TableCell>
                      <TableCell>{misp.type_of_dealer}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <StatusChip variant={misp.status === 'active' ? 'success' : 'secondary'}>
                          {misp.status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>{new Date(misp.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <BulkUploadModal
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          title="MISPs"
          templateHeaders={templateHeaders}
          requiredFields={requiredFields}
          onUpload={handleBulkUpload}
          validateRow={validateMispRow}
        />
      </div>
    </AdminLayout>
  );
}