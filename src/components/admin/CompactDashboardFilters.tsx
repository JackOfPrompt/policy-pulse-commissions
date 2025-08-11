// @ts-nocheck
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, Filter } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
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

interface Branch {
  id: string;
  name: string;
}

interface Agent {
  id: string;
  name: string;
  agent_code: string;
}

interface Product {
  id: string;
  name: string;
}

interface Provider {
  id: string;
  provider_name: string;
}

interface CompactDashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const CompactDashboardFilters = ({ filters, onFiltersChange }: CompactDashboardFiltersProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchFilterData();
    // Set default to current month
    if (!filters.startDate && !filters.endDate) {
      const now = new Date();
      onFiltersChange({
        ...filters,
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      });
    }
  }, []);

  const fetchFilterData = async () => {
    try {
      const [branchesResult, agentsResult, productsResult, providersResult] = await Promise.all([
        supabase.from('branches').select('id:branch_id, name:branch_name').eq('status', 'Active').order('branch_name'),
        supabase.from('agents').select('id, name, agent_code').eq('status', 'Active').order('name'),
        supabase.from('insurance_products').select('id, name').eq('status', 'Active').order('name'),
        supabase.from('insurance_providers').select('id, provider_name').eq('status', 'Active').order('provider_name')
      ]);

      if (branchesResult.data) setBranches(branchesResult.data);
      if (agentsResult.data) setAgents(agentsResult.data);
      if (productsResult.data) setProducts(productsResult.data);
      if (providersResult.data) setProviders(providersResult.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const updateFilter = (key: keyof FilterState, value: any) => {
    const filterValue = value === "all" ? null : value;
    onFiltersChange({ ...filters, [key]: filterValue });
  };

  const clearFilters = () => {
    onFiltersChange({
      branchId: null,
      startDate: null,
      endDate: null,
      policyType: null,
      lineOfBusiness: null,
      agentId: null,
      productId: null,
      providerId: null
    });
  };

  const applyQuickFilter = (type: 'thisMonth' | 'lastMonth' | 'thisYear') => {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (type) {
      case 'thisMonth':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
    }

    onFiltersChange({ ...filters, startDate, endDate });
  };

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Filters</span>
      </div>
      
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Date:</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {filters.startDate ? format(filters.startDate, "MMM dd") : "Start"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.startDate || undefined}
                onSelect={(date) => updateFilter('startDate', date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <span className="text-xs text-muted-foreground">to</span>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "h-8 text-xs",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1 h-3 w-3" />
                {filters.endDate ? format(filters.endDate, "MMM dd") : "End"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.endDate || undefined}
                onSelect={(date) => updateFilter('endDate', date || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Quick date filters */}
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => applyQuickFilter('thisMonth')}>
            This Month
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => applyQuickFilter('lastMonth')}>
            Last Month
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => applyQuickFilter('thisYear')}>
            This Year
          </Button>
        </div>

        {/* LOB Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">LOB:</Label>
          <Select
            value={filters.lineOfBusiness || "all"}
            onValueChange={(value) => updateFilter('lineOfBusiness', value)}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="All LOB" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              <SelectItem value="Motor">Motor</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Life">Life</SelectItem>
              <SelectItem value="Travel">Travel</SelectItem>
              <SelectItem value="Commercial">Commercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Branch Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Branch:</Label>
          <Select
            value={filters.branchId || "all"}
            onValueChange={(value) => updateFilter('branchId', value)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Agent:</Label>
          <Select
            value={filters.agentId || "all"}
            onValueChange={(value) => updateFilter('agentId', value)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name} ({agent.agent_code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Filter */}
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Provider:</Label>
          <Select
            value={filters.providerId || "all"}
            onValueChange={(value) => updateFilter('providerId', value)}
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All Providers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {providers.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.provider_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};