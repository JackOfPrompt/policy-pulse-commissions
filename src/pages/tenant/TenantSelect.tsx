import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TenantSelect = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Choose Your Tenant | Abiraksha Insuretech</title>
        <meta name="description" content="Search your brokerage company to continue to your tenant-branded dashboard." />
        <link rel="canonical" href={`${window.location.origin}/tenant-select`} />
      </Helmet>
      <div className="container mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>Select Your Company</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Enter company name or code" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button onClick={() => navigate('/auth')}>Search</Button>
            </div>
            <p className="text-sm text-muted-foreground">Tip: Once set up with a custom subdomain, you can access your dashboard directly at yourcompany.abiraksha.com</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantSelect;
