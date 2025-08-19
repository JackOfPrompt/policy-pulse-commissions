import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Filter, Calendar as CalendarIcon, TrendingUp, DollarSign, Users, FileText, RefreshCw } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PolicyReportsProps {
  tenantId: string;
}

interface ReportData {
  report_type: string;
  data: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))', 'hsl(var(--warning))'];

export const PolicyReports: React.FC<PolicyReportsProps> = ({ tenantId }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('revenue');
  const [reportData, setReportData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    productId: 'all',
    agentId: 'all',
    branchId: 'all',
    policyType: 'all',
    channelType: 'all'
  });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  const handleDateRangeChange = (range: any) => {
    setDateRange({
      from: range?.from,
      to: range?.to
    });
  };

  const tabs = [
    { key: 'revenue', label: 'Revenue (GWP)', icon: DollarSign },
    { key: 'commission', label: 'Commission', icon: TrendingUp },
    { key: 'renewals', label: 'Renewals', icon: RefreshCw },
    { key: 'payouts', label: 'Payouts', icon: Users },
    { key: 'settlements', label: 'Settlements', icon: FileText },
    { key: 'overview', label: 'Overview', icon: BarChart }
  ];

  const fetchReportData = async (reportType: string) => {
    if (reportData[reportType]) return; // Already loaded

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('policy-reports', {
        body: {
          report_type: reportType,
          tenant_id: tenantId,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          filters
        }
      });

      if (error) throw error;

      setReportData(prev => ({
        ...prev,
        [reportType]: data?.data || []
      }));
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType: string, format: 'csv' | 'excel' | 'pdf') => {
    try {
      const { data, error } = await supabase.functions.invoke('policy-reports', {
        body: {
          report_type: reportType,
          tenant_id: tenantId,
          export: format,
          from_date: filters.fromDate,
          to_date: filters.toDate,
          filters
        }
      });

      if (error) throw error;

      // Create download link
      const blob = new Blob([data], { 
        type: format === 'csv' ? 'text/csv' : 
              format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'application/pdf' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${format.toUpperCase()} report downloaded successfully`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };

  const refreshData = () => {
    setReportData({});
    fetchReportData(activeTab);
  };

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab, tenantId]);

  const renderChart = (data: any[], type: string) => {
    if (!data || data.length === 0) return null;

    switch (type) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="product_name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue_amount" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'commission':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="commission_amount"
                label={({ name }) => name}
              >
                {data.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'renewals':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.slice(0, 12)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="renewal_count" stroke="hsl(var(--primary))" />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={Object.keys(data[0])[1]} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={Object.keys(data[0])[2]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  const renderTable = (data: any[], type: string) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available for this report
        </div>
      );
    }

    const columns = Object.keys(data[0]);

    return (
      <div className="overflow-auto max-h-96">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap">
                  {column.replace(/_/g, ' ').toUpperCase()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.slice(0, 50).map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column} className="whitespace-nowrap">
                    {typeof row[column] === 'number' && column.includes('amount') 
                      ? `₹${row[column].toLocaleString()}`
                      : row[column]?.toString() || '-'
                    }
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const updateFiltersFromDateRange = () => {
    if (dateRange.from && dateRange.to) {
      setFilters(prev => ({
        ...prev,
        fromDate: format(dateRange.from!, 'yyyy-MM-dd'),
        toDate: format(dateRange.to!, 'yyyy-MM-dd')
      }));
    }
  };

  useEffect(() => {
    updateFiltersFromDateRange();
  }, [dateRange]);

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Filters
          </CardTitle>
          <CardDescription>
            Configure filters to generate customized reports with export options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={handleDateRangeChange}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Product Filter */}
            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={filters.productId} onValueChange={(value) => setFilters(prev => ({ ...prev, productId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="life">Life Insurance</SelectItem>
                  <SelectItem value="health">Health Insurance</SelectItem>
                  <SelectItem value="motor">Motor Insurance</SelectItem>
                  <SelectItem value="travel">Travel Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={filters.branchId} onValueChange={(value) => setFilters(prev => ({ ...prev, branchId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="mumbai">Mumbai</SelectItem>
                  <SelectItem value="delhi">Delhi</SelectItem>
                  <SelectItem value="bangalore">Bangalore</SelectItem>
                  <SelectItem value="chennai">Chennai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agent Filter */}
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={filters.agentId} onValueChange={(value) => setFilters(prev => ({ ...prev, agentId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  <SelectItem value="posp">POSP Agents</SelectItem>
                  <SelectItem value="misp">MISP Agents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Policy Type Filter */}
            <div className="space-y-2">
              <Label>Policy Type</Label>
              <Select value={filters.policyType} onValueChange={(value) => setFilters(prev => ({ ...prev, policyType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Policy Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Policy Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Channel Type Filter */}
            <div className="space-y-2">
              <Label>Channel Type</Label>
              <Select value={filters.channelType} onValueChange={(value) => setFilters(prev => ({ ...prev, channelType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                  <SelectItem value="bancassurance">Bancassurance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Label className="invisible">Actions</Label>
              <div className="flex gap-2">
                <Button onClick={refreshData} disabled={loading} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {loading ? 'Loading...' : 'Generate'}
                </Button>
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-2">
              <Label className="invisible">Export</Label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(activeTab, 'csv')}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(activeTab, 'excel')}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(activeTab, 'pdf')}
                  className="flex-1"
                >
                  <Download className="w-3 h-3 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.key} value={tab.key} className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <tab.icon className="w-5 h-5 mr-2" />
                      {tab.label} Report
                    </CardTitle>
                    <CardDescription>
                      {tab.key === 'revenue' && 'Gross Written Premium and revenue analytics'}
                      {tab.key === 'commission' && 'Commission distribution and earnings'}
                      {tab.key === 'renewals' && 'Policy renewal trends and performance'}
                      {tab.key === 'payouts' && 'Agent and broker payout tracking'}
                      {tab.key === 'settlements' && 'Claim settlement analytics'}
                      {tab.key === 'overview' && 'Comprehensive performance overview'}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(tab.key, 'csv')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(tab.key, 'excel')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(tab.key, 'pdf')}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Visualization</h3>
                    <div className="border rounded-lg p-4">
                      {loading ? (
                        <div className="h-[300px] flex items-center justify-center">
                          <div className="text-muted-foreground">Loading chart...</div>
                        </div>
                      ) : (
                        renderChart(reportData[tab.key] || [], tab.key)
                      )}
                    </div>
                  </div>

                  {/* Table */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Data Table</h3>
                    <div className="border rounded-lg">
                      {loading ? (
                        <div className="h-[300px] flex items-center justify-center">
                          <div className="text-muted-foreground">Loading data...</div>
                        </div>
                      ) : (
                        renderTable(reportData[tab.key] || [], tab.key)
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};