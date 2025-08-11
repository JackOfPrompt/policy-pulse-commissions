import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, 
  Edit, 
  Trash2, 
  Plus, 
  Download, 
  Eye,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MasterDataField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
}

interface MasterDataTableProps {
  entityType: string;
  tableName: string;
  fields: MasterDataField[];
  primaryKey?: string;
}

export function MasterDataTable({ entityType, tableName, fields, primaryKey = 'id' }: MasterDataTableProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState<string>("");
  const { toast } = useToast();

  const statusField = fields.find((f) => f.name === "status");
  const defaultStatusOptions = ["Active", "Inactive"];
  const bulkStatusOptions = Array.from(
    new Set([...(statusField?.options || []), ...defaultStatusOptions])
  );

  const toggleSelect = (id: string, checked?: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const shouldSelect = checked ?? !next.has(id);
      if (shouldSelect) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(data.map((d) => d[primaryKey] as string)));
    else setSelectedIds(new Set());
  };
  const allSelected = selectedIds.size > 0 && selectedIds.size === data.length;

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: result, error } = await supabase
        .from(tableName as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setData(result || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

const handleEdit = (item: any) => {
  setIsCreateMode(false);
  setEditingItem(item);
  setFormData(item);
  setIsEditDialogOpen(true);
};

const handleAdd = () => {
  setIsCreateMode(true);
  setEditingItem(null);
  setFormData({ is_active: true });
  setIsEditDialogOpen(true);
};

const handleSave = async () => {
  try {
    if (isCreateMode) {
      const { error } = await supabase
        .from(tableName as any)
        .insert(formData);
      if (error) throw error;
      toast({ title: "Success", description: "Record created successfully" });
    } else {
      const { error } = await (supabase as any)
        .from(tableName as any)
        .update(formData)
        .eq(primaryKey, editingItem[primaryKey]);
      if (error) throw error;
      toast({ title: "Success", description: "Record updated successfully" });
    }

    setIsEditDialogOpen(false);
    setEditingItem(null);
    setIsCreateMode(false);
    fetchData();
  } catch (error) {
    console.error("Error saving record:", error);
    toast({
      title: "Error",
      description: "Failed to save record",
      variant: "destructive",
    });
  }
};

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await (supabase as any)
        .from(tableName as any)
        .update({ is_active: false })
        .eq(primaryKey, id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deactivated successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deactivating record:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate record",
        variant: "destructive",
      });
    }
  };

  const activateSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ is_active: true })
        .in(primaryKey, Array.from(selectedIds));
      if (error) throw error;
      toast({ title: "Updated", description: "Selected records activated" });
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk activate failed:", error);
      toast({ title: "Error", description: "Failed to activate records", variant: "destructive" });
    }
  };

  const deactivateSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ is_active: false })
        .in(primaryKey, Array.from(selectedIds));
      if (error) throw error;
      toast({ title: "Updated", description: "Selected records deactivated" });
      setSelectedIds(new Set());
      fetchData();
    } catch (error) {
      console.error("Bulk deactivate failed:", error);
      toast({ title: "Error", description: "Failed to deactivate records", variant: "destructive" });
    }
  };

  const updateStatusSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!newStatus) {
      toast({ title: "Select a status", description: "Please choose a status value" });
      return;
    }
    try {
      const updates: any = {};
      const lower = newStatus.toLowerCase();
      if (lower === "active" || lower === "inactive") {
        updates.is_active = lower === "active";
      }
      if (statusField) {
        updates.status = newStatus;
      }
      if (Object.keys(updates).length === 0) {
        toast({ title: "No updatable status", description: "This entity has no status or active flag to update", variant: "destructive" });
        return;
      }
      const { error } = await supabase
        .from(tableName as any)
        .update(updates)
        .in(primaryKey, Array.from(selectedIds));
      if (error) throw error;
      toast({ title: "Updated", description: `Applied status '${newStatus}' to selected records` });
      setSelectedIds(new Set());
      setNewStatus("");
      fetchData();
    } catch (error) {
      console.error("Bulk status update failed:", error);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };
  const downloadData = async () => {
    try {
      const { data: result, error } = await supabase
        .from(tableName as any)
        .select("*")
        .eq("is_active", true);

      if (error) throw error;

      const csv = convertToCSV(result || []);
      downloadCSV(csv, `${entityType}_export.csv`);
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Error",
        description: "Failed to download data",
        variant: "destructive",
      });
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return "";
    
    const headers = fields.map(field => field.label).join(",");
    const rows = data.map(row => 
      fields.map(field => `"${row[field.name] || ""}"`).join(",")
    ).join("\n");
    
    return `${headers}\n${rows}`;
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredData = data.filter(item =>
    fields.some(field =>
      String(item[field.name] || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const renderField = (field: MasterDataField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case "select":
        return (
          <Select value={value || ""} onValueChange={onChange}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.filter(option => option && option.trim() !== '').map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option}`}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    const newValues = checked
                      ? [...selectedValues, option]
                      : selectedValues.filter(v => v !== option);
                    onChange(newValues);
                  }}
                />
                <Label htmlFor={`${field.name}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <Checkbox
            checked={value || false}
            onCheckedChange={onChange}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date ? format(date, "yyyy-MM-dd") : null)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={field.label}
          />
        );

      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.label}
          />
        );
    }
  };

  const getStatusBadge = (item: any) => {
    if (item.is_active === false) {
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
    if (typeof item.status === 'string' && item.status.trim() !== '') {
      return <Badge variant="outline" title="Status">
        <Clock className="w-3 h-3 mr-1" />{item.status}
      </Badge>;
    }
    if (item.is_verified) {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Active</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {entityType.replace(/_/g, " ").toUpperCase()} Records
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
            <Button onClick={downloadData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Badge variant="outline">
              {filteredData.length} records
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-md border p-3 bg-muted/50">
            <div className="text-sm">{selectedIds.size} selected</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleSelectAll(false)}>Clear</Button>
              <Button size="sm" onClick={activateSelected}>Activate</Button>
              <Button size="sm" variant="destructive" onClick={deactivateSelected}>Deactivate</Button>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Set status (Active/Inactive or custom)" />
                </SelectTrigger>
                <SelectContent>
                  {bulkStatusOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={updateStatusSelected} disabled={!newStatus}>Update Status</Button>
            </div>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
                </TableHead>
                {fields.slice(0, 4).map((field) => (
                  <TableHead key={field.name}>{field.label}</TableHead>
                ))}
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item[primaryKey] as string}>
                  <TableCell className="w-10">
                    <Checkbox
                      checked={selectedIds.has(item[primaryKey] as string)}
                      onCheckedChange={(checked) => toggleSelect(item[primaryKey] as string, Boolean(checked))}
                      aria-label="Select row"
                    />
                  </TableCell>
                  {fields.slice(0, 4).map((field) => (
                    <TableCell key={field.name}>
                      {field.type === "checkbox" 
                        ? (item[field.name] ? "Yes" : "No")
                        : String(item[field.name] || "-")
                      }
                    </TableCell>
                  ))}
                  <TableCell>{getStatusBadge(item)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item[primaryKey] as string)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No records found
          </div>
        )}
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Make changes to the selected record
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name}>
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </Label>
                {renderField(field, formData[field.name], (value) =>
                  setFormData({ ...formData, [field.name]: value })
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}