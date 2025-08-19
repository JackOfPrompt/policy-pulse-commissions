import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductPerformanceProps {
  filters: any;
  userRole: string;
}

export const ProductPerformance = ({ filters, userRole }: ProductPerformanceProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Performance</CardTitle>
        <CardDescription>Product-wise performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Product performance analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};