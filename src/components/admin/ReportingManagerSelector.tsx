import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useEmployees } from "@/hooks/useEmployees";

interface ReportingManagerSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function ReportingManagerSelector({ 
  value, 
  onChange, 
  label = "Reporting Manager",
  placeholder = "Select reporting manager...",
  disabled = false
}: ReportingManagerSelectorProps) {
  const { employees, loading } = useEmployees();

  const activeManagers = employees.filter(emp => 
    emp.status === 'active' && 
    (emp.designation?.toLowerCase().includes('manager') || 
     emp.designation?.toLowerCase().includes('head') ||
     emp.designation?.toLowerCase().includes('lead'))
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="reporting-manager">{label}</Label>
      <Select 
        value={value || ""} 
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">No reporting manager</SelectItem>
          {activeManagers.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.name} - {employee.designation || 'Employee'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}