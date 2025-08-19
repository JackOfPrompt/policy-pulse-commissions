import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SalaryRevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  employeeName: string;
  onSuccess: () => void;
}

export const SalaryRevisionModal = ({
  open,
  onOpenChange,
  employeeId,
  employeeName,
  onSuccess
}: SalaryRevisionModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<Date | undefined>(new Date());
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('');
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!effectiveDate || !baseSalary) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields."
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: {
          action: 'add_salary_record',
          employee_id: employeeId,
          effective_date: effectiveDate.toISOString().split('T')[0],
          base_salary: parseFloat(baseSalary),
          bonus: bonus ? parseFloat(bonus) : 0,
          reason
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Salary revision added successfully."
        });
        onSuccess();
        onOpenChange(false);
        resetForm();
      } else {
        throw new Error(data.error || 'Failed to add salary revision');
      }
    } catch (error) {
      console.error('Error adding salary revision:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add salary revision. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEffectiveDate(new Date());
    setBaseSalary('');
    setBonus('');
    setReason('');
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Salary Revision</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adding salary revision for {employeeName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="effective-date">Effective Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !effectiveDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {effectiveDate ? format(effectiveDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={effectiveDate}
                  onSelect={setEffectiveDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="base-salary">Base Salary (₹) *</Label>
            <Input
              id="base-salary"
              type="number"
              step="0.01"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              placeholder="Enter base salary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonus">Bonus (₹)</Label>
            <Input
              id="bonus"
              type="number"
              step="0.01"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="Enter bonus amount (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for salary revision"
              rows={3}
            />
          </div>

          {baseSalary && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Summary:</p>
              <p className="text-sm">
                Base Salary: ₹{parseFloat(baseSalary || '0').toLocaleString('en-IN')}
              </p>
              {bonus && (
                <p className="text-sm">
                  Bonus: ₹{parseFloat(bonus).toLocaleString('en-IN')}
                </p>
              )}
              <p className="text-sm font-medium">
                Total: ₹{(parseFloat(baseSalary || '0') + parseFloat(bonus || '0')).toLocaleString('en-IN')}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Salary Revision'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};