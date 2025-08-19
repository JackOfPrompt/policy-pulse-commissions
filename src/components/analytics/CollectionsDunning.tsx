import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CollectionsDunningProps {
  filters: any;
  userRole: string;
}

export const CollectionsDunning = ({ filters, userRole }: CollectionsDunningProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Collections & Dunning</CardTitle>
        <CardDescription>Payment collection and follow-up analytics</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Collections analytics coming soon...</p>
      </CardContent>
    </Card>
  );
};