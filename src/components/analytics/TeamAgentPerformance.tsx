import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TeamAgentPerformanceProps {
  filters: any;
  userRole: string;
}

export const TeamAgentPerformance = ({ filters, userRole }: TeamAgentPerformanceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team & Agent Performance</CardTitle>
        <CardDescription>Individual and team performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Team performance analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};