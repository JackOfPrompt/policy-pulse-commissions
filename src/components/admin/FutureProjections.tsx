// @ts-nocheck
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  RotateCcw, 
  Target, 
  BarChart3, 
  Info,
  Calendar,
  Calculator
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
  lineOfBusiness: string | null;
  agentId: string | null;
  productId: string | null;
  providerId: string | null;
}

interface FutureProjectionsProps {
  filters: FilterState;
}

interface ProjectionData {
  expectedPremiumNextMonth: number;
  projectedCommission: number;
  expectedRenewals: number;
  historicalRenewalRate: number;
}

interface QuarterlyProjection {
  quarter: string;
  Motor: number;
  Health: number;
  Life: number;
  Travel: number;
  Commercial: number;
}

interface FunnelProjection {
  name: string;
  value: number;
  fill: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8'];
const SEASONAL_FACTORS = {
  1: 0.9,  // January
  2: 0.95, // February  
  3: 1.2,  // March (peak)
  4: 1.1,  // April
  5: 1.0,  // May
  6: 0.9,  // June
  7: 0.85, // July
  8: 0.9,  // August
  9: 1.05, // September
  10: 1.3, // October (peak)
  11: 1.1, // November
  12: 1.0  // December
};

export const FutureProjections = ({ filters }: FutureProjectionsProps) => {
  const [projectionData, setProjectionData] = useState<ProjectionData>({
    expectedPremiumNextMonth: 0,
    projectedCommission: 0,
    expectedRenewals: 0,
    historicalRenewalRate: 0
  });
  const [quarterlyProjections, setQuarterlyProjections] = useState<QuarterlyProjection[]>([]);
  const [conversionForecast, setConversionForecast] = useState<FunnelProjection[]>([]);
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectionData();
  }, [filters, viewMode]);

  const fetchProjectionData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPremiumProjections(),
        fetchRenewalProjections(),
        fetchQuarterlyProjections(),
        fetchConversionForecast()
      ]);
    } catch (error) {
      console.error('Error fetching projection data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPremiumProjections = async () => {
    try {
      // Get last 12 months of premium data
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      let query = supabase.from('policies_new')
        .select('premium_amount, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString());

      if (filters.branchId) query = query.eq('branch_id', filters.branchId);
      if (filters.lineOfBusiness) query = query.eq('line_of_business', filters.lineOfBusiness);

      const { data: policies } = await query;

      // Calculate monthly averages
      const monthlyPremiums: { [key: string]: number } = {};
      policies?.forEach(policy => {
        const month = new Date(policy.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'numeric' });
        monthlyPremiums[month] = (monthlyPremiums[month] || 0) + (policy.premium_amount || 0);
      });

      const averageMonthlyPremium = Object.values(monthlyPremiums).reduce((sum, val) => sum + val, 0) / Math.max(Object.keys(monthlyPremiums).length, 1);
      
      // Apply seasonal factor
      const nextMonth = new Date().getMonth() + 1;
      const seasonalFactor = SEASONAL_FACTORS[nextMonth as keyof typeof SEASONAL_FACTORS] || 1;
      const expectedPremiumNextMonth = averageMonthlyPremium * seasonalFactor;

      // Get average commission rate
      const { data: commissionRules } = await supabase
        .from('commission_rules')
        .select('first_year_rate')
        .eq('is_active', true);

      const avgCommissionRate = commissionRules?.reduce((sum, rule) => sum + (rule.first_year_rate || 0), 0) / Math.max(commissionRules?.length || 1, 1) / 100;
      const projectedCommission = expectedPremiumNextMonth * avgCommissionRate;

      setProjectionData(prev => ({
        ...prev,
        expectedPremiumNextMonth,
        projectedCommission
      }));
    } catch (error) {
      console.error('Error fetching premium projections:', error);
    }
  };

  const fetchRenewalProjections = async () => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthEnd = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);

      // Get policies expiring next month
      let renewalQuery = supabase.from('policies_new')
        .select('*')
        .gte('policy_end_date', nextMonth.toISOString().split('T')[0])
        .lte('policy_end_date', nextMonthEnd.toISOString().split('T')[0]);

      if (filters.branchId) renewalQuery = renewalQuery.eq('branch_id', filters.branchId);

      const { data: expiringPolicies } = await renewalQuery;

      // Calculate historical renewal rate
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      const { data: historicalRenewals } = await supabase
        .from('policy_renewals')
        .select('*')
        .gte('created_at', lastYear.toISOString());

      const totalExpiredLastYear = historicalRenewals?.length || 0;
      const renewedCount = historicalRenewals?.filter(r => r.renewal_status === 'Renewed').length || 0;
      const historicalRenewalRate = totalExpiredLastYear > 0 ? (renewedCount / totalExpiredLastYear) * 100 : 75; // Default 75%

      const expectedRenewals = Math.round((expiringPolicies?.length || 0) * (historicalRenewalRate / 100));

      setProjectionData(prev => ({
        ...prev,
        expectedRenewals,
        historicalRenewalRate
      }));
    } catch (error) {
      console.error('Error fetching renewal projections:', error);
    }
  };

  const fetchQuarterlyProjections = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      
      // Get historical data for trend analysis
      const { data: historicalData } = await supabase
        .from('policies_with_details')
        .select('line_of_business, premium_amount, created_at')
        .gte('created_at', `${currentYear - 1}-01-01`);

      const projections: QuarterlyProjection[] = quarters.map(quarter => {
        // Simple projection based on historical averages with growth factor
        const baseProjection = {
          quarter,
          Motor: Math.round(Math.random() * 500000 + 300000), // Mock data - replace with actual calculation
          Health: Math.round(Math.random() * 400000 + 250000),
          Life: Math.round(Math.random() * 300000 + 200000),
          Travel: Math.round(Math.random() * 150000 + 100000),
          Commercial: Math.round(Math.random() * 200000 + 150000)
        };
        return baseProjection;
      });

      setQuarterlyProjections(projections);
    } catch (error) {
      console.error('Error fetching quarterly projections:', error);
    }
  };

  const fetchConversionForecast = async () => {
    try {
      // Get current open leads using correct status values
      let leadQuery = supabase.from('leads')
        .select('lead_status')
        .in('lead_status', ['New', 'Contacted', 'In Progress']);

      if (filters.branchId) leadQuery = leadQuery.eq('branch_id', filters.branchId);

      const { data: openLeads } = await leadQuery;

      // Historical conversion rates (mock data - replace with actual calculation)
      const conversionRates = {
        'New': 0.8,         // 80% get contacted
        'Contacted': 0.6,   // 60% become in progress  
        'In Progress': 0.25 // 25% convert
      };

      const statusCounts = {
        'New': 0,
        'Contacted': 0,
        'In Progress': 0
      };

      openLeads?.forEach(lead => {
        if (statusCounts.hasOwnProperty(lead.lead_status)) {
          statusCounts[lead.lead_status as keyof typeof statusCounts]++;
        }
      });

      const totalLeads = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      const expectedContacted = Math.round(statusCounts.New * conversionRates.New + statusCounts.Contacted + statusCounts['In Progress']);
      const expectedProgress = Math.round((statusCounts.New * conversionRates.New + statusCounts.Contacted) * conversionRates.Contacted + statusCounts['In Progress']);
      const expectedConversions = Math.round(statusCounts['In Progress'] * conversionRates['In Progress']);

      const funnelData: FunnelProjection[] = [
        { 
          name: 'Open Leads', 
          value: totalLeads, 
          fill: COLORS[0] 
        },
        { 
          name: 'Will be Contacted', 
          value: expectedContacted, 
          fill: COLORS[1] 
        },
        { 
          name: 'Expected Progress', 
          value: expectedProgress, 
          fill: COLORS[2] 
        },
        { 
          name: 'Expected Conversions', 
          value: expectedConversions, 
          fill: COLORS[3] 
        }
      ];

      setConversionForecast(funnelData);
    } catch (error) {
      console.error('Error fetching conversion forecast:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const projectionCards = [
    {
      title: "Expected Premium Next Month",
      value: loading ? "..." : formatCurrency(projectionData.expectedPremiumNextMonth),
      icon: TrendingUp,
      color: "primary",
      tooltip: "Projected based on premium trends and seasonal factors"
    },
    {
      title: "Projected Commission Earnings",
      value: loading ? "..." : formatCurrency(projectionData.projectedCommission),
      icon: DollarSign,
      color: "success",
      tooltip: "Formula: Forecasted Premium × Average Commission Rate"
    },
    {
      title: "Expected Renewals Next Month",
      value: loading ? "..." : `${projectionData.expectedRenewals} (${projectionData.historicalRenewalRate.toFixed(1)}% rate)`,
      icon: RotateCcw,
      color: "accent",
      tooltip: "Projected based on expiring policies and renewal trends"
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-background via-muted/10 to-muted/20 border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6 text-primary" />
            📊 Future Business Projections
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('quarterly')}
            >
              Quarterly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projectionCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <TooltipProvider key={card.title}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Card className="bg-gradient-to-br from-card to-muted/10 hover:shadow-lg transition-all cursor-help">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          {card.title}
                          <Info className="h-3 w-3" />
                        </CardTitle>
                        <IconComponent className="h-5 w-5 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-lg font-bold text-foreground">{card.value}</div>
                        <Badge variant="outline" className="mt-2 text-xs">
                          Projection
                        </Badge>
                      </CardContent>
                    </Card>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{card.tooltip}</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            );
          })}
        </div>

        {/* Charts */}
        <Tabs value={viewMode === 'monthly' ? 'forecast' : 'quarterly'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="forecast">Lead Conversion Forecast</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly LOB Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Lead Conversion Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <FunnelChart>
                    <Tooltip />
                    <Funnel
                      dataKey="value"
                      data={conversionForecast}
                      isAnimationActive
                    >
                      <LabelList position="center" fill="#fff" stroke="none" />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quarterly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quarterly Business Projection by Line of Business
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyProjections}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                    <Legend />
                    <Bar dataKey="Motor" fill={COLORS[0]} name="Motor" />
                    <Bar dataKey="Health" fill={COLORS[1]} name="Health" />
                    <Bar dataKey="Life" fill={COLORS[2]} name="Life" />
                    <Bar dataKey="Travel" fill={COLORS[3]} name="Travel" />
                    <Bar dataKey="Commercial" fill={COLORS[4]} name="Commercial" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-muted/30 rounded-lg border border-muted">
          <p className="text-sm text-muted-foreground italic">
            <Info className="h-4 w-4 inline mr-2" />
            These projections are based on historical trends and are indicative only. Actual performance may vary.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};