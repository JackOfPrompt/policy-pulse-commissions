import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, CheckCircle, X, FileText, User, Car, Building, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import policySchema from "@/data/policy_schema.json";
import productTypesData from "@/data/master/product_types.json";

interface PolicyReviewFormProps {
  extractedData: any;
  metadata: any;
  onSaveDraft: (data: any) => void;
  onFinalize: (data: any) => void;
  onCancel: () => void;
}

export function PolicyReviewForm({ 
  extractedData, 
  metadata, 
  onSaveDraft, 
  onFinalize, 
  onCancel 
}: PolicyReviewFormProps) {
  const [formData, setFormData] = useState(extractedData);
  const [activeTab, setActiveTab] = useState('policy'); // Start with policy tab to show product type first

  // Get available product types from master data
  const productTypes = Object.keys(productTypesData);
  const currentProductType = formData?.policy?.PRODUCT_TYPE?.toLowerCase() || '';

  const handleFieldChange = (sectionKey: string, fieldKey: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value
      }
    }));
  };

  const handleSaveDraft = () => {
    onSaveDraft(formData);
  };

  const handleFinalize = () => {
    onFinalize(formData);
  };

  const getTabIcon = (sectionKey: string) => {
    const icons = {
      customer: User,
      policy: FileText,
      vehicle: Car,
      insurer: Building,
    };
    const IconComponent = icons[sectionKey] || FileText;
    return <IconComponent className="h-4 w-4" />;
  };

  const renderField = (sectionKey: string, field: any) => {
    const value = formData[sectionKey]?.[field.field] || '';
    
    // Special handling for PRODUCT_TYPE field
    if (field.field === 'PRODUCT_TYPE') {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleFieldChange(sectionKey, field.field, val)}
        >
          <SelectTrigger className="border-2 border-primary/20">
            <SelectValue placeholder="Select Product Type" />
          </SelectTrigger>
          <SelectContent>
            {productTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    
    if (field.type === 'select' && field.options) {
      return (
        <Select
          value={value}
          onValueChange={(val) => handleFieldChange(sectionKey, field.field, val)}
        >
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option: string) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'date') {
      // Validate and format date value
      let dateValue = '';
      if (value) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            dateValue = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn(`Invalid date value for ${field.field}:`, value);
        }
      }
      
      return (
        <Input
          type="date"
          value={dateValue}
          onChange={(e) => handleFieldChange(sectionKey, field.field, e.target.value)}
        />
      );
    }

    if (field.type === 'number') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleFieldChange(sectionKey, field.field, parseFloat(e.target.value) || 0)}
        />
      );
    }

    if (field.field.toLowerCase().includes('address') || field.field.toLowerCase().includes('details')) {
      return (
        <Textarea
          value={value}
          onChange={(e) => handleFieldChange(sectionKey, field.field, e.target.value)}
          rows={3}
        />
      );
    }

    return (
      <Input
        type="text"
        value={value}
        onChange={(e) => handleFieldChange(sectionKey, field.field, e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Metadata Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Extraction Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Badge variant="outline">
              File: {metadata.fileName}
            </Badge>
            <Badge variant="outline">
              Size: {(metadata.fileSize / 1024).toFixed(1)} KB
            </Badge>
            <Badge variant="outline">
              Uploaded by: {metadata.uploadedBy}
            </Badge>
            <Badge variant="outline">
              Role: {metadata.role}
            </Badge>
            {metadata.agentId && (
              <Badge variant="outline">
                Agent: {metadata.agentId}
              </Badge>
            )}
          </div>
          
          {/* Product Type Alert */}
          {!currentProductType && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Product Type Missing:</strong> Please review and set the product type in the Policy Details tab for accurate processing.
              </AlertDescription>
            </Alert>
          )}
          
          {currentProductType && (
            <Alert className="border-green-200 bg-green-50">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Product Type Detected:</strong> {currentProductType.charAt(0).toUpperCase() + currentProductType.slice(1)}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      <Card>
        <CardHeader>
          <CardTitle>Review & Edit Policy Data</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review the extracted data and make any necessary corrections before saving.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              {Object.entries(policySchema).map(([sectionKey, section]) => (
                <TabsTrigger 
                  key={sectionKey} 
                  value={sectionKey}
                  className={`flex items-center gap-2 ${
                    sectionKey === 'policy' && !currentProductType ? 'ring-2 ring-orange-400' : ''
                  }`}
                >
                  {getTabIcon(sectionKey)}
                  {section.label}
                  {sectionKey === 'policy' && !currentProductType && (
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(policySchema).map(([sectionKey, section]) => (
              <TabsContent key={sectionKey} value={sectionKey} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field: any) => (
                    <div 
                      key={field.field} 
                      className={`space-y-2 ${
                        field.field === 'PRODUCT_TYPE' ? 'md:col-span-2 p-4 border-2 border-primary/20 rounded-lg bg-primary/5' : ''
                      }`}
                    >
                      <Label htmlFor={field.field}>
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.field === 'PRODUCT_TYPE' && (
                          <span className="text-xs text-primary ml-2 font-medium">(Critical Field)</span>
                        )}
                      </Label>
                      {renderField(sectionKey, field)}
                      {field.required && !formData[sectionKey]?.[field.field] && (
                        <p className="text-sm text-red-500">This field is required</p>
                      )}
                      {field.field === 'PRODUCT_TYPE' && !formData[sectionKey]?.[field.field] && (
                        <p className="text-sm text-orange-600 font-medium">
                          Please select the correct product type for accurate processing
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="flex justify-between items-center pt-6">
          <Button 
            onClick={onCancel} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveDraft}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button 
              onClick={handleFinalize}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Finalize Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}