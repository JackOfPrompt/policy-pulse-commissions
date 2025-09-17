import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PolicyUploadForm } from "@/components/policy/PolicyUploadForm";
import { PolicyReviewFormAdvanced } from "@/components/policy/PolicyReviewFormAdvanced";
import { BusinessSourceAssignment } from "@/components/policy/BusinessSourceAssignment";
import { PolicyDocumentUpload } from "@/components/policy/PolicyDocumentUpload";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/types/policy";
import policySchema from "@/data/policy_schema.json";
import lifeSchema from "@/data/schemas/life_policy_schema.json";
import healthSchema from "@/data/schemas/health_policy_schema.json";
import motorSchema from "@/data/schemas/motor_policy_schema.json";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function PolicyExtraction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = (searchParams.get('role') || 'admin') as UserRole;
  const userEmail = `test@${role}.com`; // Mock user email based on role
  const { profile } = useAuth();

  const [currentStep, setCurrentStep] = useState<'upload' | 'document' | 'review' | 'assign'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [documentPath, setDocumentPath] = useState<string | null>(null);
  const [businessSource, setBusinessSource] = useState<{
    sourceType: 'internal' | 'external' | null;
    sourceId: string | null;
    brokerCompany: string;
  }>({
    sourceType: null,
    sourceId: null,
    brokerCompany: ''
  });

  const handleUploadComplete = (data: any, meta: any, productType: string) => {
    console.log('Upload complete - data:', data);
    console.log('Upload complete - meta:', meta);
    console.log('Upload complete - productType:', productType);
    
    // Ensure PRODUCT_TYPE is set in the extracted data
    if (data && data.policy && !data.policy.PRODUCT_TYPE && productType) {
      data.policy.PRODUCT_TYPE = productType;
    }
    
    setExtractedData(data);
    setMetadata({ ...meta, productType });
    setCurrentStep('document');
  };

  const handleDocumentUpload = (fileName: string, filePath: string) => {
    setDocumentPath(filePath);
    setCurrentStep('review');
  };

  const handleReviewComplete = () => {
    setCurrentStep('assign');
  };

  const handleSave = async (policyRecord: any) => {
    const basePath = role === 'agent' ? '/agent' : role === 'employee' ? '/employee' : '/admin';
    try {
      if (!profile?.org_id) {
        toast({ title: 'Missing organization', description: 'Your profile has no organization assigned', variant: 'destructive' });
        return;
      }

      // Add business source assignment and organization context to policy record
      const policyWithSource = {
        ...policyRecord,
        // Add organization context for proper data isolation
        org_id: profile.org_id
      };

      const { data, error } = await supabase.functions.invoke('save-policy', {
        body: { 
          formData: policyWithSource, 
          metadata: {
            ...metadata,
            documentPath: documentPath // Include document path for storage reference
          }
        }
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to save policy');
      }
      toast({ title: 'Policy Saved', description: 'Policy record has been stored successfully.' });
      navigate(`${basePath}/policies`);
    } catch (e: any) {
      console.error('Save policy error:', e);
      toast({ title: 'Save failed', description: e.message || 'Unable to save policy', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    if (currentStep === 'assign') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setCurrentStep('document');
    } else if (currentStep === 'document') {
      setCurrentStep('upload');
    } else {
      setCurrentStep('upload');
      setExtractedData(null);
      setMetadata(null);
      setDocumentPath(null);
      setBusinessSource({
        sourceType: null,
        sourceId: null,
        brokerCompany: ''
      });
    }
  };

  const mockUser = {
    name: `Test ${role}`,
    email: userEmail,
    role: role,
  };

  const selectedSchema =
    (metadata?.schema as any) ||
    (metadata?.productType === 'life'
      ? (lifeSchema as any)
      : metadata?.productType === 'health'
      ? (healthSchema as any)
      : metadata?.productType === 'motor'
      ? (motorSchema as any)
      : (policySchema as any));
  return (
    <DashboardLayout role={role} user={mockUser}>
      <div className="space-y-6">
        {currentStep === 'upload' ? (
          <PolicyUploadForm
            userRole={role}
            userEmail={userEmail}
            onUploadComplete={handleUploadComplete}
          />
        ) : currentStep === 'document' ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Upload Policy Document</h2>
              <p className="text-muted-foreground">
                Upload the original policy document for record keeping
              </p>
            </div>
            <PolicyDocumentUpload
              onUploadComplete={handleDocumentUpload}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleCancel}>
                Back to Data Extraction  
              </Button>
              <Button onClick={() => setCurrentStep('review')}>
                Skip Document Upload
              </Button>
            </div>
          </div>
        ) : currentStep === 'review' ? (
          <PolicyReviewFormAdvanced
            schema={selectedSchema as any}
            extractedData={extractedData}
            metadata={metadata}
            userRole={role}
            onSave={handleReviewComplete}
            onCancel={handleCancel}
          />
        ) : (
          <BusinessSourceAssignment
            businessSource={businessSource}
            onBusinessSourceChange={setBusinessSource}
            onSave={handleSave}
            onCancel={handleCancel}
            extractedData={extractedData}
          />
        )}
      </div>
    </DashboardLayout>
  );
}