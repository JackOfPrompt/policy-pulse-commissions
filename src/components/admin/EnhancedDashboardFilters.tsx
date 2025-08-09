// @ts-nocheck
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter } from "lucide-react";
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

interface EnhancedDashboardFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const EnhancedDashboardFilters = ({ filters, onFiltersChange }: EnhancedDashboardFiltersProps) => {
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
        supabase.from('branches').select('id, name').eq('status', 'Active').order('name'),
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

  const setThisMonth = () => {
    const now = new Date();
    onFiltersChange({
      ...filters,
      startDate: startOfMonth(now),
      endDate: endOfMonth(now)
    });
  };

  const setLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    onFiltersChange({
      ...filters,
      startDate: startOfMonth(lastMonth),
      endDate: endOfMonth(lastMonth)
    });
  };

  const setThisYear = () => {
    const now = new Date();
    onFiltersChange({
      ...filters,
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: new Date(now.getFullYear(), 11, 31)
    });
  };

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-background to-muted/10">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Dashboard Filters</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Date Range Quick Filters */}
        <div className="space-y-2">
          <Label>Quick Date Range</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={setThisMonth}>
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={setLastMonth}>
              Last Month
            </Button>
            <Button variant="outline" size="sm" onClick={setThisYear}>
              This Year
            </Button>
          </div>
        </div>

        {/* Line of Business Filter */}
        <div className="space-y-2">
          <Label>Line of Business</Label>
          <Select
            value={filters.lineOfBusiness || "all"}
            onValueChange={(value) => updateFilter('lineOfBusiness', value)}
          >
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Branch</Label>
          <Select
            value={filters.branchId || "all"}
            onValueChange={(value) => updateFilter('branchId', value)}
          >
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Agent</Label>
          <Select
            value={filters.agentId || "all"}
            onValueChange={(value) => updateFilter('agentId', value)}
          >
            <SelectTrigger>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Product Filter */}
        <div className="space-y-2">
          <Label>Product</Label>
          <Select
            value={filters.productId || "all"}
            onValueChange={(value) => updateFilter('productId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Provider Filter */}
        <div className="space-y-2">
          <Label>Insurance Provider</Label>
          <Select
            value={filters.providerId || "all"}
            onValueChange={(value) => updateFilter('providerId', value)}
          >
            <SelectTrigger>
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

        {/* Start Date Filter */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, "PPP") : "Select date"}
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
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, "PPP") : "Select date"}
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
      </div>
      
      {/* Clear Filters Button */}
      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={clearFilters}>
          Clear All Filters
        </Button>
      </div>
    </Card>
  );
};