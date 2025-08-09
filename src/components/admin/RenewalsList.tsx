import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Mail, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, isAfter, isBefore, addDays } from "date-fns";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
}

interface RenewalsListProps {
  filters: FilterState;
  showWeekOnly?: boolean;
}

interface Policy {
  id: string;
  policy_number: string;
  expiry_date: string;
  status: string;
  customers: {
    name: string;
  };
}

export const RenewalsList = ({ filters, showWeekOnly = false }: RenewalsListProps) => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRenewals();
  }, [filters, showWeekOnly]);

  const fetchRenewals = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const futureDate = showWeekOnly ? addDays(today, 7) : addDays(today, 30);

      let query = supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          expiry_date,
          status,
          customers (name)
        `)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', futureDate.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true });

      // Apply filters
      if (filters.branchId) {
        query = query.eq('branch_id', filters.branchId);
      }
      if (filters.policyType) {
        query = query.eq('policy_type', filters.policyType);
      }

      const { data, error } = await query;
      if (error) throw error;

      setPolicies((data as any) || []);
    } catch (error) {
      console.error('Error fetching renewals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (expiryDate: string, status: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);

    if (status === 'Renewed') return 'default';
    if (isBefore(expiry, today)) return 'destructive';
    if (isBefore(expiry, sevenDaysFromNow)) return 'secondary';
    return 'outline';
  };

  const getStatusText = (expiryDate: string, status: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();

    if (status === 'Renewed') return 'Renewed';
    if (isBefore(expiry, today)) return 'Expired';
    return 'Due Soon';
  };

  const dueSoonCount = policies.filter(p => {
    const expiry = new Date(p.expiry_date);
    const sevenDaysFromNow = addDays(new Date(), 7);
    return isBefore(expiry, sevenDaysFromNow) && p.status !== 'Renewed';
  }).length;

  const exportToExcel = () => {
    // Placeholder for export functionality
    console.log('Exporting renewals to Excel...');
  };

  const sendReminders = () => {
    // Placeholder for send reminders functionality
    console.log('Sending renewal reminders...');
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {showWeekOnly ? 'Renewals Due This Week' : 'Renewals Due (Next 30 Days)'}
          </CardTitle>
          {dueSoonCount > 10 && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {dueSoonCount} renewals due within 7 days!
              </AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={sendReminders}>
            <Mail className="h-4 w-4 mr-2" />
            Send Reminders
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading renewals...</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No renewals found for the selected period
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Policy Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow 
                  key={policy.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/admin/policies/${policy.id}`)}
                >
                  <TableCell className="font-medium">
                    {policy.policy_number}
                  </TableCell>
                  <TableCell>
                    {policy.customers?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(policy.expiry_date), 'PPP')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(policy.expiry_date, policy.status)}>
                      {getStatusText(policy.expiry_date, policy.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};