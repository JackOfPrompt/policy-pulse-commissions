import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar, Search, Filter, X } from "lucide-react";
import { PolicyCommissionFilters } from "@/hooks/usePolicyCommissionReport";

interface PolicyCommissionFiltersProps {
  filters: PolicyCommissionFilters;
  onFiltersChange: (filters: PolicyCommissionFilters) => void;
  onExport: () => void;
  loading?: boolean;
}

export function PolicyCommissionFiltersComponent({
  filters,
  onFiltersChange,
  onExport,
  loading = false
}: PolicyCommissionFiltersProps) {
  const [localFilters, setLocalFilters] = useState<PolicyCommissionFilters>(filters);

  const updateFilter = (key: keyof PolicyCommissionFilters, value: string | undefined) => {
    const normalized = value === 'all' || value === '' ? undefined : value;
    const newFilters = { ...localFilters, [key]: normalized };
    setLocalFilters(newFilters);
  };
  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: PolicyCommissionFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value && value !== '');

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters & Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Policy number, customer name..."
                value={localFilters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Product Type */}
          <div className="space-y-2">
            <Label>Product Type</Label>
            <Select
              value={localFilters.productType || undefined}
              onValueChange={(value) => updateFilter('productType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="motor">Motor</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="life">Life</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Type */}
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={localFilters.sourceType || undefined}
              onValueChange={(value) => updateFilter('sourceType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="misp">MISP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Policy Status */}
          <div className="space-y-2">
            <Label>Policy Status</Label>
            <Select
              value={localFilters.policyStatus || undefined}
              onValueChange={(value) => updateFilter('policyStatus', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="bound">Bound</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date From */}
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Start Date From</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateFrom"
                type="date"
                value={localFilters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label htmlFor="dateTo">Start Date To</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="dateTo"
                type="date"
                value={localFilters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select
              value={localFilters.provider || undefined}
              onValueChange={(value) => updateFilter('provider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Providers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="HDFC Life">HDFC Life</SelectItem>
                <SelectItem value="ICICI Lombard">ICICI Lombard</SelectItem>
                <SelectItem value="Bajaj Allianz">Bajaj Allianz</SelectItem>
                <SelectItem value="Star Health">Star Health</SelectItem>
                <SelectItem value="New India Assurance">New India Assurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={applyFilters} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
          
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
          
          <div className="ml-auto">
            <Button variant="outline" onClick={onExport} disabled={loading}>
              Export CSV
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}