import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Heart, Car, Plane, Building, Users, Briefcase, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SelectLOBProps {
  selectedLOB?: string;
  onSelect: (lob: string) => void;
  onNext: () => void;
}

interface LineOfBusiness {
  id: string;
  name: string;
  description: string;
  code: string;
  is_active: boolean;
}

const lobIcons: Record<string, any> = {
  'Health': Heart,
  'Life': Shield,
  'Motor': Car,
  'Travel': Plane,
  'Commercial': Building,
  'Group': Users,
  'Professional': Briefcase,
  'Property': Home,
};

export const SelectLOB: React.FC<SelectLOBProps> = ({ selectedLOB, onSelect, onNext }) => {
  const [lobs, setLobs] = useState<LineOfBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLOBs();
  }, []);

  const fetchLOBs = async () => {
    try {
      const { data, error } = await supabase
        .from('line_of_business')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLobs(data || []);
    } catch (error) {
      console.error('Error fetching LOBs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (lobName: string) => {
    onSelect(lobName);
  };

  const canProceed = !!selectedLOB;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Select Line of Business</h3>
        <p className="text-muted-foreground">
          Choose the type of insurance policy you want to purchase
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lobs.map((lob) => {
          const Icon = lobIcons[lob.name] || Shield;
          const isSelected = selectedLOB === lob.name;

          return (
            <Card
              key={lob.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
              }`}
              onClick={() => handleSelect(lob.name)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Icon className={`w-8 h-8 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  {isSelected && <Badge variant="default">Selected</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg mb-2">{lob.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {lob.description || `${lob.name} insurance products and coverage options`}
                </p>
                {lob.code && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    {lob.code}
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {lobs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Line of Business Available</h3>
            <p className="text-muted-foreground">
              Please contact your administrator to set up insurance lines of business.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="min-w-32"
        >
          Next Step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};