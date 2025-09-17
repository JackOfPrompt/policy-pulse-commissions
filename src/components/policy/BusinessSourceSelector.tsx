import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEnhancedCommissionCalculation, EnhancedCommissionResult, Agent, MISP, Employee } from "@/hooks/useEnhancedCommissionCalculation";

interface BusinessSourceSelectorProps {
  policyId: string;
  onCommissionCalculated: (commission: EnhancedCommissionResult) => void;
  onSourceSelected: (sourceType: string, sourceId?: string) => void;
}

export function BusinessSourceSelector({ 
  policyId, 
  onCommissionCalculated,
  onSourceSelected 
}: BusinessSourceSelectorProps) {
  const [sourceType, setSourceType] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedMISP, setSelectedMISP] = useState<MISP | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [misps, setMISPs] = useState<MISP[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [commissionPreview, setCommissionPreview] = useState<EnhancedCommissionResult | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [mispOpen, setMispOpen] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);

  const {
    loading,
    calculateEnhancedCommission,
    saveEnhancedCommission,
    getAgents,
    getMISPs,
    getEmployees,
  } = useEnhancedCommissionCalculation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [agentData, mispData, employeeData] = await Promise.all([
      getAgents(),
      getMISPs(),
      getEmployees(),
    ]);
    
    setAgents(agentData);
    setMISPs(mispData);
    setEmployees(employeeData);
  };

  const handleSourceTypeChange = (value: string) => {
    setSourceType(value);
    setSelectedAgent(null);
    setSelectedMISP(null);
    setSelectedEmployee(null);
    setCommissionPreview(null);
    onSourceSelected(value);
  };

  const handleSourceSelection = (type: string, item: Agent | MISP | Employee) => {
    if (type === 'agent') {
      setSelectedAgent(item as Agent);
      setAgentOpen(false);
    } else if (type === 'misp') {
      setSelectedMISP(item as MISP);
      setMispOpen(false);
    } else if (type === 'employee') {
      setSelectedEmployee(item as Employee);
      setEmployeeOpen(false);
    }
    
    onSourceSelected(sourceType, item.id);
  };

  const previewCommission = async () => {
    const result = await calculateEnhancedCommission(policyId);
    if (result) {
      setCommissionPreview(result);
      onCommissionCalculated(result);
    }
  };

  const saveCommission = async () => {
    if (commissionPreview) {
      await saveEnhancedCommission(policyId, commissionPreview);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Business Source & Commission Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Source of Business</label>
          <Select value={sourceType} onValueChange={handleSourceTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agent">Agent (POSP)</SelectItem>
              <SelectItem value="misp">MISP (Channel Partner)</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="org_direct">Organization Direct</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Agent Selection */}
        {sourceType === 'agent' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Agent</label>
            <Popover open={agentOpen} onOpenChange={setAgentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={agentOpen}
                  className="w-full justify-between"
                >
                  {selectedAgent ? (
                    `${selectedAgent.agent_name} (${selectedAgent.agent_code}) - ${selectedAgent.base_percentage || 0}%`
                  ) : (
                    "Select agent..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search agents..." />
                  <CommandEmpty>No agent found.</CommandEmpty>
                  <CommandGroup>
                    {agents.map((agent) => (
                      <CommandItem
                        key={agent.id}
                        value={`${agent.agent_name} ${agent.agent_code}`}
                        onSelect={() => handleSourceSelection('agent', agent)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedAgent?.id === agent.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{agent.agent_name} ({agent.agent_code})</span>
                          <span className="text-sm text-muted-foreground">
                            Commission: {agent.base_percentage || 0}%
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* MISP Selection */}
        {sourceType === 'misp' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select MISP</label>
            <Popover open={mispOpen} onOpenChange={setMispOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={mispOpen}
                  className="w-full justify-between"
                >
                  {selectedMISP ? (
                    `${selectedMISP.channel_partner_name} - ${selectedMISP.percentage}%`
                  ) : (
                    "Select MISP..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search MISPs..." />
                  <CommandEmpty>No MISP found.</CommandEmpty>
                  <CommandGroup>
                    {misps.map((misp) => (
                      <CommandItem
                        key={misp.id}
                        value={misp.channel_partner_name}
                        onSelect={() => handleSourceSelection('misp', misp)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMISP?.id === misp.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{misp.channel_partner_name}</span>
                          <span className="text-sm text-muted-foreground">
                            Commission: {misp.percentage}%
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Employee Selection */}
        {sourceType === 'employee' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Popover open={employeeOpen} onOpenChange={setEmployeeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={employeeOpen}
                  className="w-full justify-between"
                >
                  {selectedEmployee ? (
                    `${selectedEmployee.name} (${selectedEmployee.employee_code})`
                  ) : (
                    "Select employee..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandEmpty>No employee found.</CommandEmpty>
                  <CommandGroup>
                    {employees.map((employee) => (
                      <CommandItem
                        key={employee.id}
                        value={`${employee.name} ${employee.employee_code}`}
                        onSelect={() => handleSourceSelection('employee', employee)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEmployee?.id === employee.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{employee.name} ({employee.employee_code})</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Preview Button */}
        <Button 
          onClick={previewCommission} 
          disabled={loading || !sourceType}
          className="w-full"
        >
          {loading ? 'Calculating...' : 'Preview Commission Split'}
        </Button>

        {/* Commission Preview */}
        {commissionPreview && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Commission Preview</span>
              <Badge 
                variant={
                  commissionPreview.commission_status === 'calculated' ? 'default' : 
                  commissionPreview.commission_status === 'grid_mismatch' ? 'destructive' :
                  'outline'
                }
              >
                {commissionPreview.commission_status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Insurer Commission:</span>
                <div className="font-medium">₹{commissionPreview.insurer_commission?.toLocaleString()}</div>
              </div>
              
              {commissionPreview.agent_commission > 0 && (
                <div>
                  <span className="text-muted-foreground">Agent Commission:</span>
                  <div className="font-medium">₹{commissionPreview.agent_commission?.toLocaleString()}</div>
                </div>
              )}
              
              {commissionPreview.misp_commission > 0 && (
                <div>
                  <span className="text-muted-foreground">MISP Commission:</span>
                  <div className="font-medium">₹{commissionPreview.misp_commission?.toLocaleString()}</div>
                </div>
              )}
              
              {commissionPreview.employee_commission > 0 && (
                <div>
                  <span className="text-muted-foreground">Employee Commission:</span>
                  <div className="font-medium">₹{commissionPreview.employee_commission?.toLocaleString()}</div>
                </div>
              )}
              
              <div>
                <span className="text-muted-foreground">Broker Share:</span>
                <div className="font-medium">₹{commissionPreview.broker_share?.toLocaleString()}</div>
              </div>
            </div>

            {commissionPreview.commission_status === 'calculated' && (
              <Button onClick={saveCommission} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Commission'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}