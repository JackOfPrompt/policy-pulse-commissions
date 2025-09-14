import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PolicyUploadForm } from "@/components/policy/PolicyUploadForm";
import { PolicyReviewForm } from "@/components/policy/PolicyReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EmployeePolicyUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const mockUser = {
    name: "Employee User",
    email: "employee@insurance.com",
    role: "employee" as const,
  };

  const handleUploadComplete = (data: any, meta: any) => {
    console.log('Upload complete - data:', data);
    console.log('Upload complete - meta:', meta);
    setExtractedData(data);
    setMetadata(meta);
    setCurrentStep('review');
  };

  const handleSaveDraft = (policyData: any) => {
    const draft = {
      ...policyData,
      metadata,
      status: 'draft',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`policy_draft_${Date.now()}`, JSON.stringify(draft));
    
    toast({
      title: "Draft Saved",
      description: "Policy draft has been saved locally.",
    });
    
    navigate('/employee/policies');
  };

  const handleFinalize = (policyData: any) => {
    const finalized = {
      ...policyData,
      metadata,
      status: 'finalized',
      finalizedAt: new Date().toISOString(),
    };
    localStorage.setItem(`policy_final_${Date.now()}`, JSON.stringify(finalized));
    
    toast({
      title: "Policy Finalized",
      description: "Policy has been finalized and saved.",
    });
    
    navigate('/employee/policies');
  };

  const handleCancel = () => {
    setCurrentStep('upload');
    setExtractedData(null);
    setMetadata(null);
  };

  return (
    <DashboardLayout role="employee" user={mockUser}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Policy Upload & Extraction</h1>
            <p className="text-muted-foreground">
              Upload policy documents and extract data using AI
            </p>
          </div>
        </div>

        {currentStep === 'upload' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Employee Upload Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Upload policy documents directly as an employee</li>
                  <li>Or upload on behalf of an agent by selecting the agent</li>
                  <li>AI will extract policy data for review and verification</li>
                  <li>Save drafts or finalize policies as needed</li>
                </ul>
              </CardContent>
            </Card>

            <PolicyUploadForm
              userRole="employee"
              userEmail="employee@insurance.com"
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        {currentStep === 'review' && extractedData && (
          <div className="space-y-4">
            {metadata?.isDemo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TestTube className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Demo Mode</h3>
                    <p className="text-sm text-yellow-700">
                      API quota exceeded. This is sample data for testing purposes.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <PolicyReviewForm
              extractedData={extractedData}
              metadata={metadata}
              onSaveDraft={handleSaveDraft}
              onFinalize={handleFinalize}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}