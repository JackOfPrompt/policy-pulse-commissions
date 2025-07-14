import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  FileSpreadsheet, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Upload,
  Search
} from "lucide-react";

interface Commission {
  id: string;
  policyNumber: string;
  agentName: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  policyType: string;
}

export function CommissionDashboard() {
  const [commissions, setCommissions] = useState<Commission[]>([
    {
      id: "1",
      policyNumber: "POL-2024-001",
      agentName: "John Smith",
      amount: 2500.00,
      status: "pending",
      createdAt: "2024-01-15",
      policyType: "Auto Insurance"
    },
    {
      id: "2", 
      policyNumber: "POL-2024-002",
      agentName: "Sarah Johnson",
      amount: 1850.00,
      status: "approved", 
      createdAt: "2024-01-14",
      policyType: "Home Insurance"
    },
    {
      id: "3",
      policyNumber: "POL-2024-003", 
      agentName: "Mike Davis",
      amount: 3200.00,
      status: "rejected",
      createdAt: "2024-01-13",
      policyType: "Life Insurance"
    }
  ]);

  const [formData, setFormData] = useState({
    policyNumber: "",
    agentName: "",
    policyType: "",
    premiumAmount: "",
    commissionRate: ""
  });

  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").length;
  const approvedCommissions = commissions.filter(c => c.status === "approved").length;

  const getStatusBadge = (status: Commission["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    }
  };

  const calculateCommission = () => {
    const premium = parseFloat(formData.premiumAmount);
    const rate = parseFloat(formData.commissionRate);
    if (premium && rate) {
      return (premium * rate / 100).toFixed(2);
    }
    return "0.00";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Commission Management</h1>
            <p className="text-muted-foreground">Calculate, validate, and approve insurance commissions</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Upload
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg">
              <Plus className="w-4 h-4" />
              New Commission
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-accent/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalCommissions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-warning/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCommissions}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-success/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedCommissions}</div>
              <p className="text-xs text-muted-foreground">Ready for payment</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$18,420</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calculate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="calculate" className="gap-2">
              <Calculator className="w-4 h-4" />
              Calculate
            </TabsTrigger>
            <TabsTrigger value="commissions" className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Commissions
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Validation
            </TabsTrigger>
          </TabsList>

          {/* Commission Calculator */}
          <TabsContent value="calculate">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" />
                  Commission Calculator
                </CardTitle>
                <CardDescription>
                  Calculate commissions for individual policies with real-time rate lookup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="policyNumber">Policy Number</Label>
                      <Input
                        id="policyNumber"
                        placeholder="POL-2024-XXX"
                        value={formData.policyNumber}
                        onChange={(e) => setFormData({...formData, policyNumber: e.target.value})}
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="agentName">Agent Name</Label>
                      <Input
                        id="agentName"
                        placeholder="Enter agent name"
                        value={formData.agentName}
                        onChange={(e) => setFormData({...formData, agentName: e.target.value})}
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="policyType">Policy Type</Label>
                      <Select value={formData.policyType} onValueChange={(value) => setFormData({...formData, policyType: value})}>
                        <SelectTrigger className="transition-all duration-200 focus:shadow-md">
                          <SelectValue placeholder="Select policy type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto Insurance</SelectItem>
                          <SelectItem value="home">Home Insurance</SelectItem>
                          <SelectItem value="life">Life Insurance</SelectItem>
                          <SelectItem value="health">Health Insurance</SelectItem>
                          <SelectItem value="commercial">Commercial Insurance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="premiumAmount">Premium Amount ($)</Label>
                      <Input
                        id="premiumAmount"
                        type="number"
                        placeholder="0.00"
                        value={formData.premiumAmount}
                        onChange={(e) => setFormData({...formData, premiumAmount: e.target.value})}
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                      <Input
                        id="commissionRate"
                        type="number"
                        placeholder="0.00"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({...formData, commissionRate: e.target.value})}
                        className="transition-all duration-200 focus:shadow-md"
                      />
                    </div>

                    <div className="p-4 bg-gradient-to-r from-accent/20 to-primary/10 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Calculated Commission</div>
                      <div className="text-2xl font-bold text-primary">${calculateCommission()}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary shadow-lg">
                    Calculate Commission
                  </Button>
                  <Button variant="outline">
                    Save Draft
                  </Button>
                  <Button variant="outline">
                    Reset Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission List */}
          <TabsContent value="commissions">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      Commission History
                    </CardTitle>
                    <CardDescription>
                      View and manage all commission calculations
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input placeholder="Search commissions..." className="pl-10 w-64" />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {commissions.map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{commission.policyNumber}</div>
                          <div className="text-sm text-muted-foreground">{commission.agentName}</div>
                        </div>
                        <Badge variant="outline">{commission.policyType}</Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium">${commission.amount.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">{commission.createdAt}</div>
                        </div>
                        {getStatusBadge(commission.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Validation */}
          <TabsContent value="validation">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Commission Validation
                </CardTitle>
                <CardDescription>
                  Multi-level approval workflow and validation rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Validation System</h3>
                  <p className="text-muted-foreground mb-6">Advanced validation features coming soon</p>
                  <Button variant="outline">
                    Configure Validation Rules
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}