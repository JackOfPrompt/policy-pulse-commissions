import { supabase } from "@/integrations/supabase/client";

export interface AgentUpdateCSVRow {
  agentCode: string; // Required field to identify the agent
  phone?: string;
  email?: string;
  status?: string;
  commissionRate?: string;
  tierUpdate?: string;
  notes?: string;
}

export const getAgentUpdateTemplateColumns = (): string[] => [
  'agentCode', // Required for identification
  'phone',
  'email',
  'status',
  'commissionRate',
  'tierUpdate',
  'notes'
];

export const getAgentUpdateSampleData = (): Record<string, any>[] => [
  {
    agentCode: 'AGT001',
    phone: '9876543220',
    email: 'updated.robert@agents.com',
    status: 'Active',
    commissionRate: '7.5',
    tierUpdate: 'Silver',
    notes: 'Updated contact information'
  },
  {
    agentCode: 'AGT002',
    phone: '9876543221',
    email: 'updated.sarah@agents.com',
    status: 'Active',
    commissionRate: '8.0',
    tierUpdate: 'Gold',
    notes: 'Promoted to Gold tier'
  }
];

export const validateAgentUpdateRow = async (row: Record<string, any>): Promise<string[]> => {
  const errors: string[] = [];

  // Agent code is required for identification
  if (!row.agentCode?.trim()) {
    errors.push('Agent code is required for identification');
  }

  // Check if agent exists
  if (row.agentCode?.trim()) {
    try {
      const { data: agent, error } = await supabase
        .from('agents')
        .select('id, name')
        .eq('agent_code', row.agentCode)
        .maybeSingle();

      if (error) {
        errors.push(`Error finding agent: ${error.message}`);
      } else if (!agent) {
        errors.push(`Agent with code "${row.agentCode}" not found`);
      }
    } catch (error) {
      errors.push(`Database error while validating agent: ${error}`);
    }
  }

  // Email validation
  if (row.email && row.email.trim() && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (row.phone && row.phone.trim() && !isValidMobile(row.phone)) {
    errors.push('Invalid mobile number format');
  }

  // Status validation
  if (row.status && !['Active', 'Inactive'].includes(row.status)) {
    errors.push('Status must be Active or Inactive');
  }

  // Commission rate validation
  if (row.commissionRate && (isNaN(Number(row.commissionRate)) || Number(row.commissionRate) < 0 || Number(row.commissionRate) > 100)) {
    errors.push('Commission rate must be a number between 0 and 100');
  }

  // Tier validation (if provided, check if tier exists)
  if (row.tierUpdate?.trim()) {
    try {
      const { data: tier, error } = await supabase
        .from('agent_tiers')
        .select('id')
        .eq('name', row.tierUpdate)
        .maybeSingle();

      if (error) {
        errors.push(`Error validating tier: ${error.message}`);
      } else if (!tier) {
        errors.push(`Tier "${row.tierUpdate}" not found`);
      }
    } catch (error) {
      errors.push(`Database error while validating tier: ${error}`);
    }
  }

  return errors;
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidMobile = (mobile: string): boolean => {
  const mobileRegex = /^[0-9]{10}$/;
  return mobileRegex.test(mobile.replace(/\s+/g, ''));
};

export const processAgentUpdateRow = async (row: Record<string, any>): Promise<any> => {
  // Find the agent by code
  const { data: agent, error: findError } = await supabase
    .from('agents')
    .select('id')
    .eq('agent_code', row.agentCode)
    .single();

  if (findError) {
    throw new Error(`Error finding agent: ${findError.message}`);
  }

  if (!agent) {
    throw new Error(`Agent with code "${row.agentCode}" not found`);
  }

  // Prepare update data (only include fields that are provided)
  const updateData: any = {};

  if (row.phone?.trim()) updateData.phone = row.phone.trim();
  if (row.email?.trim()) updateData.email = row.email.trim();
  if (row.status?.trim()) updateData.status = row.status.trim();
  if (row.commissionRate?.trim()) updateData.commission_rate = Number(row.commissionRate);

  // Handle tier update
  if (row.tierUpdate?.trim()) {
    const { data: tier, error: tierError } = await supabase
      .from('agent_tiers')
      .select('id')
      .eq('name', row.tierUpdate)
      .single();

    if (tierError) {
      throw new Error(`Error finding tier: ${tierError.message}`);
    }

    updateData.tier_id = tier.id;
  }

  // Update the agent
  const { data: updatedAgent, error: updateError } = await supabase
    .from('agents')
    .update(updateData)
    .eq('id', agent.id)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update agent: ${updateError.message}`);
  }

  // If notes are provided, create an audit log entry
  if (row.notes?.trim()) {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          event: 'Agent Updated via Bulk Update',
          entity_type: 'agent',
          entity_id: agent.id,
          reason: row.notes.trim(),
          metadata: { updated_fields: Object.keys(updateData) }
        });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError);
    }
  }

  return updatedAgent;
};