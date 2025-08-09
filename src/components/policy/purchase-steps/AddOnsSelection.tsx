import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, ArrowLeft, Plus, Info, Shield, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddOnsSelectionProps {
  lineOfBusiness: string;
  productId: string;
  selectedQuote: any;
  selectedAddOns: AddOn[];
  onAddOnsChange: (addOns: AddOn[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface AddOn {
  id: string;
  name: string;
  description: string;
  premium: number;
  sumInsured?: number;
  category: string;
  popular?: boolean;
  recommended?: boolean;
  exclusions?: string[];
  features?: string[];
}

export const AddOnsSelection: React.FC<AddOnsSelectionProps> = ({
  lineOfBusiness,
  productId,
  selectedQuote,
  selectedAddOns,
  onAddOnsChange,
  onNext,
  onPrevious,
}) => {
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateAddOns();
  }, [lineOfBusiness, selectedQuote]);

  const generateAddOns = async () => {
    setLoading(true);
    try {
      // Generate add-ons based on line of business
      const addOns = getAddOnsByLOB(lineOfBusiness, selectedQuote);
      setAvailableAddOns(addOns);
    } catch (error) {
      console.error('Error generating add-ons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAddOnsByLOB = (lob: string, quote: any): AddOn[] => {
    const basePremium = quote?.premium || 50000;
    
    switch (lob.toLowerCase()) {
      case 'motor':
        return [
          {
            id: 'zero-dep',
            name: 'Zero Depreciation Cover',
            description: 'Get full claim amount without depreciation deduction',
            premium: Math.round(basePremium * 0.15),
            category: 'Protection',
            popular: true,
            features: ['No depreciation on parts', 'Full claim settlement', 'Plastic & metal parts covered'],
            exclusions: ['Glass breakage', 'Consequential damages']
          },
          {
            id: 'engine-protect',
            name: 'Engine Protection Cover',
            description: 'Protection against engine damage due to water ingression',
            premium: Math.round(basePremium * 0.08),
            category: 'Protection',
            recommended: true,
            features: ['Water damage coverage', 'Hydrostatic lock protection', 'Monsoon essential'],
          },
          {
            id: 'roadside-assistance',
            name: '24x7 Roadside Assistance',
            description: 'Emergency assistance anywhere, anytime',
            premium: Math.round(basePremium * 0.05),
            category: 'Convenience',
            features: ['Towing service', 'Battery jumpstart', 'Flat tire assistance', 'Emergency fuel'],
          },
          {
            id: 'consumables',
            name: 'Consumables Cover',
            description: 'Coverage for consumable items like engine oil, brake oil, etc.',
            premium: Math.round(basePremium * 0.12),
            category: 'Protection',
            features: ['Engine oil coverage', 'Brake oil & coolant', 'Nuts, bolts & screws'],
          },
          {
            id: 'key-replacement',
            name: 'Key Replacement Cover',
            description: 'Coverage for lost or damaged car keys',
            premium: Math.round(basePremium * 0.03),
            sumInsured: 5000,
            category: 'Convenience',
            features: ['Lost key replacement', 'Damaged key repair', 'Locksmith charges'],
          }
        ];

      case 'health':
        return [
          {
            id: 'critical-illness',
            name: 'Critical Illness Cover',
            description: 'Lump sum benefit on diagnosis of critical illness',
            premium: Math.round(basePremium * 0.25),
            sumInsured: 1000000,
            category: 'Protection',
            popular: true,
            features: ['25 critical illnesses covered', 'Lump sum benefit', 'Early stage coverage'],
            exclusions: ['Pre-existing conditions', 'Genetic disorders']
          },
          {
            id: 'maternity-cover',
            name: 'Maternity Cover',
            description: 'Coverage for normal & C-section delivery expenses',
            premium: Math.round(basePremium * 0.30),
            sumInsured: 100000,
            category: 'Family',
            recommended: true,
            features: ['Normal delivery', 'C-section delivery', 'Pre & post natal care'],
          },
          {
            id: 'opd-cover',
            name: 'OPD Cover',
            description: 'Outpatient department consultation and medicine expenses',
            premium: Math.round(basePremium * 0.20),
            sumInsured: 25000,
            category: 'Convenience',
            features: ['Doctor consultation', 'Diagnostic tests', 'Pharmacy bills'],
          },
          {
            id: 'personal-accident',
            name: 'Personal Accident Cover',
            description: 'Coverage for accidental death and disability',
            premium: Math.round(basePremium * 0.15),
            sumInsured: 1000000,
            category: 'Protection',
            features: ['Accidental death', 'Permanent disability', 'Temporary disability'],
          }
        ];

      case 'travel':
        return [
          {
            id: 'adventure-sports',
            name: 'Adventure Sports Cover',
            description: 'Coverage for adventure and sports activities',
            premium: Math.round(basePremium * 0.40),
            category: 'Adventure',
            popular: true,
            features: ['Skiing & snowboarding', 'Scuba diving', 'Mountaineering', 'Bungee jumping'],
          },
          {
            id: 'gadget-protection',
            name: 'Gadget Protection',
            description: 'Protection for laptops, cameras, and mobile phones',
            premium: Math.round(basePremium * 0.25),
            sumInsured: 50000,
            category: 'Protection',
            features: ['Theft coverage', 'Damage protection', 'Worldwide coverage'],
          },
          {
            id: 'trip-extension',
            name: 'Trip Extension Cover',
            description: 'Automatic extension if return is delayed',
            premium: Math.round(basePremium * 0.15),
            category: 'Convenience',
            features: ['Up to 7 days extension', 'No additional premium', 'Emergency situations'],
          }
        ];

      case 'life':
        return [
          {
            id: 'accidental-death',
            name: 'Accidental Death Benefit',
            description: 'Additional sum assured in case of accidental death',
            premium: Math.round(basePremium * 0.20),
            sumInsured: quote?.sumInsured || 1000000,
            category: 'Protection',
            popular: true,
            features: ['Double benefit', 'Worldwide coverage', '24x7 protection'],
          },
          {
            id: 'waiver-premium',
            name: 'Waiver of Premium',
            description: 'Premium waiver in case of disability',
            premium: Math.round(basePremium * 0.10),
            category: 'Protection',
            recommended: true,
            features: ['Total disability waiver', 'Policy continues', 'Family protection'],
          },
          {
            id: 'terminal-illness',
            name: 'Terminal Illness Benefit',
            description: 'Early payout on diagnosis of terminal illness',
            premium: Math.round(basePremium * 0.08),
            category: 'Protection',
            features: ['Early benefit payout', 'Medical support', 'Family assistance'],
          }
        ];

      default:
        return [];
    }
  };

  const handleAddOnToggle = (addOn: AddOn, checked: boolean) => {
    if (checked) {
      onAddOnsChange([...selectedAddOns, addOn]);
    } else {
      onAddOnsChange(selectedAddOns.filter(item => item.id !== addOn.id));
    }
  };

  const isAddOnSelected = (addOnId: string) => {
    return selectedAddOns.some(item => item.id === addOnId);
  };

  const getTotalAddOnPremium = () => {
    return selectedAddOns.reduce((total, addOn) => total + addOn.premium, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const groupedAddOns = availableAddOns.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  const renderAddOnCard = (addOn: AddOn) => {
    const isSelected = isAddOnSelected(addOn.id);

    return (
      <Card
        key={addOn.id}
        className={`transition-all ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
        } ${addOn.popular ? 'border-green-200' : ''}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleAddOnToggle(addOn, checked as boolean)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-base">{addOn.name}</CardTitle>
                  {addOn.popular && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Popular</Badge>
                  )}
                  {addOn.recommended && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">Recommended</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{addOn.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{formatCurrency(addOn.premium)}</p>
              {addOn.sumInsured && (
                <p className="text-xs text-muted-foreground">
                  Cover: {formatCurrency(addOn.sumInsured)}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {addOn.features && addOn.features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Features:</p>
              <div className="flex flex-wrap gap-1">
                {addOn.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {addOn.exclusions && addOn.exclusions.length > 0 && (
            <div className="mt-3">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground">
                      <Info className="w-4 h-4 mr-1" />
                      <span className="text-xs">View exclusions</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-medium text-xs mb-1">Exclusions:</p>
                      <ul className="text-xs space-y-1">
                        {addOn.exclusions.map((exclusion, idx) => (
                          <li key={idx}>• {exclusion}</li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse h-10 bg-muted rounded"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Enhance Your Coverage</h3>
        <p className="text-muted-foreground">
          Select optional add-ons to customize your insurance plan
        </p>
      </div>

      {/* Summary */}
      {selectedAddOns.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">
                  Additional Premium: {formatCurrency(getTotalAddOnPremium())}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total: {formatCurrency((selectedQuote?.totalPremium || 0) + getTotalAddOnPremium())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add-ons by Category */}
      {Object.entries(groupedAddOns).map(([category, addOns]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h4 className="text-md font-semibold">{category} Add-ons</h4>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {addOns.map(renderAddOnCard)}
          </div>
        </div>
      ))}

      {availableAddOns.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Add-ons Available</h3>
            <p className="text-muted-foreground">
              No additional coverage options are available for this product.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button onClick={onNext} className="min-w-32">
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};