import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancePnLProps {
  filters: any;
  userRole: string;
}

export const FinancePnL = ({ filters, userRole }: FinancePnLProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance & P&L</CardTitle>
        <CardDescription>Financial performance and profit/loss analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Financial analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};