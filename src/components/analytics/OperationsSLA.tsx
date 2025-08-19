import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface OperationsSLAProps {
  filters: any;
  userRole: string;
}

export const OperationsSLA = ({ filters, userRole }: OperationsSLAProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Operations & SLA</CardTitle>
        <CardDescription>Operational efficiency and SLA metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Operations analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};