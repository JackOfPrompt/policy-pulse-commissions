import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, Agent, UploadOption } from "@/types/policy";
import productTypesData from "@/data/master/product_types.json";

// Import product-specific schemas
import lifeSchema from "@/data/schemas/life_policy_schema.json";
import healthSchema from "@/data/schemas/health_policy_schema.json";
import motorSchema from "@/data/schemas/motor_policy_schema.json";

interface PolicyUploadFormProps {
  userRole: UserRole;
  userEmail: string;
  onUploadComplete: (extractedData: any, metadata: any, productType: string) => void;
}

// Get available product types from master data
const productTypes = Object.keys(productTypesData);

// Mock agents data - in real app, this would come from database
const mockAgents: Agent[] = [
  { id: "AGT001", name: "John Smith", email: "john@insurance.com", code: "AGT001" },
  { id: "AGT002", name: "Sarah Johnson", email: "sarah@insurance.com", code: "AGT002" },
  { id: "AGT003", name: "Mike Wilson", email: "mike@insurance.com", code: "AGT003" },
];

export function PolicyUploadForm({ userRole, userEmail, onUploadComplete }: PolicyUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [productType, setProductType] = useState<string>('');
  const [uploadOption, setUploadOption] = useState<UploadOption>({ type: 'direct' });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Get schema based on product type
  const getSchemaForProductType = (type: string) => {
    switch (type) {
      case 'life':
        return lifeSchema;
      case 'health':
        return healthSchema;
      case 'motor':
        return motorSchema;
      default:
        return lifeSchema; // fallback
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.includes('pdf') && !selectedFile.type.includes('text')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF or text file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('policies')
      .upload(fileName, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    return fileName;
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a policy file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!productType) {
      toast({
        title: "Product Type Required",
        description: "Please select a product type for this policy.",
        variant: "destructive",
      });
      return;
    }

    if (userRole === 'employee' && uploadOption.type === 'agent' && !uploadOption.agent_id) {
      toast({
        title: "Agent Required",
        description: "Please select an agent for this upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Upload file to storage first
      const filePath = await uploadFileToStorage(file);

      // Get product-specific schema
      const selectedSchema = getSchemaForProductType(productType);

      // Call edge function for AI extraction with file path and product type
      const { data, error } = await supabase.functions.invoke('extract-policy', {
        body: {
          filePath: filePath,
          schema: selectedSchema,
          productType: productType
        }
      });

      // Check if we have data even if there's an error (edge function might return data with non-2xx code)
      if (error && !data) {
        throw new Error(error.message || 'Failed to extract policy data');
      }

      // Debug logging
      console.log('Edge function response:', data);
      console.log('Data success:', data?.success);
      console.log('Data extracted:', data?.extracted);
      console.log('Data error:', data?.error);

      // Check if extraction was successful
      if (!data?.success || !data?.extracted) {
        throw new Error(data?.error || 'No data returned from extraction');
      }

      // The edge function now returns structured data that matches the schema
      const structuredData = data.extracted;

      console.log('Extracted data from edge function:', data.extracted);
      console.log('Structured data for review:', structuredData);

      // Prepare metadata
      const metadata = {
        fileName: file.name,
        fileSize: file.size,
        uploadedBy: userEmail,
        role: userRole,
        agentId: uploadOption.type === 'agent' ? uploadOption.agent_id : undefined,
        uploadType: uploadOption.type,
        uploadedAt: new Date().toISOString(),
        productType: productType,
        schema: selectedSchema,
      };

      // Check if this is demo data due to API quota issues
      const isDemo = data.isDemo || false;
      const warnings = data.warnings || [];
      
      if (isDemo) {
        toast({
          title: "Demo Data Loaded",
          description: "API quota exceeded. Showing demo data for testing.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Upload Successful",
          description: "Policy data extracted successfully. Please review the details.",
        });
      }

      // Add warnings to metadata
      const enhancedMetadata = {
        ...metadata,
        warnings,
        isDemo
      };

      onUploadComplete(structuredData, enhancedMetadata, productType);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process the policy file.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRoleSpecificOptions = () => {
    if (userRole !== 'employee') return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Upload Type</Label>
          <Select 
            value={uploadOption.type} 
            onValueChange={(value: 'direct' | 'agent') => 
              setUploadOption({ type: value, agent_id: undefined })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              <SelectItem value="direct">Policy Uploaded Directly</SelectItem>
              <SelectItem value="agent">Via Agent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {uploadOption.type === 'agent' && (
          <div className="space-y-2">
            <Label>Select Agent</Label>
            <Select 
              value={uploadOption.agent_id || ''} 
              onValueChange={(agentId) => 
                setUploadOption(prev => ({ ...prev, agent_id: agentId }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {mockAgents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Policy Upload
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Role: <span className="font-medium capitalize">{userRole}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Type Selection */}
        <div className="space-y-2">
          <Label>Product Type *</Label>
          <Select 
            value={productType} 
            onValueChange={(value: string) => setProductType(value)}
            disabled={isProcessing}
          >
            <SelectTrigger className="border-2 border-primary/20">
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border z-50">
              {productTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!productType && (
            <p className="text-sm text-orange-600">
              Please select the product type to ensure accurate data extraction
            </p>
          )}
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="policy-file">Policy Document</Label>
          <div className="flex items-center gap-2">
            <Input
              id="policy-file"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="flex-1"
              disabled={isProcessing}
            />
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>
          {file && (
            <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
              <div className="font-medium">{file.name}</div>
              <div>Size: {(file.size / 1024).toFixed(1)} KB</div>
            </div>
          )}
        </div>

        {/* Role-specific options */}
        {renderRoleSpecificOptions()}

        {/* Info */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <FileText className="h-4 w-4 text-blue-600" />
          <div className="text-sm text-blue-800">
            AI will automatically extract policy data from your document for review.
          </div>
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={isProcessing || !file || !productType}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing Policy...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload & Extract Data
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          Supported formats: PDF, TXT • Max size: 10MB
        </div>
      </CardContent>
    </Card>
  );
}