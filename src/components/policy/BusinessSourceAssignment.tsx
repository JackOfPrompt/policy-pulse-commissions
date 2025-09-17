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
  sourceType: 'internal' | 'external' | null;
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
      case 'internal':
        return employees.map(emp => ({
          value: emp.id,
          label: `${emp.name} ${emp.employee_code ? `(${emp.employee_code})` : ''}`
        }));
      case 'external':
        return [
          ...agents.map(agent => ({
            value: agent.id,
            label: `Agent: ${agent.agent_name} ${agent.agent_code ? `(${agent.agent_code})` : ''}`,
            type: 'agent'
          })),
          ...misps.map(misp => ({
            value: misp.id,
            label: `MISP: ${misp.channel_partner_name}${misp.type_of_dealer ? ` (${misp.type_of_dealer})` : ''}`,
            type: 'misp'
          }))
        ];
      default:
        return [];
    }
  };

  const handleSourceTypeChange = (sourceType: 'internal' | 'external') => {
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
    
    // Determine the specific source type and ID for external sources
    let sourceDetails = { employee_id: null, agent_id: null, misp_id: null };
    
    if (businessSource.sourceType === 'internal') {
      sourceDetails.employee_id = businessSource.sourceId;
    } else if (businessSource.sourceType === 'external') {
      // Check if selected source is an agent or misp
      const selectedAgent = agents.find(a => a.id === businessSource.sourceId);
      const selectedMisp = misps.find(m => m.id === businessSource.sourceId);
      
      if (selectedAgent) {
        sourceDetails.agent_id = businessSource.sourceId;
      } else if (selectedMisp) {
        sourceDetails.misp_id = businessSource.sourceId;
      }
    }
    
    // Merge extracted data with business source assignment
    const policyWithSource = {
      ...extractedData,
      source_type: businessSource.sourceType,
      ...sourceDetails,
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
                <SelectItem value="internal">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Internal (Employee Sales)
                  </div>
                </SelectItem>
                <SelectItem value="external">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    External (Agent/MISP)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Selection */}
          {businessSource.sourceType && (
            <div className="space-y-2">
               <Label htmlFor="sourceId">
                Select {businessSource.sourceType === 'internal' ? 'Employee' : 'Agent/MISP'} *
               </Label>
              <Select
                value={businessSource.sourceId || ''}
                onValueChange={handleSourceIdChange}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    loading ? 'Loading...' : 
                    `Select ${businessSource.sourceType === 'internal' ? 'employee' : 'agent or MISP'}`
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