import { useState } from 'react';
import { CalendarDays, Filter, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AnalyticsFiltersProps {
  filters: {
    dateRange: string;
    granularity: string;
    state?: string;
    branch?: string;
    product?: string[];
    policyType?: string;
    team?: string;
    agent?: string;
    channel?: string;
    customerSegment?: string;
    insurer?: string;
    claimStatus?: string;
    compareMode?: string;
    currency: string;
    gstToggle: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

export const AnalyticsFilters = ({ filters, onFiltersChange }: AnalyticsFiltersProps) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'MTD', label: 'Month to Date' },
    { value: 'QTD', label: 'Quarter to Date' },
    { value: 'YTD', label: 'Year to Date' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const granularityOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'quarter', label: 'Quarterly' },
  ];

  const productOptions = [
    'Motor', 'Health', 'Life', 'Mutual Funds', 'NPS', 'Bonds'
  ];

  const compareOptions = [
    { value: 'none', label: 'No Comparison' },
    { value: 'previous', label: 'vs Previous Period' },
    { value: 'last_year', label: 'vs Same Period Last Year' },
  ];

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'dateRange' || key === 'granularity' || key === 'currency' || key === 'gstToggle') return false;
    return value && (Array.isArray(value) ? value.length > 0 : true);
  }).length;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Analytics Filters
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="gst-toggle">Include GST</Label>
              <Switch
                id="gst-toggle"
                checked={filters.gstToggle}
                onCheckedChange={(checked) => onFiltersChange({ gstToggle: checked })}
              />
            </div>
            <Select value={filters.currency} onValueChange={(value) => onFiltersChange({ currency: value })}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">INR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select value={filters.dateRange} onValueChange={(value) => onFiltersChange({ dateRange: value })}>
              <SelectTrigger>
                <CalendarDays className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Granularity */}
          <div className="space-y-2">
            <Label>Granularity</Label>
            <Select value={filters.granularity} onValueChange={(value) => onFiltersChange({ granularity: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {granularityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Compare Mode */}
          <div className="space-y-2">
            <Label>Compare</Label>
            <Select value={filters.compareMode || 'none'} onValueChange={(value) => onFiltersChange({ compareMode: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {compareOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quick Product Filter */}
          <div className="space-y-2">
            <Label>Products</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {filters.product?.length ? `${filters.product.length} selected` : 'All Products'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  {productOptions.map((product) => (
                    <div key={product} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={product}
                        checked={filters.product?.includes(product) || false}
                        onChange={(e) => {
                          const currentProducts = filters.product || [];
                          if (e.target.checked) {
                            onFiltersChange({ product: [...currentProducts, product] });
                          } else {
                            onFiltersChange({ product: currentProducts.filter(p => p !== product) });
                          }
                        }}
                      />
                      <Label htmlFor={product}>{product}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* More Filters Button */}
          <div className="space-y-2">
            <Label>More Filters</Label>
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-2">{activeFilters}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Select value={filters.state} onValueChange={(value) => onFiltersChange({ state: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All States" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KA">Karnataka</SelectItem>
                        <SelectItem value="TG">Telangana</SelectItem>
                        <SelectItem value="AP">Andhra Pradesh</SelectItem>
                        <SelectItem value="TN">Tamil Nadu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Policy Type</Label>
                    <Select value={filters.policyType} onValueChange={(value) => onFiltersChange({ policyType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select value={filters.channel} onValueChange={(value) => onFiltersChange({ channel: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Customer Segment</Label>
                    <Select value={filters.customerSegment} onValueChange={(value) => onFiltersChange({ customerSegment: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Segments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="sme">SME</SelectItem>
                        <SelectItem value="corporate">Corporate</SelectItem>
                        <SelectItem value="hni">HNI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-between">
                  <Button variant="outline" onClick={() => onFiltersChange({
                    state: undefined,
                    branch: undefined,
                    policyType: undefined,
                    team: undefined,
                    agent: undefined,
                    channel: undefined,
                    customerSegment: undefined,
                    insurer: undefined,
                    claimStatus: undefined,
                  })}>
                    Clear All
                  </Button>
                  <Button onClick={() => setIsFilterOpen(false)}>
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};