import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PolicyUploadForm } from "@/components/policy/PolicyUploadForm";
import { PolicyReviewForm } from "@/components/policy/PolicyReviewForm";
import { PolicyTestExtractor } from "@/components/policy/PolicyTestExtractor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PolicyUpload() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<'upload' | 'review'>('upload');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);

  const mockUser = {
    name: "Admin User",
    email: "admin@insurance.com",
    role: "admin" as const,
  };

  const handleUploadComplete = (data: any, meta: any, productType: string) => {
    setExtractedData(data);
    setMetadata({ ...meta, productType });
    setCurrentStep('review');
  };

  const handleSaveDraft = (policyData: any) => {
    // Save to localStorage as draft
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
    
    navigate('/admin/policies');
  };

  const handleFinalize = (policyData: any) => {
    // Save to localStorage as finalized
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
    
    navigate('/admin/policies');
  };

  const handleCancel = () => {
    setCurrentStep('upload');
    setExtractedData(null);
    setMetadata(null);
  };

  const handleTestExtraction = () => {
    // Create a test file input and trigger the sample PDF test
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.style.display = 'none';
    
    // Simulate selecting the sample PDF
    toast({
      title: "Test Feature",
      description: "Please upload a PDF file to test the extraction. A sample policy PDF should be provided for testing.",
    });
  };

  return (
    <DashboardLayout role="admin" user={mockUser}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Policy Upload & Extraction</h1>
            <p className="text-muted-foreground">
              Upload policy documents and extract data using AI
            </p>
          </div>
          {currentStep === 'upload' && (
            <Button 
              onClick={handleTestExtraction}
              variant="outline"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Test Extraction
            </Button>
          )}
        </div>

        {currentStep === 'upload' && (
          <div className="space-y-6">
            <PolicyTestExtractor onTestComplete={handleUploadComplete} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Upload PDF policy documents for automatic data extraction</li>
                  <li>AI will parse the document and extract relevant policy information</li>
                  <li>Review and edit the extracted data before saving</li>
                  <li>Save as draft or finalize the policy record</li>
                </ul>
              </CardContent>
            </Card>

            <PolicyUploadForm
              userRole="admin"
              userEmail="admin@insurance.com"
              onUploadComplete={handleUploadComplete}
            />
          </div>
        )}

        {currentStep === 'review' && extractedData && (
          <PolicyReviewForm
            extractedData={extractedData}
            metadata={metadata}
            onSaveDraft={handleSaveDraft}
            onFinalize={handleFinalize}
            onCancel={handleCancel}
          />
        )}
      </div>
    </DashboardLayout>
  );
}