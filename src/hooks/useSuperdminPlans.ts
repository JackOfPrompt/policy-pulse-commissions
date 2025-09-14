import { useState, useEffect } from 'react';
import { 
  Plan, 
  PlanFormData, 
  ApiResponse, 
  PaginatedResponse, 
  TableFilters, 
  TableSorting, 
  TablePagination 
} from '@/types/superadmin';
import {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan,
  duplicatePlan,
  initializeMockData
} from '@/lib/mockApi/superadmin';
import { toast } from 'sonner';

export const useSuperadminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePagination>({
    page: 1,
    pageSize: 10
  });
  const [filters, setFilters] = useState<TableFilters>({});
  const [sorting, setSorting] = useState<TableSorting>({
    field: 'created_at',
    direction: 'desc'
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    initializeMockData();
    fetchPlans();
  }, [pagination, filters, sorting]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Plan> = await getPlans(filters, sorting, pagination);
      setPlans(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to fetch plans');
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (data: PlanFormData): Promise<boolean> => {
    try {
      const response: ApiResponse<Plan> = await createPlan(data);
      if (response.success) {
        toast.success(response.message || 'Plan created successfully');
        fetchPlans();
        return true;
      } else {
        toast.error(response.message || 'Failed to create plan');
        return false;
      }
    } catch (error) {
      toast.error('Failed to create plan');
      console.error('Error creating plan:', error);
      return false;
    }
  };

  const handleUpdatePlan = async (id: string, data: Partial<PlanFormData>): Promise<boolean> => {
    try {
      const response: ApiResponse<Plan> = await updatePlan(id, data);
      if (response.success) {
        toast.success(response.message || 'Plan updated successfully');
        fetchPlans();
        return true;
      } else {
        toast.error(response.message || 'Failed to update plan');
        return false;
      }
    } catch (error) {
      toast.error('Failed to update plan');
      console.error('Error updating plan:', error);
      return false;
    }
  };

  const handleDeletePlan = async (id: string): Promise<boolean> => {
    try {
      const response: ApiResponse<boolean> = await deletePlan(id);
      if (response.success) {
        toast.success(response.message || 'Plan deleted successfully');
        fetchPlans();
        return true;
      } else {
        toast.error(response.message || 'Failed to delete plan');
        return false;
      }
    } catch (error) {
      toast.error('Failed to delete plan');
      console.error('Error deleting plan:', error);
      return false;
    }
  };

  const handleDuplicatePlan = async (id: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Plan> = await duplicatePlan(id);
      if (response.success) {
        toast.success(response.message || 'Plan duplicated successfully');
        fetchPlans();
        return true;
      } else {
        toast.error(response.message || 'Failed to duplicate plan');
        return false;
      }
    } catch (error) {
      toast.error('Failed to duplicate plan');
      console.error('Error duplicating plan:', error);
      return false;
    }
  };

  return {
    plans,
    loading,
    pagination,
    filters,
    sorting,
    total,
    totalPages,
    setPagination,
    setFilters,
    setSorting,
    fetchPlans,
    createPlan: handleCreatePlan,
    updatePlan: handleUpdatePlan,
    deletePlan: handleDeletePlan,
    duplicatePlan: handleDuplicatePlan
  };
};