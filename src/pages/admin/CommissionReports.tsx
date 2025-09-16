import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { EnhancedPolicyCommissionReport } from '@/components/admin/EnhancedPolicyCommissionReport';
import { useEnhancedCommissionReport } from '@/hooks/useEnhancedCommissionReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Calculator, TrendingUp, Users, Building } from "lucide-react";

export default function CommissionReports() {
  const { 
    syncAllCommissions, 
    generateReport, 
    loading, 
    totals,
    getCommissionBreakdown 
  } = useEnhancedCommissionReport();

  const handleSyncCommissions = async () => {
    await syncAllCommissions();
    await generateReport();
  };

  const handleRefreshReports = async () => {
    await generateReport();
  };

  const breakdown = getCommissionBreakdown();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Enhanced Commission Reports</h1>
              <p className="text-muted-foreground">
                View comprehensive commission calculations with base, reward, and bonus breakdowns
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleRefreshReports} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Reports
              </Button>
              <Button onClick={handleSyncCommissions} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Sync All Commissions
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        {breakdown && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakdown.totalPolicies}</div>
                <p className="text-xs text-muted-foreground">
                  Active policies with commissions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Base Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakdown.avgBaseRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average base commission rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Reward Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakdown.avgRewardRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average reward commission rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Bonus Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{breakdown.avgBonusRate.toFixed(2)}%</div>
                <p className="text-xs text-muted-foreground">
                  Average bonus commission rate
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Tabs defaultValue="detailed" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detailed">Detailed Commission Reports</TabsTrigger>
            <TabsTrigger value="analytics">Commission Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="detailed" className="mt-6">
            <EnhancedPolicyCommissionReport />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Rate Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    This section shows detailed analytics about commission rates across different products, providers, and sources.
                  </div>
                  {breakdown && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-green-600">
                          {breakdown.avgBaseRate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average Base Commission</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">
                          {breakdown.avgRewardRate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average Reward Commission</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-purple-600">
                          {breakdown.avgBonusRate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Average Bonus Commission</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}