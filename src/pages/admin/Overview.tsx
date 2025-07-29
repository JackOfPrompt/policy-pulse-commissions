import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import { KPICards } from "@/components/admin/KPICards";
import { RenewalsList } from "@/components/admin/RenewalsList";
import { AgentLeaderboard } from "@/components/admin/AgentLeaderboard";
import { BranchPerformanceChart } from "@/components/admin/BranchPerformanceChart";

interface FilterState {
  branchId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  policyType: string | null;
}

const Overview = () => {
  const [filters, setFilters] = useState<FilterState>({
    branchId: null,
    startDate: null,
    endDate: null,
    policyType: null
  });

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your insurance management system performance
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="branches">Branch Performance</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <KPICards filters={filters} />
          
          {/* Renewals Due This Week */}
          <RenewalsList filters={filters} showWeekOnly={true} />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <AgentLeaderboard filters={filters} />
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <BranchPerformanceChart filters={filters} />
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          <RenewalsList filters={filters} showWeekOnly={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Overview;