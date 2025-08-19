import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, TrendingUp, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SalaryRevisionModal } from './SalaryRevisionModal';

interface SalaryRecord {
  id: string;
  effective_date: string;
  base_salary: number;
  bonus: number;
  total_salary: number;
  reason: string;
  revised_by: string;
  status: string;
  created_at: string;
}

interface EmployeeSalaryHistoryProps {
  employeeId: string;
  employeeName: string;
}

export const EmployeeSalaryHistory = ({ employeeId, employeeName }: EmployeeSalaryHistoryProps) => {
  const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([]);
  const [currentSalary, setCurrentSalary] = useState<SalaryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const { toast } = useToast();

  const fetchSalaryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch salary history
      const { data: historyData, error: historyError } = await supabase.functions.invoke('employee-management', {
        body: { action: 'get_employee_salaries', employee_id: employeeId }
      });

      if (historyError) throw historyError;

      // Fetch latest salary
      const { data: latestData, error: latestError } = await supabase.functions.invoke('employee-management', {
        body: { action: 'get_latest_salary', employee_id: employeeId }
      });

      if (latestError) throw latestError;

      if (historyData.success) {
        setSalaryHistory(historyData.salaries || []);
      }

      if (latestData.success) {
        setCurrentSalary(latestData.salary);
      }

    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch salary information."
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [employeeId]);

  const handleRevisionSuccess = () => {
    fetchSalaryData();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Salary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Current Salary
              </CardTitle>
              <CardDescription>Latest salary information</CardDescription>
            </div>
            <Button onClick={() => setShowRevisionModal(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Revision
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentSalary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Base Salary</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{currentSalary.base_salary.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-center p-4 bg-secondary/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Bonus</p>
                <p className="text-2xl font-bold text-secondary">
                  ₹{currentSalary.bonus.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Salary</p>
                <p className="text-2xl font-bold text-accent">
                  ₹{currentSalary.total_salary.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No salary information available</p>
              <Button onClick={() => setShowRevisionModal(true)} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Salary Record
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Salary History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Salary History
          </CardTitle>
          <CardDescription>
            Complete salary revision history for {employeeName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salaryHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Effective Date</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.effective_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        ₹{record.base_salary.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        ₹{record.bonus.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{record.total_salary.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{record.reason || 'No reason provided'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'Active' ? 'default' : 'secondary'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No salary history available</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SalaryRevisionModal
        open={showRevisionModal}
        onOpenChange={setShowRevisionModal}
        employeeId={employeeId}
        employeeName={employeeName}
        onSuccess={handleRevisionSuccess}
      />
    </div>
  );
};