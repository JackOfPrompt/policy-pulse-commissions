import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LineOfBusinessFormProps {
  lob?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const standardLOBOptions = [
  'Health', 'Motor', 'Life', 'Travel', 'Loan', 'Pet', 'Commercial'
];

export const LineOfBusinessForm = ({ lob, onSuccess, onCancel }: LineOfBusinessFormProps) => {
  const [formData, setFormData] = useState({
    lob_name: lob?.lob_name || '',
    description: lob?.description || '',
    lob_code: lob?.lob_code || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLOBs, setExistingLOBs] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'dropdown' | 'custom'>('dropdown');

  useEffect(() => {
    fetchExistingLOBs();
  }, []);

  const fetchExistingLOBs = async () => {
    try {
      const { data, error } = await supabase
        .from('lines_of_business')
        .select('lob_name');
      
      if (error) throw error;
      setExistingLOBs(data?.map(item => item.lob_name) || []);
    } catch (error) {
      console.error('Error fetching existing LOBs:', error);
    }
  };

  const availableStandardOptions = standardLOBOptions.filter(option => !existingLOBs.includes(option));

const generateCode = (name: string) => {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check for duplicate names
      if (!lob && existingLOBs.includes(formData.lob_name)) {
        toast.error("A line of business with this name already exists");
        setIsSubmitting(false);
        return;
      }

      // Auto-generate code if not provided
      const finalData = {
        ...formData,
        lob_code: formData.lob_code || generateCode(formData.lob_name)
      };
      if (lob) {
        const { error } = await supabase
          .from('lines_of_business')
          .update(finalData)
          .eq('lob_id', lob.lob_id);

        if (error) throw error;
        toast.success("Line of business updated successfully");
      } else {
        const { error } = await supabase
          .from('lines_of_business')
          .insert([finalData]);

        if (error) throw error;
        toast.success("Line of business created successfully");
      }
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${lob ? 'update' : 'create'} line of business`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate code when name changes
    if (field === 'lob_name' && !formData.lob_code) {
      setFormData(prev => ({ ...prev, lob_code: generateCode(value) }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{lob ? 'Edit Line of Business' : 'Add Line of Business'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            {lob ? (
              <Input
                id="name"
                value={formData.lob_name}
                disabled
                className="bg-muted"
              />
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={inputMode === 'dropdown' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode('dropdown')}
                  >
                    Standard LOBs
                  </Button>
                  <Button
                    type="button"
                    variant={inputMode === 'custom' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputMode('custom')}
                  >
                    Custom LOB
                  </Button>
                </div>
                
                {inputMode === 'dropdown' ? (
                  availableStandardOptions.length > 0 ? (
                    <Select value={formData.lob_name} onValueChange={(value) => handleInputChange('lob_name', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select standard line of business" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStandardOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                      All standard lines of business have been added. Use "Custom LOB" to add new ones.
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="name"
                      value={formData.lob_name}
                      onChange={(e) => handleInputChange('lob_name', e.target.value)}
                      placeholder="Enter custom line of business name (e.g., Fire Insurance, Property Insurance)"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Examples: Fire Insurance, Property Insurance, Cyber Insurance, Marine Insurance, etc.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={formData.lob_code}
              onChange={(e) => handleInputChange('lob_code', e.target.value)}
              placeholder="Auto-generated from name"
              disabled={lob ? true : false}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {lob ? "Code cannot be changed after creation" : "Will be auto-generated if left empty"}
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || !formData.lob_name.trim()}
            >
              {isSubmitting ? (lob ? "Updating..." : "Creating...") : (lob ? "Update Line of Business" : "Create Line of Business")}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};