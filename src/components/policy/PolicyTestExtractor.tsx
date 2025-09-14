import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TestTube, Download, FileText, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import healthSchema from "@/data/schemas/health_policy_schema.json";
interface PolicyTestExtractorProps {
  onTestComplete: (data: any, metadata: any, productType: string) => void;
}

export function PolicyTestExtractor({ onTestComplete }: PolicyTestExtractorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  const handleTestExtraction = async () => {
    try {
      setIsLoading(true);
      setTestResult(null);

      // Create a sample PDF content for testing
      const sampleText = `
        INSURANCE POLICY DOCUMENT
        Policy Number: POL123456789
        Customer Name: John Doe
        Customer Address: 123 Main Street, Mumbai, Maharashtra, 400001
        Phone: +91-9876543210
        Email: john.doe@email.com
        Date of Birth: 1985-05-15
        Gender: Male
        Marital Status: Married
        
        POLICY DETAILS:
        Gross Premium: Rs. 15000
        Net Premium: Rs. 12500
        GST: Rs. 2500
        Sum Insured: Rs. 500000
        Policy Start Date: 2024-01-01
        Policy End Date: 2025-01-01
        Plan Name: Comprehensive Health Plan
        Policy Tenure: 1 Year
        Present Policy Company: ABC Insurance Ltd.
        
        VEHICLE DETAILS:
        Vehicle Make: Honda
        Vehicle Model: City
        Vehicle Number: MH01AB1234
        Fuel Type: Petrol
        Vehicle CC: 1500
        IDV: Rs. 800000
        Manufacturing Date: 2020-03-15
        Registration Date: 2020-04-01
      `;

      // Call the edge function with sample text
      const { data, error } = await supabase.functions.invoke('extract-policy', {
        body: {
          fileText: sampleText,
          productType: 'health', // Use health for test to showcase array functionality
          schema: healthSchema,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success || !data?.extracted) {
        throw new Error(data?.error || 'No data extracted');
      }

      const testMetadata = {
        fileName: "sample-test-policy.txt",
        fileSize: sampleText.length,
        uploadedBy: "test-user@insurance.com",
        role: "admin",
        uploadType: "test",
        uploadedAt: new Date().toISOString(),
        productType: 'health',
        testMode: true,
        schema: healthSchema,
      };

      setTestResult({
        success: true,
        extracted: data.extracted,
        metadata: testMetadata,
      });

      toast({
        title: "Test Successful",
        description: "Sample policy data extracted successfully!",
      });

      // Call the completion handler to trigger review
      onTestComplete(data.extracted, testMetadata, 'health');

    } catch (error) {
      console.error('Test extraction failed:', error);
      setTestResult({
        success: false,
        error: error.message,
      });

      toast({
        title: "Test Failed",
        description: error.message || "Failed to extract test data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSamplePdf = () => {
    const link = document.createElement('a');
    link.href = '/sample-policy.pdf';
    link.download = 'sample-policy.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Test Policy Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Test the AI extraction pipeline with sample policy data to verify the complete workflow.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleTestExtraction}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {isLoading ? "Testing..." : "Run Test Extraction"}
          </Button>

          <Button
            onClick={downloadSamplePdf}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Sample PDF
          </Button>
        </div>

        {testResult && (
          <div className="mt-4">
            {testResult.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Test Completed Successfully</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    Fields Extracted: {String(
                      Object.values(testResult.extracted)
                        .reduce((count: number, section: any) => 
                          count + (section.fields?.length || 0), 0
                        )
                    )}
                  </Badge>
                  <Badge variant="outline">
                    Sections: {Object.keys(testResult.extracted).length}
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Status: Ready for Review
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">Test Failed</span>
                </div>
                <p className="text-sm text-red-600">{testResult.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}