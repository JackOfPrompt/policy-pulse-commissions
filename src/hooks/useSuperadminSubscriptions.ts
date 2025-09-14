import { useState, useEffect } from 'react';
import { 
  Subscription, 
  SubscriptionFormData, 
  ApiResponse, 
  PaginatedResponse, 
  TableFilters, 
  TableSorting, 
  TablePagination 
} from '@/types/superadmin';
import {
  getSubscriptions,
  renewSubscription,
  cancelSubscription,
  initializeMockData
} from '@/lib/mockApi/superadmin';
import { toast } from 'sonner';

export const useSuperadminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePagination>({
    page: 1,
    pageSize: 10
  });
  const [filters, setFilters] = useState<TableFilters>({});
  const [sorting, setSorting] = useState<TableSorting>({
    field: 'startDate',
    direction: 'desc'
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    initializeMockData();
    fetchSubscriptions();
  }, [pagination, filters, sorting]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response: PaginatedResponse<Subscription> = await getSubscriptions(filters, sorting, pagination);
      setSubscriptions(response.data);
      setTotal(response.total);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to fetch subscriptions');
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewSubscription = async (id: string, months: number): Promise<boolean> => {
    try {
      const response: ApiResponse<Subscription> = await renewSubscription(id, months);
      if (response.success) {
        toast.success(response.message || 'Subscription renewed successfully');
        fetchSubscriptions();
        return true;
      } else {
        toast.error(response.message || 'Failed to renew subscription');
        return false;
      }
    } catch (error) {
      toast.error('Failed to renew subscription');
      console.error('Error renewing subscription:', error);
      return false;
    }
  };

  const handleCancelSubscription = async (id: string, reason?: string): Promise<boolean> => {
    try {
      const response: ApiResponse<Subscription> = await cancelSubscription(id, reason);
      if (response.success) {
        toast.success(response.message || 'Subscription cancelled successfully');
        fetchSubscriptions();
        return true;
      } else {
        toast.error(response.message || 'Failed to cancel subscription');
        return false;
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
      console.error('Error cancelling subscription:', error);
      return false;
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const trialSubscriptions = subscriptions.filter(sub => sub.status === 'trial');
    const expiredSubscriptions = subscriptions.filter(sub => sub.status === 'expired');
    const totalRevenue = activeSubscriptions.reduce((sum, sub) => sum + sub.monthlyAmount, 0);

    return {
      total: subscriptions.length,
      active: activeSubscriptions.length,
      trial: trialSubscriptions.length,
      expired: expiredSubscriptions.length,
      cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length,
      totalRevenue
    };
  };

  return {
    subscriptions,
    loading,
    pagination,
    filters,
    sorting,
    total,
    totalPages,
    statistics: getStatistics(),
    setPagination,
    setFilters,
    setSorting,
    fetchSubscriptions,
    renewSubscription: handleRenewSubscription,
    cancelSubscription: handleCancelSubscription
  };
};