import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Agent {
  agent_id: number;
  tenant_id: string;
  agent_type: 'POSP' | 'MISP';
  full_name: string;
  email?: string;
  phone?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXAM_PENDING' | 'EXAM_PASSED';
  created_by?: string;
  created_at: string;
  updated_at: string;
  exam?: AgentExam;
  approvals?: AgentApproval[];
}

export interface AgentExam {
  exam_id: number;
  agent_id: number;
  exam_date?: string;
  score?: number;
  status: 'ASSIGNED' | 'PASSED' | 'FAILED';
  created_at: string;
}

export interface AgentApproval {
  approval_id: number;
  agent_id: number;
  approver_id: string;
  level: number;
  decision: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision_date?: string;
  comments?: string;
  created_at: string;
}

export const useAgents = () => {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = async (filters?: {
    tenant_id?: string;
    agent_type?: string;
    status?: string;
    search?: string;
  }) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'GET',
        body: { action: 'get_agents', ...filters }
      });

      if (error) throw error;
      if (data?.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: {
    agent_type: 'POSP' | 'MISP';
    full_name: string;
    email?: string;
    phone?: string;
    created_by?: string;
  }) => {
    try {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context available');
      }
      
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'POST',
        body: { 
          action: 'create_agent',
          tenant_id: profile.tenant_id,
          created_by: profile.user_id,
          ...agentData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  };

  const updateAgent = async (agentId: number, agentData: Partial<Agent>) => {
    try {
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'PUT',
        body: { 
          action: 'update_agent',
          agent_id: agentId,
          ...agentData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  };

  const deleteAgent = async (agentId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'DELETE',
        body: { 
          action: 'delete_agent',
          agent_id: agentId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  };

  const submitExam = async (agentId: number, examData: { score: number; status: 'PASSED' | 'FAILED' }) => {
    try {
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'POST',
        body: { 
          action: 'submit_exam',
          agent_id: agentId,
          ...examData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting exam:', error);
      throw error;
    }
  };

  const processApproval = async (agentId: number, approvalData: {
    approver_id: string;
    decision: 'APPROVED' | 'REJECTED';
    comments?: string;
    level?: number;
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'POST',
        body: { 
          action: 'process_approval',
          agent_id: agentId,
          ...approvalData 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  };

  const getAgentDetail = async (agentId: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('agents-management', {
        method: 'GET',
        body: { 
          action: 'get_agent_detail',
          agent_id: agentId
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching agent detail:', error);
      throw error;
    }
  };

  return {
    agents,
    loading,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    submitExam,
    processApproval,
    getAgentDetail,
  };
};