import React from 'react';
import { OnlinePolicyPurchase } from '@/components/policy/OnlinePolicyPurchase';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';

export default function ManualPurchase() {
  const { user } = useSimpleAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access manual policy purchase.</p>
        </div>
      </div>
    );
  }

  const context = {
    initiatedByRole: 'admin' as const,
    initiatedById: user.id,
    canSelectOnBehalf: true, // Admin can create policies on behalf of anyone
  };

  return (
    <div className="container mx-auto p-6">
      <OnlinePolicyPurchase context={context} />
    </div>
  );
}