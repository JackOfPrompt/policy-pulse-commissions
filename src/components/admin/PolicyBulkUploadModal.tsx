import { useState } from "react";
import { Upload, Download, FileText, Users, Car, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  downloadPolicyCsvTemplate, 
  downloadPolicyXlsxTemplate,
  getPolicyTemplateHeaders,
  getPolicyRequiredFields,
  type PolicyType 
} from "@/lib/utils/policyTemplateGenerator";
import {
  PolicyLifeSchema,
  PolicyHealthSchema,
  PolicyMotorSchema
} from "@/lib/schemas/policySchemas";

interface PolicyBulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

export function PolicyBulkUploadModal({
  open,
  onOpenChange,
  onUploadComplete
}: PolicyBulkUploadModalProps) {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<PolicyType>('life');
  const [showBulkModal, setShowBulkModal] = useState(false);

  const handleBulkUpload = async (data: any[], isUpdate: boolean) => {
    try {
      console.log(`Processing ${data.length} ${selectedType} policies for ${isUpdate ? 'update' : 'insert'}`);
      
      const results = await Promise.all(
        data.map(async (row, index) => {
          try {
            // Validate row based on policy type
            let validatedData;
            switch (selectedType) {
              case 'life':
                validatedData = PolicyLifeSchema.parse(row);
                break;
              case 'health':
                validatedData = PolicyHealthSchema.parse(row);
                break;
              case 'motor':
                validatedData = PolicyMotorSchema.parse(row);
                break;
              default:
                throw new Error(`Unsupported policy type: ${selectedType}`);
            }

            // Get current user's org_id
            const { data: userOrg } = await supabase
              .from('user_organizations')
              .select('org_id')
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
              .single();

            if (!userOrg) throw new Error('User organization not found');

            // Insert into policies table
            const { data: policyData, error: policyError } = await supabase
              .from('policies')
              .insert({
                ...validatedData,
                org_id: userOrg.org_id,
                created_by: (await supabase.auth.getUser()).data.user?.id,
              })
              .select()
              .single();

            if (policyError) throw policyError;

            // Insert into product-specific table
            if (selectedType === 'life' && policyData) {
              const lifeDetails = {
                policy_id: policyData.id,
                plan_type: validatedData.plan_type,
                uin: validatedData.uin,
                policy_term: validatedData.policy_term,
                premium_payment_term: validatedData.premium_payment_term,
                sum_assured: validatedData.sum_assured,
                maturity_date: validatedData.maturity_date,
                premium_frequency: validatedData.premium_frequency,
                benefits: validatedData.benefits ? JSON.parse(validatedData.benefits) : null,
                tax_benefits: validatedData.tax_benefits,
              };

              const { error: lifeError } = await supabase
                .from('life_policy_details')
                .insert(lifeDetails);

              if (lifeError) throw lifeError;
            } else if (selectedType === 'health' && policyData) {
              const healthDetails = {
                policy_id: policyData.id,
                policy_type: validatedData.policy_type,
                uin: validatedData.uin,
                cover_type: validatedData.cover_type,
                co_pay: validatedData.co_pay,
                waiting_period: validatedData.waiting_period,
                benefits: validatedData.benefits ? JSON.parse(validatedData.benefits) : null,
                exclusions: validatedData.exclusions ? JSON.parse(validatedData.exclusions) : null,
              };

              const { error: healthError } = await supabase
                .from('health_policy_details')
                .insert(healthDetails);

              if (healthError) throw healthError;

              // Handle insured members if provided
              if (validatedData.insured_members) {
                const members = JSON.parse(validatedData.insured_members);
                const memberInserts = members.map((member: any) => ({
                  policy_id: policyData.id,
                  name: member.name,
                  dob: member.dob,
                  gender: member.gender,
                  relationship: member.relationship,
                  sum_insured: validatedData.sum_insured || null,
                }));

                const { error: membersError } = await supabase
                  .from('insured_members')
                  .insert(memberInserts);

                if (membersError) throw membersError;
              }
            } else if (selectedType === 'motor' && policyData) {
              const motorDetails = {
                policy_id: policyData.id,
                vehicle_id: validatedData.vehicle_id,
                policy_type: validatedData.policy_type,
                policy_sub_type: validatedData.policy_sub_type,
                idv: validatedData.idv,
                ncb: validatedData.ncb,
                previous_policy_number: validatedData.previous_policy_number,
                previous_insurer_name: validatedData.previous_insurer_name,
                previous_claim: validatedData.previous_claim,
              };

              const { error: motorError } = await supabase
                .from('motor_policy_details')
                .insert(motorDetails);

              if (motorError) throw motorError;
            }

            return { success: true, message: 'Policy created successfully' };
          } catch (error) {
            console.error(`Error processing row ${index + 1}:`, error);
            return {
              success: false,
              message: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      onUploadComplete?.();
      return { success: true, results };
    } catch (error) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  };

  const validatePolicyRow = (row: any) => {
    const errors: string[] = [];
    
    // UUID validation
    const uuidFields = ['org_id', 'customer_id', 'product_type_id'];
    uuidFields.forEach(field => {
      if (row[field] && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(row[field])) {
        errors.push(`${field} must be a valid UUID`);
      }
    });

    // Type-specific validation
    if (selectedType === 'life') {
      if (row.sum_assured && isNaN(Number(row.sum_assured))) {
        errors.push('sum_assured must be a number');
      }
    } else if (selectedType === 'health') {
      if (row.sum_insured && isNaN(Number(row.sum_insured))) {
        errors.push('sum_insured must be a number');
      }
      if (row.insured_members) {
        try {
          JSON.parse(row.insured_members);
        } catch {
          errors.push('insured_members must be valid JSON');
        }
      }
    } else if (selectedType === 'motor') {
      if (row.idv && isNaN(Number(row.idv))) {
        errors.push('idv must be a number');
      }
      if (row.cc && isNaN(Number(row.cc))) {
        errors.push('cc must be a number');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const policyTypes = [
    {
      id: 'life' as PolicyType,
      name: 'Life Insurance',
      description: 'Term life, whole life, and endowment policies',
      icon: Heart,
      color: 'text-red-600'
    },
    {
      id: 'health' as PolicyType,
      name: 'Health Insurance',
      description: 'Individual and family health coverage',
      icon: Users,
      color: 'text-green-600'
    },
    {
      id: 'motor' as PolicyType,
      name: 'Motor Insurance',
      description: 'Car, bike, and commercial vehicle insurance',
      icon: Car,
      color: 'text-blue-600'
    }
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Bulk Policy Upload</DialogTitle>
            <DialogDescription>
              Select policy type and upload CSV/Excel files to import multiple policies
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {policyTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      selectedType === type.id 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardHeader className="text-center">
                      <Icon className={`h-8 w-8 mx-auto ${type.color}`} />
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {type.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                Download {policyTypes.find(t => t.id === selectedType)?.name} Template
              </h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => downloadPolicyCsvTemplate(selectedType)}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV Template</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => downloadPolicyXlsxTemplate(selectedType)}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Excel Template</span>
                </Button>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowBulkModal(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Policies
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BulkUploadModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        title={`${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Policies`}
        templateHeaders={getPolicyTemplateHeaders(selectedType)}
        requiredFields={getPolicyRequiredFields(selectedType)}
        onUpload={handleBulkUpload}
        validateRow={validatePolicyRow}
      />
    </>
  );
}