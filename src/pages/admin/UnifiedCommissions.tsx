import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { LifePayoutGridManagement } from '@/components/admin/LifePayoutGridManagement';
import { HealthPayoutGridManagement } from '@/components/admin/HealthPayoutGridManagement';
import { MotorPayoutGridManagement } from '@/components/admin/MotorPayoutGridManagement';

export default function UnifiedCommissions() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Commission Management</h1>
            <p className="text-muted-foreground">
              Manage commission grids for Life, Health, and Motor insurance products
            </p>
          </div>
        </div>

        <Tabs defaultValue="life" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="life">Life Insurance</TabsTrigger>
            <TabsTrigger value="health">Health Insurance</TabsTrigger>
            <TabsTrigger value="motor">Motor Insurance</TabsTrigger>
          </TabsList>

          <TabsContent value="life" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Life Insurance Commission Grid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LifePayoutGridManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Health Insurance Commission Grid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HealthPayoutGridManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="motor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Motor Insurance Commission Grid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MotorPayoutGridManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}