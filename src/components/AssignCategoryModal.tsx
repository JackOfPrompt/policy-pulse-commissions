import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Plus } from 'lucide-react';

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlemJpeHVudWxhY2RlZG5scnRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNDA5NjcsImV4cCI6MjA3MDcxNjk2N30.1e9sTjj8hPhEmnsJsMfXCGgfmLfbevbT6Z0wAPCOuJg";

interface Addon {
  addon_id: string;
  addon_name: string;
  addon_code: string;
}

interface Category {
  category_id: string;
  category_name: string;
  category_code: string;
}

interface Subcategory {
  subcategory_id: string;
  subcategory_name: string;
  subcategory_code: string;
  category_id: string;
}

interface Mapping {
  map_id: string;
  addon_id: string;
  category_id?: string;
  subcategory_id?: string;
  is_active: boolean;
  master_product_category?: Category;
  product_subcategory?: Subcategory;
}

interface AssignCategoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addon?: Addon | null;
  onSuccess: () => void;
}

const AssignCategoryModal: React.FC<AssignCategoryModalProps> = ({
  open,
  onOpenChange,
  addon,
  onSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const { toast } = useToast();

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch mappings when addon changes
  useEffect(() => {
    if (addon && open) {
      fetchMappings();
    }
  }, [addon, open]);

  // Fetch subcategories when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchSubcategories(selectedCategoryId);
    } else {
      setSubcategories([]);
      setSelectedSubcategoryId('');
    }
  }, [selectedCategoryId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('master_product_category')
        .select('*')
        .eq('is_active', true)
        .order('category_name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories.",
        variant: "destructive"
      });
    }
  };

  const fetchSubcategories = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_subcategory')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('subcategory_name');

      if (error) throw error;
      setSubcategories(data || []);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subcategories.",
        variant: "destructive"
      });
    }
  };

  const fetchMappings = async () => {
    if (!addon) return;

    try {
      setLoadingMappings(true);
      
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addon-mappings/addons/${addon.addon_id}/mappings`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch mappings');
      const result = await response.json();
      if (result.success) {
        setMappings(result.data || []);
      } else {
        throw new Error(result.message || 'Failed to fetch mappings');
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch category mappings.",
        variant: "destructive"
      });
    } finally {
      setLoadingMappings(false);
    }
  };

  const handleCreateMapping = async () => {
    if (!addon || (!selectedCategoryId && !selectedSubcategoryId)) {
      toast({
        title: "Error",
        description: "Please select at least a category or subcategory.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addon-mappings/addons/${addon.addon_id}/mappings`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category_id: selectedCategoryId || null,
          subcategory_id: selectedSubcategoryId || null,
          is_active: true
        })
      });

      if (!response.ok) throw new Error('Failed to create mapping');
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Category mapping created successfully."
        });
        setSelectedCategoryId('');
        setSelectedSubcategoryId('');
        fetchMappings();
      } else {
        throw new Error(result.message || 'Failed to create mapping');
      }
    } catch (error) {
      console.error('Error creating mapping:', error);
      toast({
        title: "Error",
        description: "Failed to create category mapping.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async (mapId: string) => {
    if (!addon) return;

    try {
      const url = `https://sezbixunulacdednlrtl.supabase.co/functions/v1/addon-mappings/addons/${addon.addon_id}/mappings/${mapId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete mapping');
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Success",
          description: "Category mapping removed successfully."
        });
        fetchMappings();
      } else {
        throw new Error(result.message || 'Failed to delete mapping');
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast({
        title: "Error",
        description: "Failed to remove category mapping.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Assign Categories - {addon?.addon_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Category Mapping
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subcategory Selection */}
                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Select 
                    value={selectedSubcategoryId} 
                    onValueChange={setSelectedSubcategoryId}
                    disabled={!selectedCategoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Subcategory</SelectItem>
                      {subcategories.map((subcategory) => (
                        <SelectItem key={subcategory.subcategory_id} value={subcategory.subcategory_id}>
                          {subcategory.subcategory_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCreateMapping} 
                disabled={loading || (!selectedCategoryId && !selectedSubcategoryId)}
                className="w-full"
              >
                {loading ? 'Adding...' : 'Add Mapping'}
              </Button>
            </CardContent>
          </Card>

          {/* Current Mappings */}
          <Card>
            <CardHeader>
              <CardTitle>Current Category Mappings</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingMappings ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading mappings...</div>
                </div>
              ) : mappings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No category mappings found. Add a mapping above to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {mappings.map((mapping) => (
                    <div key={mapping.map_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          {mapping.master_product_category && (
                            <Badge variant="default" className="mr-2">
                              {mapping.master_product_category.category_name}
                            </Badge>
                          )}
                          {mapping.product_subcategory && (
                            <Badge variant="secondary">
                              {mapping.product_subcategory.subcategory_name}
                            </Badge>
                          )}
                          {!mapping.master_product_category && !mapping.product_subcategory && (
                            <Badge variant="outline">No Category/Subcategory</Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMapping(mapping.map_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignCategoryModal;