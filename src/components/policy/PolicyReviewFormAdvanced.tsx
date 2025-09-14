import React, { useState, useEffect } from 'react';
import { PolicySchema, PolicyData, PolicyField, UserRole } from '@/types/policy';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';

interface PolicyReviewFormAdvancedProps {
  schema: PolicySchema;
  extractedData?: PolicyData;
  metadata?: any;
  productType?: string;
  userRole?: UserRole;
  onSave: (data: any) => void;
  onSaveDraft?: (data: any) => void;
  onFinalize?: (data: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
  policyId?: string;
}

export function PolicyReviewFormAdvanced({
  schema,
  extractedData,
  onSave,
  onCancel,
  isEditing = false,
  policyId
}: PolicyReviewFormAdvancedProps) {
  const [formData, setFormData] = useState<PolicyData>({});
  const [validationErrors, setValidationErrors] = useState(new Set<string>());
  const [saveTraining, setSaveTraining] = useState(false);

  useEffect(() => {
    // Initialize form data based on schema
    const initData: PolicyData = {};
    Object.entries(schema).forEach(([sectionKey, section]) => {
      initData[sectionKey] = {};
      section.fields.forEach((field: PolicyField) => {
        const extractedValue = extractedData?.[sectionKey]?.[field.field];
        let defaultValue;
        
        if (field.type === 'array') {
          defaultValue = [];
        } else if (field.type === 'number') {
          defaultValue = null;
        } else {
          defaultValue = '';
        }
        
        initData[sectionKey][field.field] = extractedValue || defaultValue;
      });
    });

    setFormData(initData);
  }, [schema, extractedData]);

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const addArrayItem = (section: string, field: string, itemSchema?: PolicyField[]) => {
    const currentArray = formData[section]?.[field] || [];
    if (itemSchema) {
      // For object arrays, create empty object with schema fields
      const newItem: any = {};
      itemSchema.forEach(schemaField => {
        newItem[schemaField.field] = schemaField.type === 'number' ? null : '';
      });
      updateFormData(section, field, [...currentArray, newItem]);
    } else {
      // For simple arrays
      updateFormData(section, field, [...currentArray, '']);
    }
  };

  const removeArrayItem = (section: string, field: string, index: number) => {
    const currentArray = formData[section]?.[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    updateFormData(section, field, newArray);
  };

  const updateArrayItem = (section: string, field: string, index: number, itemField: string, value: any) => {
    const currentArray = formData[section]?.[field] || [];
    const newArray = [...currentArray];
    newArray[index] = { ...newArray[index], [itemField]: value };
    updateFormData(section, field, newArray);
  };

  const validateForm = () => {
    const errors = new Set<string>();
    
    Object.entries(schema).forEach(([sectionKey, section]) => {
      section.fields.forEach((field: PolicyField) => {
        if (field.required) {
          const value = formData[sectionKey]?.[field.field];
          if (!value || (Array.isArray(value) && value.length === 0)) {
            errors.add(`${sectionKey}.${field.field}`);
          }
        }
      });
    });
    
    setValidationErrors(errors);
    return errors.size === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    // Save training data if requested
    if (saveTraining && policyId) {
      try {
        const trainingEntry = {
          policy_id: policyId,
          original_extraction: extractedData || {},
          corrected_data: formData,
          timestamp: new Date().toISOString(),
          version: "1.0"
        };

        const fileName = `training_${policyId}_${Date.now()}.json`;
        
        await supabase.storage
          .from('policy_training')
          .upload(fileName, JSON.stringify(trainingEntry, null, 2), {
            contentType: 'application/json'
          });

        console.log('Training data saved successfully:', fileName);
      } catch (error) {
        console.error('Failed to save training data:', error);
      }
    }
    
    onSave(formData);
  };

  const renderField = (section: string, field: PolicyField) => {
    const fieldKey = `${section}.${field.field}`;
    const defaultValue = field.type === 'array' ? [] : '';
    const value = formData[section]?.[field.field] || defaultValue;
    const isRequired = field.required;
    const hasError = validationErrors.has(fieldKey);
    const wasExtracted = extractedData?.[section]?.[field.field] !== undefined;

    if (field.type === 'array' && field.arrayType === 'object') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
              {wasExtracted && <Badge variant="secondary" className="ml-2">Extracted</Badge>}
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(section, field.field, field.schema)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add {field.label.slice(0, -1)}
            </Button>
          </div>
          
          {Array.isArray(value) && value.map((item, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-800">
                  {field.label.slice(0, -1)} {index + 1}
                </h4>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeArrayItem(section, field.field, index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {field.schema?.map((subField: PolicyField) => (
                  <div key={subField.field}>
                    <Label className="text-sm">
                      {subField.label}
                      {subField.required && <span className="text-red-500">*</span>}
                    </Label>
                    {subField.type === 'select' ? (
                      <Select
                        value={item[subField.field] || ''}
                        onValueChange={(val) => updateArrayItem(section, field.field, index, subField.field, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${subField.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {subField.options?.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={subField.type === 'date' ? 'date' : subField.type === 'number' ? 'number' : 'text'}
                        value={item[subField.field] || ''}
                        onChange={(e) => {
                          const val = subField.type === 'number' ? 
                            (e.target.value ? Number(e.target.value) : null) : 
                            e.target.value;
                          updateArrayItem(section, field.field, index, subField.field, val);
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (field.type === 'array') {
      return (
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {field.label} {isRequired && <span className="text-red-500">*</span>}
            {wasExtracted && <Badge variant="secondary" className="ml-2">Extracted</Badge>}
          </Label>
          {Array.isArray(value) && value.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const newArray = [...value];
                  newArray[index] = e.target.value;
                  updateFormData(section, field.field, newArray);
                }}
                className={hasError ? 'border-red-500' : ''}
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removeArrayItem(section, field.field, index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addArrayItem(section, field.field)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </div>
      );
    }

    return (
      <div>
        <Label className="text-sm font-medium">
          {field.label} {isRequired && <span className="text-red-500">*</span>}
          {wasExtracted && <Badge variant="secondary" className="ml-2">Extracted</Badge>}
        </Label>
        {field.type === 'select' ? (
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => updateFormData(section, field.field, val)}
          >
            <SelectTrigger className={hasError ? 'border-red-500' : ''}>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'string' && field.label.toLowerCase().includes('address') ? (
          <Textarea
            value={value?.toString() || ''}
            onChange={(e) => updateFormData(section, field.field, e.target.value)}
            className={hasError ? 'border-red-500' : ''}
            rows={3}
          />
        ) : (
          <Input
            type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
            value={value?.toString() || ''}
            onChange={(e) => {
              const val = field.type === 'number' ? 
                (e.target.value ? Number(e.target.value) : null) : 
                e.target.value;
              updateFormData(section, field.field, val);
            }}
            className={hasError ? 'border-red-500' : ''}
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Policy' : 'Review Extracted Policy Data'}
        </h2>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="saveTraining"
            checked={saveTraining}
            onCheckedChange={(checked) => setSaveTraining(checked === true)}
          />
          <Label htmlFor="saveTraining" className="text-sm">
            Save corrections for training
          </Label>
        </div>
      </div>

      {validationErrors.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">
              Please fill in all required fields before saving.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(schema).map(([sectionKey, section]) => (
          <Card key={sectionKey}>
            <CardHeader>
              <CardTitle className="text-lg">{section.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.fields.map((field: PolicyField) => (
                <div key={field.field}>
                  {renderField(sectionKey, field)}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} className="flex items-center">
          <CheckCircle className="w-4 h-4 mr-2" />
          {isEditing ? 'Update Policy' : 'Save Policy'}
        </Button>
      </div>
    </div>
  );
}