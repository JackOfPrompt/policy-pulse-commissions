import { useState } from "react";
import { UserCheck, Plus, Search, Edit, Trash2, Mail, Eye, Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusChip } from "@/components/ui/status-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEmployees } from "@/hooks/useEmployees";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { BulkUploadModal } from "@/components/admin/BulkUploadModal";
import { EditEmployeeModal } from "@/components/admin/EditEmployeeModal";
import { ViewEmployeeModal } from "@/components/admin/ViewEmployeeModal";
import { DeleteEmployeeModal } from "@/components/admin/DeleteEmployeeModal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AdminEmployees() {
  const { employees, loading, error } = useEmployees();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState<any>(null);
  const [editEmployee, setEditEmployee] = useState<any>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<any>(null);

  const filteredEmployees = employees.filter(employee =>
    (employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (employee.phone && employee.phone.includes(searchTerm)) ||
    (employee.employee_code && employee.employee_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employees</h1>
            <p className="text-muted-foreground">
              Manage internal staff and their roles
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : employees.length}</div>
              <p className="text-xs text-muted-foreground">Active staff members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <UserCheck className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : employees.filter(e => e.status === 'active').length}
              </div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <UserCheck className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : new Set(employees.map(e => e.department).filter(Boolean)).size}
              </div>
              <p className="text-xs text-muted-foreground">Unique departments</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>
              Manage internal staff members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading employees...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-destructive">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No employees found. Use bulk upload to add employees.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{(employee.name || 'U').split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{employee.name || 'Unnamed Employee'}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{employee.email || 'No email'}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.department || 'Not assigned'}</TableCell>
                      <TableCell>{employee.designation || 'Not assigned'}</TableCell>
                      <TableCell>
                        <StatusChip variant={employee.status === 'active' ? 'success' : 'secondary'}>
                          {employee.status}
                        </StatusChip>
                      </TableCell>
                      <TableCell>{new Date(employee.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setViewEmployee(employee)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setDeleteEmployee(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <BulkUploadModal
          open={isBulkUploadOpen}
          onOpenChange={setIsBulkUploadOpen}
          title="Employees"
          templateHeaders={[
            'employee_code',
            'name',
            'designation',
            'department',
            'dob',
            'phone',
            'email',
            'branch_name',
            'gender',
            'address',
            'city',
            'state',
            'pincode',
            'status'
          ]}
          requiredFields={['employee_code', 'name', 'department']}
          onUpload={handleBulkUpload}
          validateRow={validateEmployeeRow}
        />

        <ViewEmployeeModal
          employee={viewEmployee}
          open={!!viewEmployee}
          onOpenChange={(open) => !open && setViewEmployee(null)}
        />

        <EditEmployeeModal
          employee={editEmployee}
          open={!!editEmployee}
          onOpenChange={(open) => !open && setEditEmployee(null)}
          onUpdate={() => window.location.reload()}
        />

        <DeleteEmployeeModal
          employee={deleteEmployee}
          open={!!deleteEmployee}
          onOpenChange={(open) => !open && setDeleteEmployee(null)}
          onDelete={() => window.location.reload()}
        />
      </div>
    </AdminLayout>
  );

  function validateEmployeeRow(row: any) {
    const errors: string[] = [];
    
    if (row.status && !['active', 'inactive'].includes(row.status.toLowerCase())) {
      errors.push('Status must be either "active" or "inactive"');
    }
    
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('Invalid email format');
    }
    
    if (row.phone && !/^\d{10}$/.test(row.phone.replace(/\D/g, ''))) {
      errors.push('Phone must be 10 digits');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async function handleBulkUpload(data: any[], isUpdate: boolean) {
    try {
      if (!user || !profile?.org_id) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "User authentication required"
        });
        return { success: false, error: "Authentication required" };
      }

      const processedData = data.map(row => ({
        employee_code: row.employee_code,
        name: row.name,
        designation: row.designation || null,
        department: row.department,
        dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : null,
        phone: row.phone || null,
        email: row.email || null,
        branch_name: row.branch_name || null,
        gender: row.gender || null,
        address: row.address || null,
        city: row.city || null,
        state: row.state || null,
        pincode: row.pincode || null,
        status: row.status?.toLowerCase() || 'active',
        org_id: profile.org_id,
        created_by: user.id
      }));

      let results;
      if (isUpdate) {
        const { data: result, error } = await supabase
          .from('employees')
          .upsert(processedData, {
            onConflict: 'employee_code,org_id',
            ignoreDuplicates: false
          })
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Updated successfully' }));
      } else {
        const { data: result, error } = await supabase
          .from('employees')
          .insert(processedData)
          .select();
        
        if (error) throw error;
        results = processedData.map(() => ({ success: true, message: 'Inserted successfully' }));
      }

      return {
        success: true,
        results
      };
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }
}