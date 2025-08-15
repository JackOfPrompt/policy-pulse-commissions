import React, { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BulkImportDialog } from "@/components/BulkImportDialog";

interface Category {
  category_id: string;
  category_code: string;
  category_name: string;
  category_desc?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Subcategory {
  subcategory_id: string;
  category_id: string;
  subcategory_code: string;
  subcategory_name: string;
  subcategory_desc?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  master_product_category?: {
    category_id: string;
    category_code: string;
    category_name: string;
  };
}

export default function ManageProductCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subcategoryOpen, setSubcategoryOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editSubcategoryId, setEditSubcategoryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportType, setBulkImportType] = useState<'categories' | 'subcategories'>('categories');
  const { toast } = useToast();

  const [categoryForm, setCategoryForm] = useState({
    category_code: "",
    category_name: "",
    category_desc: "",
    is_active: true
  });

  const [subcategoryForm, setSubcategoryForm] = useState({
    category_id: "",
    subcategory_code: "",
    subcategory_name: "",
    subcategory_desc: "",
    is_active: true
  });

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('categories', {
        method: 'GET'
      });

      if (error) throw error;
      
      if (data?.success) {
        setCategories(data.data || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('subcategories', {
        method: 'GET'
      });

      if (error) throw error;
      
      if (data?.success) {
        setSubcategories(data.data || []);
      } else {
        throw new Error(data?.message || 'Failed to fetch subcategories');
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subcategories",
        variant: "destructive",
      });
    }
  };

  const handleCategorySave = async () => {
    setLoading(true);
    try {
      const method = editCategoryId ? 'PUT' : 'POST';
      const url = editCategoryId ? `categories/${editCategoryId}` : 'categories';
      
      const { data, error } = await supabase.functions.invoke(url, {
        method,
        body: categoryForm
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: data.message || `Category ${editCategoryId ? 'updated' : 'created'} successfully`,
        });
        fetchCategories();
        setCategoryOpen(false);
        resetCategoryForm();
      } else {
        throw new Error(data?.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategorySave = async () => {
    setLoading(true);
    try {
      const method = editSubcategoryId ? 'PUT' : 'POST';
      const url = editSubcategoryId ? `subcategories/${editSubcategoryId}` : 'subcategories';
      
      const { data, error } = await supabase.functions.invoke(url, {
        method,
        body: subcategoryForm
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: data.message || `Subcategory ${editSubcategoryId ? 'updated' : 'created'} successfully`,
        });
        fetchSubcategories();
        setSubcategoryOpen(false);
        resetSubcategoryForm();
      } else {
        throw new Error(data?.message || 'Failed to save subcategory');
      }
    } catch (error) {
      console.error('Error saving subcategory:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save subcategory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`categories/${id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: "Category deleted successfully",
        });
        fetchCategories();
      } else {
        throw new Error(data?.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubcategoryDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(`subcategories/${id}`, {
        method: 'DELETE'
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: "Subcategory deleted successfully",
        });
        fetchSubcategories();
      } else {
        throw new Error(data?.message || 'Failed to delete subcategory');
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete subcategory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryEdit = (category: Category) => {
    setCategoryForm({
      category_code: category.category_code,
      category_name: category.category_name,
      category_desc: category.category_desc || "",
      is_active: category.is_active
    });
    setEditCategoryId(category.category_id);
    setCategoryOpen(true);
  };

  const handleSubcategoryEdit = (subcategory: Subcategory) => {
    setSubcategoryForm({
      category_id: subcategory.category_id,
      subcategory_code: subcategory.subcategory_code,
      subcategory_name: subcategory.subcategory_name,
      subcategory_desc: subcategory.subcategory_desc || "",
      is_active: subcategory.is_active
    });
    setEditSubcategoryId(subcategory.subcategory_id);
    setSubcategoryOpen(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_code: "",
      category_name: "",
      category_desc: "",
      is_active: true
    });
    setEditCategoryId(null);
  };

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      category_id: "",
      subcategory_code: "",
      subcategory_name: "",
      subcategory_desc: "",
      is_active: true
    });
    setEditSubcategoryId(null);
  };

  const handleBulkImportComplete = () => {
    fetchCategories();
    fetchSubcategories();
  };

  const openBulkImport = (type: 'categories' | 'subcategories') => {
    setBulkImportType(type);
    setBulkImportOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Product Categories Management</h1>
        <p className="text-muted-foreground">Manage product categories and subcategories</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="subcategories">Subcategories</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Product Categories</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openBulkImport('categories')}>
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                  </Button>
                  <Button onClick={() => setCategoryOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Category
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.category_id}>
                      <TableCell className="font-mono">{category.category_code}</TableCell>
                      <TableCell className="font-medium">{category.category_name}</TableCell>
                      <TableCell>{category.category_desc || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleCategoryEdit(category)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleCategoryDelete(category.category_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcategories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Product Subcategories</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openBulkImport('subcategories')}>
                    <Upload className="mr-2 h-4 w-4" /> Bulk Import
                  </Button>
                  <Button onClick={() => setSubcategoryOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Subcategory
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcategories.map((subcategory) => (
                    <TableRow key={subcategory.subcategory_id}>
                      <TableCell className="font-medium">
                        {subcategory.master_product_category?.category_name || "-"}
                      </TableCell>
                      <TableCell className="font-mono">{subcategory.subcategory_code}</TableCell>
                      <TableCell className="font-medium">{subcategory.subcategory_name}</TableCell>
                      <TableCell>{subcategory.subcategory_desc || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={subcategory.is_active ? "default" : "secondary"}>
                          {subcategory.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSubcategoryEdit(subcategory)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleSubcategoryDelete(subcategory.subcategory_id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCategoryId ? "Edit" : "Add"} Product Category</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category_code">Category Code</Label>
              <Input
                id="category_code"
                placeholder="e.g., HEALTH_INDIV"
                value={categoryForm.category_code}
                onChange={(e) => setCategoryForm({ ...categoryForm, category_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category_name">Category Name</Label>
              <Input
                id="category_name"
                placeholder="e.g., Individual Health Plan"
                value={categoryForm.category_name}
                onChange={(e) => setCategoryForm({ ...categoryForm, category_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category_desc">Description</Label>
              <Textarea
                id="category_desc"
                placeholder="Category description..."
                value={categoryForm.category_desc}
                onChange={(e) => setCategoryForm({ ...categoryForm, category_desc: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={categoryForm.is_active}
                onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setCategoryOpen(false); resetCategoryForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCategorySave} disabled={loading}>
              {loading ? "Saving..." : editCategoryId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryOpen} onOpenChange={setSubcategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSubcategoryId ? "Edit" : "Add"} Product Subcategory</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="parent_category">Parent Category</Label>
              <select
                id="parent_category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={subcategoryForm.category_id}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, category_id: e.target.value })}
              >
                <option value="">Select a category...</option>
                {categories.filter(cat => cat.is_active).map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory_code">Subcategory Code</Label>
              <Input
                id="subcategory_code"
                placeholder="e.g., RETAIL_IND"
                value={subcategoryForm.subcategory_code}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, subcategory_code: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory_name">Subcategory Name</Label>
              <Input
                id="subcategory_name"
                placeholder="e.g., Retail Individual"
                value={subcategoryForm.subcategory_name}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, subcategory_name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subcategory_desc">Description</Label>
              <Textarea
                id="subcategory_desc"
                placeholder="Subcategory description..."
                value={subcategoryForm.subcategory_desc}
                onChange={(e) => setSubcategoryForm({ ...subcategoryForm, subcategory_desc: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active_sub"
                checked={subcategoryForm.is_active}
                onCheckedChange={(checked) => setSubcategoryForm({ ...subcategoryForm, is_active: checked })}
              />
              <Label htmlFor="is_active_sub">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setSubcategoryOpen(false); resetSubcategoryForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubcategorySave} disabled={loading}>
              {loading ? "Saving..." : editSubcategoryId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        type={bulkImportType}
        onImportComplete={handleBulkImportComplete}
      />
    </div>
  );
}