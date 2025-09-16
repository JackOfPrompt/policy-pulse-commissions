import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { CommissionTiersManagement } from '@/components/admin/CommissionTiersManagement';

export default function CommissionTiers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Commission Tiers</h1>
          <p className="text-muted-foreground">
            Manage commission percentage tiers for agents and MISPs
          </p>
        </div>
        
        <CommissionTiersManagement />
      </div>
    </AdminLayout>
  );
}