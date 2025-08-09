import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';

interface Task {
  id: string;
  task_title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  created_at: string;
  task_type: string;
  related_to: string | null;
  related_id: string | null;
}

interface TaskStats {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  dueToday: number;
}

export const useTasks = (userRole: string) => {
  const { user } = useSimpleAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('tasks-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tasks'
          },
          () => {
            console.log('Tasks data changed, refreshing...');
            fetchTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, userRole]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('tasks').select('*');

      if (userRole === 'Employee') {
        // Employee: Get tasks assigned to them
        const { data: employee } = await supabase
          .from('employees')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (employee) {
          query = query.eq('assigned_to_employee_id', employee.id);
        }
      } else if (userRole === 'Agent') {
        // Agent: Get tasks assigned to them
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('user_id', user?.id)
          .single();

        if (agent) {
          query = query.eq('assigned_to_agent_id', agent.id);
        }
      }

      const { data: tasksData, error: tasksError } = await query
        .order('due_date', { ascending: true });

      if (tasksError) {
        throw new Error('Failed to fetch tasks');
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const total = tasksData?.length || 0;
      
      const statusCounts = tasksData?.reduce((acc, task) => {
        const status = task.status.toLowerCase();
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const dueToday = tasksData?.filter(task => 
        task.due_date === today && task.status !== 'Completed'
      ).length || 0;

      const overdue = tasksData?.filter(task => 
        task.due_date < today && task.status !== 'Completed'
      ).length || 0;

      setStats({
        total,
        pending: statusCounts.open || 0,
        completed: statusCounts.completed || 0,
        overdue,
        dueToday,
      });

      setTasks(tasksData || []);

    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Overdue') => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) {
        throw error;
      }

      // Update local state
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      // Refresh stats
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  return {
    loading,
    error,
    tasks,
    stats,
    updateTaskStatus,
    refreshTasks: fetchTasks,
  };
};