import React from 'react';
import { OnlinePolicyPurchase } from '@/components/policy/OnlinePolicyPurchase';
import { useSimpleAuth } from '@/components/auth/SimpleAuthContext';

export default function AgentPolicyPurchase() {
  const { user } = useSimpleAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Please log in to access policy purchase.</p>
        </div>
      </div>
    );
  }

  const context = {
    initiatedByRole: 'agent' as const,
    initiatedById: user.id,
    canSelectOnBehalf: true, // Agents can create policies on behalf of customers
  };

  return (
    <div className="container mx-auto p-6">
      <OnlinePolicyPurchase context={context} />
    </div>
  );
}