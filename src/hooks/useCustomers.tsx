import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CustomerAddress {
  street?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  country?: string;
}

export interface Customer {
  id: string;
  customer_name: string;
  dob?: string;
  address?: any; // Use any for database compatibility
  phone?: string;
  email?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  nominee_name?: string;
  nominee_relationship?: string;
  nominee_phone?: string;
  nominee_email?: string;
  agent_id?: string;
  org_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  agent?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export interface CustomerInsert {
  customer_name: string;
  dob?: string;
  address?: any;
  phone?: string;
  email?: string;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  nominee_name?: string;
  nominee_relationship?: string;
  nominee_phone?: string;
  nominee_email?: string;
  agent_id?: string;
  org_id: string;
  created_by?: string;
}

export interface CustomerFilters {
  search?: string;
  marital_status?: string;
  agent_id?: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchCustomers = async (
    page = 1,
    limit = 10,
    filters: CustomerFilters = {}
  ) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          agent:profiles!customers_agent_id_fkey(
            first_name,
            last_name,
            email
          )
        `, { count: 'exact' })
        .range((page - 1) * limit, page * limit - 1)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      // Apply marital status filter
      if (filters.marital_status) {
        query = query.eq('marital_status', filters.marital_status);
      }

      // Apply agent filter
      if (filters.agent_id) {
        query = query.eq('agent_id', filters.agent_id);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setCustomers(data as Customer[] || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      toast({
        title: "Error fetching customers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: CustomerInsert) => {
    try {
      if (!profile) throw new Error('User not authenticated');
      
      const insertData = {
        customer_name: customerData.customer_name,
        dob: customerData.dob,
        address: customerData.address,
        phone: customerData.phone,
        email: customerData.email,
        marital_status: customerData.marital_status,
        nominee_name: customerData.nominee_name,
        nominee_relationship: customerData.nominee_relationship,
        nominee_phone: customerData.nominee_phone,
        nominee_email: customerData.nominee_email,
        agent_id: customerData.agent_id,
        org_id: profile.org_id!,
        created_by: profile.user_id,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Customer created successfully",
        description: `${customerData.customer_name} has been added.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating customer",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<CustomerInsert>) => {
    try {
      const updateData: any = {};
      
      if (customerData.customer_name !== undefined) updateData.customer_name = customerData.customer_name;
      if (customerData.dob !== undefined) updateData.dob = customerData.dob;
      if (customerData.address !== undefined) updateData.address = customerData.address;
      if (customerData.phone !== undefined) updateData.phone = customerData.phone;
      if (customerData.email !== undefined) updateData.email = customerData.email;
      if (customerData.marital_status !== undefined) updateData.marital_status = customerData.marital_status;
      if (customerData.nominee_name !== undefined) updateData.nominee_name = customerData.nominee_name;
      if (customerData.nominee_relationship !== undefined) updateData.nominee_relationship = customerData.nominee_relationship;
      if (customerData.nominee_phone !== undefined) updateData.nominee_phone = customerData.nominee_phone;
      if (customerData.nominee_email !== undefined) updateData.nominee_email = customerData.nominee_email;
      if (customerData.agent_id !== undefined) updateData.agent_id = customerData.agent_id;

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Customer updated successfully",
        description: `${customerData.customer_name || 'Customer'} has been updated.`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating customer",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Customer deleted successfully",
        description: "Customer has been removed from the system.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting customer",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Check if user has permission for actions
  const canCreate = profile?.role === 'admin' || profile?.role === 'employee' || profile?.role === 'agent';
  const canUpdate = profile?.role === 'admin' || profile?.role === 'employee';
  const canDelete = profile?.role === 'admin' || profile?.role === 'employee';

  return {
    customers,
    loading,
    totalCount,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    canCreate,
    canUpdate,
    canDelete,
  };
};