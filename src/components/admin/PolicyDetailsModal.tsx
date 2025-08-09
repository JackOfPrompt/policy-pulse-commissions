import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  User, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Building, 
  Shield, 
  Clock, 
  History,
  Eye,
  Download,
  Edit,
  AlertTriangle,
  TrendingUp,
  Users,
  Car,
  Heart,
  Plane,
  Building2,
  Briefcase
} from "lucide-react";
import { PolicyStatusBadge } from "./PolicyStatusBadge";
import { PolicyStatusHistory } from "./PolicyStatusHistory";

interface PolicyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  policyId: string;
}

interface PolicyDetails {
  id: string;
  policy_number: string;
  policy_status: string;
  premium_amount: number;
  sum_insured: number;
  policy_start_date: string;
  policy_end_date: string;
  payment_frequency: string;
  created_at: string;
  status_updated_at: string;
  remarks: string;
  alert_flag: boolean;
  payout_reversal_required: boolean;
  
  // Customer details
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_age: number;
  customer_gender: string;
  
  // Insurer details
  insurer_name: string;
  insurer_contact: string;
  
  // Product details
  product_name: string;
  product_category: string;
  product_type: string;
  line_of_business: string;
  
  // Agent/Employee details
  agent_name: string;
  agent_phone: string;
  employee_name: string;
  branch_name: string;
  
  // Additional policy details based on line of business
  health_details?: any;
  motor_details?: any;
  life_details?: any;
  travel_details?: any;
  commercial_details?: any;
}

export const PolicyDetailsModal = ({ isOpen, onClose, policyId }: PolicyDetailsModalProps) => {
  const [policy, setPolicy] = useState<PolicyDetails | null>(null);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && policyId) {
      fetchPolicyDetails();
    }
  }, [isOpen, policyId]);

  const fetchPolicyDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch main policy details with all related information
      const { data: policyData, error: policyError } = await supabase
        .from('policies_with_details')
        .select('*')
        .eq('id', policyId)
        .single();

      if (policyError) throw policyError;

      // Fetch line of business specific details
      let lobDetails = null;
      if (policyData.line_of_business) {
        const lobName = policyData.line_of_business.toLowerCase();
        
        if (lobName === 'health') {
          const { data } = await supabase
            .from('health_policies')
            .select('*')
            .eq('policy_id', policyId)
            .single();
          lobDetails = data;
        } else if (lobName === 'motor') {
          const { data } = await supabase
            .from('motor_policies')
            .select('*')
            .eq('policy_id', policyId)
            .single();
          lobDetails = data;
        } else if (lobName === 'life') {
          const { data } = await supabase
            .from('life_policies')
            .select('*')
            .eq('policy_id', policyId)
            .single();
          lobDetails = data;
        } else if (lobName === 'commercial') {
          const { data } = await supabase
            .from('commercial_policies')
            .select('*')
            .eq('policy_id', policyId)
            .single();
          lobDetails = data;
        }
      }

      // Get the line of business name for later use
      const lobName = policyData.line_of_business?.toLowerCase();

      // Create a simplified policy details object using any type
      const mappedPolicy: any = {
        ...policyData,
        health_details: lobName === 'health' ? lobDetails : undefined,
        motor_details: lobName === 'motor' ? lobDetails : undefined,
        life_details: lobName === 'life' ? lobDetails : undefined,
        commercial_details: lobName === 'commercial' ? lobDetails : undefined,
      };

      setPolicy(mappedPolicy);

      // Fetch status history
      const { data: historyData } = await supabase
        .from('policy_status_history')
        .select('*')
        .eq('policy_id', policyId)
        .order('changed_at', { ascending: false });
      
      setStatusHistory(historyData || []);

      // Fetch commissions
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('*, agents(name)')
        .eq('policy_id', policyId);
      
      setCommissions(commissionsData || []);

      // Fetch payouts
      const { data: payoutsData } = await supabase
        .from('payout_transactions')
        .select('*, agents(name)')
        .eq('policy_id', policyId);
      
      setPayouts(payoutsData || []);

      // Fetch documents
      const { data: documentsData } = await supabase
        .from('policy_documents')
        .select('*')
        .eq('policy_id', policyId);
      
      setDocuments(documentsData || []);

    } catch (error: any) {
      console.error('Error fetching policy details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch policy details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLineOfBusinessIcon = (lob: string) => {
    switch (lob?.toLowerCase()) {
      case 'health': return Heart;
      case 'motor': return Car;
      case 'life': return Users;
      case 'travel': return Plane;
      case 'commercial': return Building2;
      default: return Shield;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysInStatus = () => {
    if (!policy?.status_updated_at) return 0;
    return Math.floor((new Date().getTime() - new Date(policy.status_updated_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Policy Details - {policy?.policy_number || 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading policy details...</div>
          </div>
        ) : policy ? (
          <ScrollArea className="h-[80vh]">
            <div className="space-y-6 p-1">
              {/* Header Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const IconComponent = getLineOfBusinessIcon(policy.line_of_business);
                        return <IconComponent className="h-8 w-8 text-primary" />;
                      })()}
                      <div>
                        <p className="text-sm text-muted-foreground">Line of Business</p>
                        <p className="font-semibold">{policy.line_of_business}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Premium Amount</p>
                        <p className="font-semibold">{formatCurrency(policy.premium_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Sum Insured</p>
                        <p className="font-semibold">{formatCurrency(policy.sum_insured || 0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-8 w-8 text-orange-600" />
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <PolicyStatusBadge 
                          status={policy.policy_status} 
                          daysInStatus={calculateDaysInStatus()}
                          alertFlag={policy.alert_flag}
                        />
                      </div>
                    </div>
                  </div>

                  {policy.alert_flag && (
                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Policy requires attention - {calculateDaysInStatus()} days in {policy.policy_status} status
                      </span>
                    </div>
                  )}

                  {policy.payout_reversal_required && (
                    <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium text-warning">
                        Payout reversal required for this policy
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="customer">Customer</TabsTrigger>
                  <TabsTrigger value="product">Product</TabsTrigger>
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Policy Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Policy Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Policy Number:</span>
                          <span className="font-medium">{policy.policy_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{formatDate(policy.policy_start_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">End Date:</span>
                          <span>{formatDate(policy.policy_end_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Frequency:</span>
                          <span>{policy.payment_frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{formatDate(policy.created_at)}</span>
                        </div>
                        {policy.remarks && (
                          <div>
                            <span className="text-muted-foreground">Remarks:</span>
                            <p className="mt-1 text-sm bg-muted p-2 rounded">{policy.remarks}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Sales Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Sales Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {policy.agent_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Agent:</span>
                            <span className="font-medium">{policy.agent_name}</span>
                          </div>
                        )}
                        {policy.agent_phone && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Agent Phone:</span>
                            <span>{policy.agent_phone}</span>
                          </div>
                        )}
                        {policy.employee_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Employee:</span>
                            <span className="font-medium">{policy.employee_name}</span>
                          </div>
                        )}
                        {policy.branch_name && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Branch:</span>
                            <span>{policy.branch_name}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Line of Business Specific Details */}
                  {renderLOBSpecificDetails(policy)}
                </TabsContent>

                <TabsContent value="customer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">{policy.customer_name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{policy.customer_phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{policy.customer_email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Age:</span>
                          <span>{policy.customer_age || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gender:</span>
                          <span>{policy.customer_gender || 'N/A'}</span>
                        </div>
                      </div>
                      {policy.customer_address && (
                        <div>
                          <span className="text-muted-foreground">Address:</span>
                          <p className="mt-1 text-sm bg-muted p-2 rounded">{policy.customer_address}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="product" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Product Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Product Name:</span>
                          <span className="font-medium">{policy.product_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{policy.product_category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span>{policy.product_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Line of Business:</span>
                          <span>{policy.line_of_business}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Insurer Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Insurer:</span>
                          <span className="font-medium">{policy.insurer_name}</span>
                        </div>
                        {policy.insurer_contact && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Contact:</span>
                            <span>{policy.insurer_contact}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="financial" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Commissions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Commissions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {commissions.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {commissions.map((commission) => (
                                <TableRow key={commission.id}>
                                  <TableCell>{commission.agents?.name || 'N/A'}</TableCell>
                                  <TableCell>{commission.commission_rate}%</TableCell>
                                  <TableCell>{formatCurrency(commission.commission_amount)}</TableCell>
                                  <TableCell>
                                    <Badge variant={commission.status === 'Approved' ? 'default' : 'secondary'}>
                                      {commission.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground">No commissions found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Payouts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Payouts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {payouts.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {payouts.map((payout) => (
                                <TableRow key={payout.id}>
                                  <TableCell>{payout.agents?.name || 'N/A'}</TableCell>
                                  <TableCell>{formatCurrency(payout.payout_amount)}</TableCell>
                                  <TableCell>{formatDate(payout.payout_date)}</TableCell>
                                  <TableCell>
                                    <Badge variant={payout.payout_status === 'Completed' ? 'default' : 'secondary'}>
                                      {payout.payout_status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-muted-foreground">No payouts found</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Status History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statusHistory.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Previous Status</TableHead>
                              <TableHead>New Status</TableHead>
                              <TableHead>Changed At</TableHead>
                              <TableHead>Changed By</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statusHistory.map((history) => (
                              <TableRow key={history.id}>
                                <TableCell>{history.previous_status}</TableCell>
                                <TableCell>{history.new_status}</TableCell>
                                <TableCell>{formatDate(history.changed_at)}</TableCell>
                                <TableCell>{history.changed_by_role}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No status history found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {documents.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Type</TableHead>
                              <TableHead>File Name</TableHead>
                              <TableHead>Uploaded</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((doc) => (
                              <TableRow key={doc.id}>
                                <TableCell>{doc.document_type}</TableCell>
                                <TableCell>{doc.file_name}</TableCell>
                                <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Eye className="h-3 w-3 mr-1" />
                                      View
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-muted-foreground">No documents found</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Policy not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Helper function to render line of business specific details
const renderLOBSpecificDetails = (policy: PolicyDetails) => {
  const lob = policy.line_of_business?.toLowerCase();
  
  if (lob === 'health' && policy.health_details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Health Insurance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sum Insured:</span>
              <span>{policy.health_details.sum_insured ? `₹${policy.health_details.sum_insured.toLocaleString()}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deductible:</span>
              <span>{policy.health_details.deductible ? `₹${policy.health_details.deductible.toLocaleString()}` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Policy Type:</span>
              <span>{policy.health_details.floater_or_individual || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room Rent Limit:</span>
              <span>{policy.health_details.room_rent_limit || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (lob === 'motor' && policy.motor_details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Motor Insurance Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle Number:</span>
              <span className="font-medium">{policy.motor_details.vehicle_number || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle Make:</span>
              <span>{policy.motor_details.vehicle_make || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vehicle Model:</span>
              <span>{policy.motor_details.vehicle_model || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Year of Manufacture:</span>
              <span>{policy.motor_details.year_of_manufacture || 'N/A'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};