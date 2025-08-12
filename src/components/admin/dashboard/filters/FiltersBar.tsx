import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export interface FilterState {
  tenantId?: string;
  lob?: string;
  policyType?: string;
  dateRange?: DateRange;
  geography?: string;
  integrationSource?: string;
}

export interface FiltersBarProps {
  tenants: { tenant_id: string; tenant_name: string }[];
  value: FilterState;
  onChange: (next: FilterState) => void;
}

export default function FiltersBar({ tenants, value, onChange }: FiltersBarProps) {
  return (
    <section aria-label="Filters" className="rounded-lg border p-3">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium">
        <Filter className="h-4 w-4" /> Filters
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Tenant */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tenant</label>
          <Select
            value={value.tenantId || "all"}
            onValueChange={(v) => onChange({ ...value, tenantId: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tenants</SelectItem>
              {tenants.map((t) => (
                <SelectItem key={t.tenant_id} value={t.tenant_id}>
                  {t.tenant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* LOB */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Line of Business</label>
          <Select
            value={value.lob || "all"}
            onValueChange={(v) => onChange({ ...value, lob: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All LOBs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All LOBs</SelectItem>
              <SelectItem value="Life">Life</SelectItem>
              <SelectItem value="Health">Health</SelectItem>
              <SelectItem value="Motor">Motor</SelectItem>
              <SelectItem value="Crop">Crop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Policy Type */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Policy Type</label>
          <Select
            value={value.policyType || "all"}
            onValueChange={(v) => onChange({ ...value, policyType: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All policy types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="new_business">New Business</SelectItem>
              <SelectItem value="renewal">Renewal</SelectItem>
              <SelectItem value="rollover">Rollover</SelectItem>
              <SelectItem value="portability">Portability</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Date Range</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !value.dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value.dateRange?.from && value.dateRange?.to
                  ? `${value.dateRange.from.toLocaleDateString()} - ${value.dateRange.to.toLocaleDateString()}`
                  : "Pick a date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={value.dateRange}
                onSelect={(range) => onChange({ ...value, dateRange: range })}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Geography */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Geography</label>
          <Select
            value={value.geography || "all"}
            onValueChange={(v) => onChange({ ...value, geography: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All geographies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All geographies</SelectItem>
              <SelectItem value="IN">India</SelectItem>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="EU">Europe</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Integration Source */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Integration Source</label>
          <Select
            value={value.integrationSource || "all"}
            onValueChange={(v) => onChange({ ...value, integrationSource: v === "all" ? undefined : v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="portal">Portal Upload</SelectItem>
              <SelectItem value="bulk">Bulk Import</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
