import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PolicyUploadForm } from "@/components/policy/PolicyUploadForm";
import { PolicyReviewFormAdvanced } from "@/components/policy/PolicyReviewFormAdvanced";
import { UserRole } from "@/types/policy";
import policySchema from "@/data/policy_schema.json";
import lifeSchema from "@/data/schemas/life_policy_schema.json";
import healthSchema from "@/data/schemas/health_policy_schema.json";
import motorSchema from "@/data/schemas/motor_policy_schema.json";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PolicyExtraction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = (searchParams.get('role') || 'admin') as UserRole;
  const userEmail = `test@${role}.com`; // Mock user email based on role

  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const handleUploadComplete = (data: any, meta: any, productType: string) => {
    setExtractedData(data);
    setMetadata({ ...meta, productType });
    setCurrentStep('review');
  };

  const handleSave = async (policyRecord: any) => {
    const basePath = role === 'agent' ? '/agent' : role === 'employee' ? '/employee' : '/admin';
    try {
      const { data, error } = await supabase.functions.invoke('save-policy', {
        body: { formData: policyRecord, metadata }
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
    setCurrentStep('upload');
    setExtractedData(null);
    setMetadata(null);
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
        ) : (
          <PolicyReviewFormAdvanced
            schema={selectedSchema as any}
            extractedData={extractedData}
            metadata={metadata}
            userRole={role}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardLayout>
  );
}