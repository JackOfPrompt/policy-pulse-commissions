import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BranchGeographyProps {
  filters: any;
  userRole: string;
}

export const BranchGeography = ({ filters, userRole }: BranchGeographyProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Branch & Geography</CardTitle>
        <CardDescription>Geographic performance analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Geographic analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};