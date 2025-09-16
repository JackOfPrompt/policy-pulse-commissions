import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BusinessSource {
  sourceType: 'employee' | 'posp' | 'misp' | null;
  sourceId: string | null;
  brokerCompany: string;
}

interface BusinessSourceAssignmentProps {
  businessSource: BusinessSource;
  onBusinessSourceChange: (source: BusinessSource) => void;
  onSave: (policyData: any) => void;
  onCancel: () => void;
  extractedData: any;
}

interface Employee {
  id: string;
  name: string;
  employee_code?: string;
}

interface Agent {
  id: string;
  agent_name: string;
  agent_code?: string;
}

interface Misp {
  id: string;
  channel_partner_name: string;
  type_of_dealer?: string;
}

export function BusinessSourceAssignment({
  businessSource,
  onBusinessSourceChange,
  onSave,
  onCancel,
  extractedData
}: BusinessSourceAssignmentProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [misps, setMisps] = useState<Misp[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.org_id) {
      loadSourceOptions();
    }
  }, [profile?.org_id]);

  const loadSourceOptions = async () => {
    if (!profile?.org_id) {
      toast({
        title: "Error",
        description: "Organization context not found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Load employees for current organization
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, employee_code')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .order('name');

      if (employeeError) throw employeeError;
      setEmployees(employeeData || []);

      // Load agents (POSPs) for current organization
      const { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id, agent_name, agent_code')
        .eq('org_id', profile.org_id)
        .eq('status', 'active')
        .order('agent_name');

      if (agentError) throw agentError;
      setAgents(agentData || []);

      // Load MISPs for current organization
      const { data: mispData, error: mispError } = await supabase
        .from('misps')
        .select('id, channel_partner_name, type_of_dealer')
        .eq('org_id', profile.org_id)
        .order('channel_partner_name');

      if (mispError) throw mispError;
      setMisps(mispData || []);
    } catch (error: any) {
      console.error('Error loading source options:', error);
      toast({
        title: "Error",
        description: "Failed to load business source options",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSourceOptions = () => {
    switch (businessSource.sourceType) {
      case 'employee':
        return employees.map(emp => ({
          value: emp.id,
          label: `${emp.name} ${emp.employee_code ? `(${emp.employee_code})` : ''}`
        }));
      case 'posp':
        return agents.map(agent => ({
          value: agent.id,
          label: `${agent.agent_name} ${agent.agent_code ? `(${agent.agent_code})` : ''}`
        }));
      case 'misp':
        return misps.map(misp => ({
          value: misp.id,
          label: `${misp.channel_partner_name}${misp.type_of_dealer ? ` (${misp.type_of_dealer})` : ''}`
        }));
      default:
        return [];
    }
  };

  const handleSourceTypeChange = (sourceType: 'employee' | 'posp' | 'misp') => {
    onBusinessSourceChange({
      sourceType,
      sourceId: null,
      brokerCompany: businessSource.brokerCompany
    });
  };

  const handleSourceIdChange = (sourceId: string) => {
    onBusinessSourceChange({
      ...businessSource,
      sourceId
    });
  };

  const handleBrokerCompanyChange = (brokerCompany: string) => {
    onBusinessSourceChange({
      ...businessSource,
      brokerCompany
    });
  };

  const isValidAssignment = () => {
    return businessSource.sourceType && businessSource.sourceId;
  };

  const handleSave = () => {
    if (!isValidAssignment()) {
      toast({
        title: "Incomplete Assignment",
        description: "Please select both source type and specific source before saving.",
        variant: "destructive"
      });
      return;
    }
    
    // Merge extracted data with business source assignment
    const policyWithSource = {
      ...extractedData,
      source_type: businessSource.sourceType,
      employee_id: businessSource.sourceType === 'employee' ? businessSource.sourceId : null,
      posp_id: businessSource.sourceType === 'posp' ? businessSource.sourceId : null,
      misp_id: businessSource.sourceType === 'misp' ? businessSource.sourceId : null,
      broker_company: businessSource.brokerCompany || null,
      policy_status: 'reviewed'
    };
    
    onSave(policyWithSource);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Business Source Assignment</h2>
        <p className="text-muted-foreground">
          Assign the origin of business for this policy to enable proper commission tracking
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Business Source Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="sourceType">Source Type *</Label>
            <Select
              value={businessSource.sourceType || ''}
              onValueChange={handleSourceTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Employee (Internal Sales)
                  </div>
                </SelectItem>
                <SelectItem value="posp">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    POSP Agent
                  </div>
                </SelectItem>
                <SelectItem value="misp">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    MISP Channel Partner
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Selection */}
          {businessSource.sourceType && (
            <div className="space-y-2">
              <Label htmlFor="sourceId">
                Select {businessSource.sourceType === 'employee' ? 'Employee' : 
                        businessSource.sourceType === 'posp' ? 'POSP Agent' : 
                        'MISP Channel Partner'} *
              </Label>
              <Select
                value={businessSource.sourceId || ''}
                onValueChange={handleSourceIdChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loading ? 'Loading...' : 
                    `Select ${businessSource.sourceType === 'employee' ? 'employee' : 
                             businessSource.sourceType === 'posp' ? 'agent' : 
                             'channel partner'}`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getSourceOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Broker Company */}
          <div className="space-y-2">
            <Label htmlFor="brokerCompany">Broking Services Company (Optional)</Label>
            <Input
              id="brokerCompany"
              value={businessSource.brokerCompany}
              onChange={(e) => handleBrokerCompanyChange(e.target.value)}
              placeholder="Enter broking company name"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onCancel}>
          Back to Review
        </Button>
        <Button 
          onClick={handleSave}
          disabled={!isValidAssignment()}
        >
          Save Policy
        </Button>
      </div>
    </div>
  );
}