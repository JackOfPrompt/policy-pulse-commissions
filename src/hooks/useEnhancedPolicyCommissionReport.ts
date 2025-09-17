import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EnhancedPolicyCommissionRecord {
  policy_id: string;
  policy_number: string;
  customer_name: string;
  product_type: string;
  product_category: string;
  provider: string;
  plan_name: string;
  gross_premium: number;
  premium_with_gst: number;
  premium_without_gst: number;
  base_rate: number;
  reward_rate: number;
  bonus_rate: number;
  total_rate: number;
  commission_amount: number;
  reward_amount: number;
  total_commission: number;
  insurer_commission: number;
  agent_commission: number;
  misp_commission: number;
  employee_commission: number;
  reporting_employee_commission: number;
  broker_share: number;
  source_type: 'agent' | 'employee' | 'misp' | null;
  source_name: string;
  source_code: string;
  reporting_employee_name?: string;
  reporting_employee_code?: string;
  policy_status: string;
  policy_start_date: string;
  policy_end_date: string;
  created_at: string;
  grid_matched: boolean;
  grid_source: string;
  calculation_status: string;
}

export interface PolicyCommissionFilters {
  productType?: string;
  sourceType?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function useEnhancedPolicyCommissionReport(filters: PolicyCommissionFilters = {}) {
  const { profile } = useAuth();
  const [data, setData] = useState<EnhancedPolicyCommissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchPolicyCommissions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      if (!profile?.org_id) {
        setError('Organization ID not found');
        return;
      }

      // Fetch policies with all necessary joins including employee and agent codes
      let query = supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          gross_premium,
          premium_with_gst,
          premium_without_gst,
          provider,
          plan_name,
          policy_status,
          start_date,
          end_date,
          source_type,
          created_at,
          product_types!inner(name, category),
          customers!inner(first_name, last_name),
          agents(agent_name, agent_code, base_percentage, override_percentage, employee_id),
          employees(name, employee_code),
          misps(channel_partner_name, percentage, employee_id)
        `, { count: 'exact' });

      // Apply role-based filtering
      if (profile.role === 'admin') {
        query = query.eq('org_id', profile.org_id);
      } else if (profile.role === 'employee') {
        query = query.eq('employee_id', profile.id);
      } else if (profile.role === 'agent') {
        query = query.eq('agent_id', profile.id);
      }

      // Apply filters
      if (filters.productType) {
        query = query.eq('product_types.category', filters.productType);
      }
      
      if (filters.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }
      
      if (filters.provider) {
        query = query.eq('provider', filters.provider);
      }
      
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      if (filters.search) {
        query = query.or(
          `policy_number.ilike.%${filters.search}%,customers.first_name.ilike.%${filters.search}%,customers.last_name.ilike.%${filters.search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      // Order by created_at desc
      query = query.order('created_at', { ascending: false });

      const { data: policies, error: policiesError, count } = await query;

      if (policiesError) throw policiesError;

      if (!policies || policies.length === 0) {
        setData([]);
        setTotalRecords(0);
        return;
      }

      // Process each policy to get commission data from appropriate payout grids
      const enhancedData = await Promise.all(
        policies.map(async (policy: any) => {
          const premium = policy.gross_premium || policy.premium_with_gst || policy.premium_without_gst || 0;
          const productType = policy.product_types?.category;
          const customerName = `${policy.customers?.first_name || ''} ${policy.customers?.last_name || ''}`.trim();
          
          // Business source logic
          let sourceName = 'Direct';
          let sourceCode = '';
          let reportingEmployeeName = '';
          let reportingEmployeeCode = '';
          let agentPercentage = 0;
          let mispPercentage = 50; // Default MISP percentage
          
          if (policy.source_type === 'employee' && policy.employees) {
            sourceName = policy.employees.name || 'Unknown Employee';
            sourceCode = policy.employees.employee_code || '';
          } else if (policy.source_type === 'agent' && policy.agents) {
            sourceName = policy.agents.agent_name || 'Unknown Agent';
            sourceCode = policy.agents.agent_code || '';
            agentPercentage = policy.agents.override_percentage || policy.agents.base_percentage || 50;
            
            // Fetch reporting employee data for agent
            if (policy.agents.employee_id) {
              try {
                const { data: reportingEmployee } = await supabase
                  .from('employees')
                  .select('name, employee_code')
                  .eq('id', policy.agents.employee_id)
                  .single();
                
                if (reportingEmployee) {
                  reportingEmployeeName = reportingEmployee.name || '';
                  reportingEmployeeCode = reportingEmployee.employee_code || '';
                }
              } catch (err) {
                console.error('Error fetching reporting employee for agent:', err);
              }
            }
          } else if (policy.source_type === 'misp' && policy.misps) {
            sourceName = policy.misps.channel_partner_name || 'Unknown MISP';
            sourceCode = '';
            mispPercentage = policy.misps.percentage || 50;
            
            // Fetch reporting employee data for MISP
            if (policy.misps.employee_id) {
              try {
                const { data: reportingEmployee } = await supabase
                  .from('employees')
                  .select('name, employee_code')
                  .eq('id', policy.misps.employee_id)
                  .single();
                
                if (reportingEmployee) {
                  reportingEmployeeName = reportingEmployee.name || '';
                  reportingEmployeeCode = reportingEmployee.employee_code || '';
                }
              } catch (err) {
                console.error('Error fetching reporting employee for MISP:', err);
              }
            }
          }

          let gridData = {
            base_rate: 0,
            reward_rate: 0,
            bonus_rate: 0,
            grid_matched: false,
            grid_source: '',
            calculation_status: 'no_grid_match'
          };

          try {
            // Match with appropriate payout grid based on product type
            if (productType?.toLowerCase() === 'life') {
              const { data: lifeGrid } = await supabase
                .from('life_payout_grid')
                .select('commission_rate, reward_rate, bonus_commission_rate')
                .eq('org_id', profile.org_id)
                .eq('product_type', 'Life')
                .eq('provider', policy.provider)
                .or(`plan_name.is.null,plan_name.eq.${policy.plan_name || ''}`)
                .lte('commission_start_date', new Date().toISOString().split('T')[0])
                .or(`commission_end_date.is.null,commission_end_date.gte.${new Date().toISOString().split('T')[0]}`)
                .or(`min_premium.is.null,min_premium.lte.${premium}`)
                .or(`max_premium.is.null,max_premium.gte.${premium}`)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

              if (lifeGrid && lifeGrid.length > 0) {
                const grid = lifeGrid[0];
                gridData = {
                  base_rate: grid.commission_rate || 0,
                  reward_rate: grid.reward_rate || 0,
                  bonus_rate: grid.bonus_commission_rate || 0,
                  grid_matched: true,
                  grid_source: 'life_payout_grid',
                  calculation_status: 'calculated'
                };
              }
            } else if (productType?.toLowerCase() === 'health') {
              const { data: healthGrid } = await supabase
                .from('health_payout_grid')
                .select('commission_rate, reward_rate, bonus_commission_rate')
                .eq('org_id', profile.org_id)
                .eq('product_type', 'Health')
                .eq('provider', policy.provider)
                .or(`plan_name.is.null,plan_name.eq.${policy.plan_name || ''}`)
                .lte('effective_from', new Date().toISOString().split('T')[0])
                .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
                .or(`min_premium.is.null,min_premium.lte.${premium}`)
                .or(`max_premium.is.null,max_premium.gte.${premium}`)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

              if (healthGrid && healthGrid.length > 0) {
                const grid = healthGrid[0];
                gridData = {
                  base_rate: grid.commission_rate || 0,
                  reward_rate: grid.reward_rate || 0,
                  bonus_rate: grid.bonus_commission_rate || 0,
                  grid_matched: true,
                  grid_source: 'health_payout_grid',
                  calculation_status: 'calculated'
                };
              }
            } else if (productType?.toLowerCase() === 'motor') {
              const { data: motorGrid } = await supabase
                .from('motor_payout_grid')
                .select('commission_rate, reward_rate, bonus_commission_rate')
                .eq('org_id', profile.org_id)
                .eq('product_type', 'Motor')
                .eq('provider', policy.provider)
                .lte('effective_from', new Date().toISOString().split('T')[0])
                .or(`effective_to.is.null,effective_to.gte.${new Date().toISOString().split('T')[0]}`)
                .or(`min_premium.is.null,min_premium.lte.${premium}`)
                .or(`max_premium.is.null,max_premium.gte.${premium}`)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

              if (motorGrid && motorGrid.length > 0) {
                const grid = motorGrid[0];
                gridData = {
                  base_rate: grid.commission_rate || 0,
                  reward_rate: grid.reward_rate || 0,
                  bonus_rate: grid.bonus_commission_rate || 0,
                  grid_matched: true,
                  grid_source: 'motor_payout_grid',
                  calculation_status: 'calculated'
                };
              }
            }
          } catch (gridError) {
            console.error('Error fetching grid data for policy:', policy.id, gridError);
          }

          // Calculate commission amounts
          const totalRate = gridData.base_rate + gridData.reward_rate + gridData.bonus_rate;
          const commissionAmount = (premium * gridData.base_rate) / 100;
          const rewardAmount = (premium * gridData.reward_rate) / 100;
          const totalCommission = (premium * totalRate) / 100;
          const insurerCommission = totalCommission;

          // Calculate commission distribution based on business source
          let agentCommission = 0;
          let mispCommission = 0;
          let employeeCommission = 0;
          let reportingEmployeeCommission = 0;
          let brokerShare = 0;

          if (policy.source_type === 'agent' && agentPercentage > 0) {
            // For external agent policies
            agentCommission = (insurerCommission * agentPercentage) / 100;
            reportingEmployeeCommission = insurerCommission - agentCommission; // Remaining goes to reporting employee
            console.log(`Agent policy ${policy.policy_number}: Agent commission: ${agentCommission}, Reporting employee commission: ${reportingEmployeeCommission}`);
          } else if (policy.source_type === 'misp' && mispPercentage > 0) {
            // For external MISP policies
            mispCommission = (insurerCommission * mispPercentage) / 100;
            reportingEmployeeCommission = insurerCommission - mispCommission; // Remaining goes to reporting employee
            console.log(`MISP policy ${policy.policy_number}: MISP commission: ${mispCommission}, Reporting employee commission: ${reportingEmployeeCommission}`);
          } else if (policy.source_type === 'employee') {
            // For internal employee policies - 60% to employee, 40% to broker
            employeeCommission = (insurerCommission * 60) / 100;
            brokerShare = insurerCommission - employeeCommission;
            console.log(`Employee policy ${policy.policy_number}: Employee commission: ${employeeCommission}, Broker share: ${brokerShare}`);
          } else {
            // Direct policies - all to broker
            brokerShare = insurerCommission;
            console.log(`Direct policy ${policy.policy_number}: Broker share: ${brokerShare}`);
          }

          return {
            policy_id: policy.id,
            policy_number: policy.policy_number,
            customer_name: customerName || 'Unknown Customer',
            product_type: productType || 'Unknown',
            product_category: productType || 'Unknown',
            provider: policy.provider || 'Unknown',
            plan_name: policy.plan_name || '',
            gross_premium: premium,
            premium_with_gst: policy.premium_with_gst || 0,
            premium_without_gst: policy.premium_without_gst || 0,
            base_rate: gridData.base_rate,
            reward_rate: gridData.reward_rate,
            bonus_rate: gridData.bonus_rate,
            total_rate: totalRate,
            commission_amount: commissionAmount,
            reward_amount: rewardAmount,
            total_commission: totalCommission,
            insurer_commission: insurerCommission,
            agent_commission: agentCommission,
            misp_commission: mispCommission,
            employee_commission: employeeCommission,
            reporting_employee_commission: reportingEmployeeCommission,
            broker_share: brokerShare,
            source_type: policy.source_type,
            source_name: sourceName,
            source_code: sourceCode,
            reporting_employee_name: reportingEmployeeName,
            reporting_employee_code: reportingEmployeeCode,
            policy_status: policy.policy_status || 'active',
            policy_start_date: policy.start_date || '',
            policy_end_date: policy.end_date || '',
            created_at: policy.created_at,
            grid_matched: gridData.grid_matched,
            grid_source: gridData.grid_source,
            calculation_status: gridData.calculation_status
          };
        })
      );

      setData(enhancedData);
      setTotalRecords(count || 0);
      setCurrentPage(page);

    } catch (err) {
      console.error('Error fetching enhanced policy commission report:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch policy commission data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = [
      'Policy Number',
      'Customer Name',
      'Product Type',
      'Provider',
      'Plan Name',
      'Gross Premium',
      'Premium with GST',
      'Premium without GST',
      'Base Rate (%)',
      'Reward Rate (%)',
      'Bonus Rate (%)',
      'Total Rate (%)',
      'Insurer Commission',
      'Agent Commission',
      'MISP Commission',
      'Employee Commission',
      'Reporting Employee Commission',
      'Broker Share',
      'Source Type',
      'Source Name',
      'Source Code',
      'Reporting Employee Name',
      'Reporting Employee Code',
      'Policy Status',
      'Start Date',
      'End Date',
      'Grid Matched',
      'Grid Source',
      'Calculation Status'
    ];

    const csvData = data.map(record => [
      record.policy_number,
      record.customer_name,
      record.product_type,
      record.provider,
      record.plan_name,
      record.gross_premium.toFixed(2),
      record.premium_with_gst.toFixed(2),
      record.premium_without_gst.toFixed(2),
      record.base_rate.toFixed(2),
      record.reward_rate.toFixed(2),
      record.bonus_rate.toFixed(2),
      record.total_rate.toFixed(2),
      record.insurer_commission.toFixed(2),
      record.agent_commission.toFixed(2),
      record.misp_commission.toFixed(2),
      record.employee_commission.toFixed(2),
      record.reporting_employee_commission.toFixed(2),
      record.broker_share.toFixed(2),
      record.source_type || 'Direct',
      record.source_name,
      record.source_code,
      record.reporting_employee_name || '',
      record.reporting_employee_code || '',
      record.policy_status,
      record.policy_start_date,
      record.policy_end_date,
      record.grid_matched ? 'Yes' : 'No',
      record.grid_source,
      record.calculation_status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `enhanced-policy-commission-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchPolicyCommissions(1);
  }, [filters, profile?.id]);

  return {
    data,
    loading,
    error,
    totalRecords,
    currentPage,
    pageSize,
    fetchPolicyCommissions,
    exportToCSV,
    totals: {
      totalCommission: data.reduce((sum, record) => sum + record.total_commission, 0),
      totalCommissionAmount: data.reduce((sum, record) => sum + record.commission_amount, 0),
      totalRewardAmount: data.reduce((sum, record) => sum + record.reward_amount, 0),
      totalPremium: data.reduce((sum, record) => sum + record.gross_premium, 0),
      gridMatchedCount: data.filter(record => record.grid_matched).length,
      count: data.length
    }
  };
}