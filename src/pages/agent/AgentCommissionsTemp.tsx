import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

function AgentCommissions() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Commissions</h1>
          <p className="text-muted-foreground">
            View your commission history and earnings
          </p>
        </div>
        
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              Agent commission system temporarily disabled while database types are being regenerated.
            </p>
            <p className="text-sm text-muted-foreground">
              Your commission data will be available once the database schema is synchronized.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentCommissions;