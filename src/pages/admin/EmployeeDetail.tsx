import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Edit, 
  UserX, 
  FileText, 
  Calendar, 
  Mail, 
  Phone, 
  Building,
  User,
  Download
} from "lucide-react";

const EmployeeDetail = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [branch, setBranch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id]);

  const fetchEmployeeDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Fetch branch details if branch_id exists
      if (employeeData.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from("branches")
          .select("*")
          .eq("id", employeeData.branch_id)
          .single();

        if (!branchError) {
          setBranch(branchData);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("employee-documents")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Error downloading file",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
      
      setEmployee({ ...employee, status: newStatus });
      toast({ title: `Employee ${newStatus.toLowerCase()} successfully` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Employee not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">Admin Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/employees">Employees</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{employee.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center gap-4">
            <Link to="/admin/employees">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Employees
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{employee.name}</h1>
            <Badge 
              variant={employee.status === "Active" ? "default" : "secondary"}
              className={employee.status === "Active" ? "bg-gradient-success" : ""}
            >
              {employee.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          {employee.status === "Active" ? (
            <Button 
              variant="destructive" 
              onClick={() => handleStatusChange("Inactive")}
            >
              <UserX className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          ) : (
            <Button 
              variant="default" 
              onClick={() => handleStatusChange("Active")}
            >
              <User className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="documents">Attached Documents</TabsTrigger>
          <TabsTrigger value="history">Employment History</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Employee ID</p>
                  <p className="text-lg font-semibold">{employee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="text-lg">{employee.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.email || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.phone || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Employment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <p className="text-lg">{employee.role}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Branch</p>
                  <p className="text-lg">{branch?.name || "Not assigned"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined on {new Date(employee.joining_date).toLocaleDateString()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Login Access</p>
                  <Badge variant={employee.has_login ? "default" : "secondary"}>
                    {employee.has_login ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                {employee.has_login && employee.username && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                    <p className="text-lg">{employee.username}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Uploaded Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { key: "id_proof_file_path", label: "ID Proof", path: employee.id_proof_file_path },
                  { key: "offer_letter_file_path", label: "Offer Letter", path: employee.offer_letter_file_path },
                  { key: "resume_file_path", label: "Resume", path: employee.resume_file_path }
                ].map(({ key, label, path }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium">{label}</span>
                    </div>
                    {path ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(path, `${employee.name}_${label.replace(" ", "_")}`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not uploaded</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Employment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">{employee.role}</p>
                    <p className="text-sm text-muted-foreground">
                      Started on {new Date(employee.joining_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="default">Current</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeDetail;