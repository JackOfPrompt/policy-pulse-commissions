import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Edit, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Users,
  TrendingUp,
  FileText
} from "lucide-react";

const BranchDetail = () => {
  const { id } = useParams();
  const [branch, setBranch] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchBranchDetail();
    }
  }, [id]);

  const fetchBranchDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch branch details
      const { data: branchData, error: branchError } = await supabase
        .from("branches")
        .select("*")
        .eq("branch_id", id)
        .single();

      if (branchError) throw branchError;
      setBranch(branchData);

      // Fetch employees for this branch
      const { data: employeesData, error: employeesError } = await supabase
        .from("employees")
        .select("*")
        .eq("branch_id", id);

      if (!employeesError) {
        setEmployees(employeesData || []);
      }

      // Fetch agents for this branch
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("*")
        .eq("branch_id", id);

      if (!agentsError) {
        setAgents(agentsData || []);
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

  const handleStatusChange = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from("branches")
        .update({ status: newStatus })
        .eq("branch_id", id);

      if (error) throw error;
      
      setBranch({ ...branch, status: newStatus });
      toast({ title: `Branch ${newStatus.toLowerCase()} successfully` });
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

  if (!branch) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Branch not found</p>
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
                <BreadcrumbLink href="/admin/branches">Branches</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{branch.branch_name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center gap-4">
            <Link to="/admin/branches">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Branches
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">{branch.branch_name}</h1>
            <Badge 
              variant={branch.status === "Active" ? "default" : "secondary"}
              className={branch.status === "Active" ? "bg-gradient-success" : ""}
            >
              {branch.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Branch
          </Button>
          {branch.status === "Active" ? (
            <Button 
              variant="destructive" 
              onClick={() => handleStatusChange("Inactive")}
            >
              Deactivate
            </Button>
          ) : (
            <Button 
              variant="default" 
              onClick={() => handleStatusChange("Active")}
            >
              Activate
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="employees">Assigned Employees</TabsTrigger>
          <TabsTrigger value="agents">Assigned Agents</TabsTrigger>
          <TabsTrigger value="kpis">Branch KPIs</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Branch Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Branch Code</p>
                  <p className="text-lg font-semibold">{branch.branch_code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Branch Name</p>
                  <p className="text-lg">{branch.branch_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p>{branch.address_line1}</p>
                    {branch.address_line2 && <p>{branch.address_line2}</p>}
                    <p>{branch.city}, {branch.state} - {branch.pincode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.phone_number || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{branch.email || "Not provided"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Manager Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manager Name</p>
                  <p className="text-lg">{branch.contact_person || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Manager Phone</p>
                  <p className="text-lg">{branch.phone_number || "Not provided"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Employees ({employees.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          <Link 
                            to={`/admin/employees/${employee.id}`}
                            className="text-primary hover:underline"
                          >
                            {employee.name}
                          </Link>
                        </TableCell>
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>{employee.role}</TableCell>
                        <TableCell>{employee.phone || employee.email || "Not provided"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={employee.status === "Active" ? "default" : "secondary"}
                            className={employee.status === "Active" ? "bg-gradient-success" : ""}
                          >
                            {employee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No employees assigned to this branch</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assigned Agents ({agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agents.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Agent Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">
                          <Link 
                            to={`/admin/agents/${agent.id}`}
                            className="text-primary hover:underline"
                          >
                            {agent.name}
                          </Link>
                        </TableCell>
                        <TableCell>{agent.agent_code}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {agent.agent_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{agent.phone || agent.email || "Not provided"}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={agent.status === "Active" ? "default" : "secondary"}
                            className={agent.status === "Active" ? "bg-gradient-success" : ""}
                          >
                            {agent.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No agents assigned to this branch</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpis">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policies Sold
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{agents.filter(a => a.status === "Active").length}</div>
                <p className="text-sm text-muted-foreground">Currently active</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchDetail;