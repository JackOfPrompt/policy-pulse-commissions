import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Search, Shield, Car, Heart, Home, Phone, MessageCircle, Download, Check, X, Plus } from "lucide-react";
import BreadcrumbNav from "@/components/ui/breadcrumb-nav";
import useProviders from "@/hooks/useProviders";
import { Skeleton } from "@/components/ui/skeleton";

// Enhanced plans data with more details
const mockPlans = {
  icici: [
    {
      id: "optima",
      name: "ICICI Optima",
      category: "Health Insurance",
      coverageSummary: [
        "Cashless hospitalization",
        "Pre & post hospitalization cover",
        "No-claim bonus up to 50%"
      ],
      sumAssured: "₹5L – ₹25L",
      premiumRange: "₹12,000 – ₹15,000",
      tenure: "1-3 Years",
      icon: () => <Heart className="w-6 h-6" />,
      details: {
        premium: "₹12,000",
        coverage: "₹5 Lakh",
        tenure: "1 Year",
        hospitalCash: true,
        noClaim: "10%",
        cashlessHospitals: "5,000+",
        personalAccident: "Included",
        criticalIllness: "Optional",
        roadsideAssistance: "Optional",
        zeroDepreciation: "Optional",
        claimRatio: "94%",
        healthCheckup: false,
        features: {
          "Cashless Hospitalization": true,
          "Pre & Post Hospitalization": true,
          "Day Care Procedures": true,
          "Ambulance Cover": true,
          "Room Rent Limit": "1% of Sum Insured",
          "Co-payment": "10%",
          "Maternity Cover": false,
          "Alternative Medicine": true
        }
      }
    },
    {
      id: "plus",
      name: "ICICI Plus",
      category: "Health Insurance",
      coverageSummary: [
        "Enhanced health coverage",
        "Maternity benefits included",
        "No-claim bonus up to 100%"
      ],
      sumAssured: "₹10L – ₹50L",
      premiumRange: "₹14,500 – ₹18,000",
      tenure: "1-3 Years",
      icon: () => <Heart className="w-6 h-6" />,
      details: {
        premium: "₹14,500",
        coverage: "₹10 Lakh",
        tenure: "1 Year",
        hospitalCash: true,
        noClaim: "20%",
        cashlessHospitals: "7,500+",
        personalAccident: "Included",
        criticalIllness: "Included",
        roadsideAssistance: "Optional",
        zeroDepreciation: "Included",
        claimRatio: "96%",
        healthCheckup: true,
        features: {
          "Cashless Hospitalization": true,
          "Pre & Post Hospitalization": true,
          "Day Care Procedures": true,
          "Ambulance Cover": true,
          "Room Rent Limit": "2% of Sum Insured",
          "Co-payment": "5%",
          "Maternity Cover": true,
          "Alternative Medicine": true
        }
      }
    },
    {
      id: "premium",
      name: "ICICI Premium",
      category: "Health Insurance",
      coverageSummary: [
        "Comprehensive coverage",
        "All benefits included",
        "Zero co-payment"
      ],
      sumAssured: "₹15L – ₹1Cr",
      premiumRange: "₹18,000 – ₹25,000",
      tenure: "1-3 Years",
      icon: () => <Heart className="w-6 h-6" />,
      details: {
        premium: "₹18,000",
        coverage: "₹15 Lakh",
        tenure: "1/3 Years",
        hospitalCash: true,
        noClaim: "25%",
        cashlessHospitals: "10,000+",
        personalAccident: "Included",
        criticalIllness: "Included",
        roadsideAssistance: "Included",
        zeroDepreciation: "Included",
        claimRatio: "98%",
        healthCheckup: true,
        features: {
          "Cashless Hospitalization": true,
          "Pre & Post Hospitalization": true,
          "Day Care Procedures": true,
          "Ambulance Cover": true,
          "Room Rent Limit": "No Limit",
          "Co-payment": "0%",
          "Maternity Cover": true,
          "Alternative Medicine": true
        }
      }
    }
  ]
};

// Add-ons data
const addOns = [
  {
    id: "roadside",
    name: "Roadside Assistance",
    description: "24/7 breakdown support anywhere in India",
    price: 500,
    category: "Support"
  },
  {
    id: "personal-accident",
    name: "Personal Accident Cover",
    description: "Additional protection against accidents",
    price: 750,
    category: "Protection"
  },
  {
    id: "critical-illness",
    name: "Critical Illness Cover",
    description: "Coverage for major illnesses",
    price: 1200,
    category: "Health"
  },
  {
    id: "zero-depreciation",
    name: "Zero Depreciation",
    description: "Full coverage without depreciation",
    price: 800,
    category: "Motor"
  }
];

const PlanComparison = () => {
  const [searchParams] = useSearchParams();
  const { providers, loading: providersLoading } = useProviders();
  const [selectedProvider, setSelectedProvider] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'provider' | 'plan' | 'comparison' | 'addons' | 'summary'>('provider');

  useEffect(() => {
    const providerParam = searchParams.get('provider');
    if (providerParam) {
      setSelectedProvider(providerParam);
      setCurrentStep('plan');
    }
  }, [searchParams]);

  const currentProvider = providers.find(p => p.provider_code === selectedProvider);
  const availablePlans = selectedProvider ? mockPlans[selectedProvider as keyof typeof mockPlans] || [] : [];

  const addToCompare = (plan: any) => {
    if (selectedPlans.length < 3 && !selectedPlans.find(p => p.id === plan.id)) {
      setSelectedPlans([...selectedPlans, plan]);
    }
  };

  const removeFromCompare = (planId: string) => {
    setSelectedPlans(selectedPlans.filter(p => p.id !== planId));
  };

  const selectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setCurrentStep('addons');
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const calculateTotalPremium = () => {
    const basePremium = selectedPlan ? parseInt(selectedPlan.details.premium.replace(/[₹,]/g, '')) : 0;
    const addOnsCost = selectedAddOns.reduce((total, addOnId) => {
      const addOn = addOns.find(a => a.id === addOnId);
      return total + (addOn ? addOn.price : 0);
    }, 0);
    return basePremium + addOnsCost;
  };

  const getBreadcrumbItems = () => {
    const items = [
      { label: "Insurance Providers" }
    ];
    
    if (selectedProvider) {
      items.push({ label: currentProvider?.trade_name || currentProvider?.provider_name || "Select Provider" });
    }
    
    if (selectedPlan) {
      items.push({ label: selectedPlan.name });
      items.push({ label: "Features & Add-ons" });
    }
    
    return items;
  };

  const renderComparisonValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />;
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto container-padding section-padding">
        <BreadcrumbNav items={getBreadcrumbItems()} />

        {/* Provider Selection Section */}
        {currentStep === 'provider' && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Choose Your Insurance Provider
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose from our trusted insurance partners to view their available plans.
              </p>
            </div>

            <div className="relative mb-8 max-w-md mx-auto">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {providersLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6 text-center">
                      <Skeleton className="w-12 h-12 mx-auto mb-3 rounded" />
                      <Skeleton className="h-5 w-24 mx-auto mb-2" />
                      <Skeleton className="h-4 w-32 mx-auto mb-4" />
                      <Skeleton className="h-8 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                providers
                  .filter(provider => 
                    (provider.trade_name || provider.provider_name).toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(provider => (
                    <Card 
                      key={provider.provider_id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                      onClick={() => {
                        setSelectedProvider(provider.provider_code);
                        setCurrentStep('plan');
                      }}
                    >
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">
                          {provider.logo_file_path ? (
                            <img 
                              src={provider.logo_file_path} 
                              alt={`${provider.provider_name} logo`}
                              className="w-12 h-12 mx-auto object-contain"
                            />
                          ) : (
                            "🏢"
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-2">{provider.trade_name || provider.provider_name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">Insurance Provider</p>
                        <Button size="sm" className="w-full">Select Provider</Button>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </section>
        )}

        {/* Plan Selection Section */}
        {currentStep === 'plan' && currentProvider && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Select Your Plan
              </h2>
              <p className="text-lg text-muted-foreground">
                Compare and choose from the plans offered by {currentProvider?.trade_name || currentProvider?.provider_name}.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {availablePlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {plan.icon()}
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </div>
                    <Badge variant="secondary">{plan.category}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Coverage Summary</h4>
                        <ul className="text-sm space-y-1">
                          {plan.coverageSummary.map((item, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <Check className="w-3 h-3 text-green-500" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sum Assured:</span>
                          <p className="font-medium">{plan.sumAssured}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Premium:</span>
                          <p className="font-medium text-primary">{plan.premiumRange}</p>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground text-sm">Policy Tenure:</span>
                        <p className="font-medium">{plan.tenure}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addToCompare(plan)}
                        disabled={selectedPlans.find(p => p.id === plan.id) || selectedPlans.length >= 3}
                        className="flex-1"
                      >
                        {selectedPlans.find(p => p.id === plan.id) ? "Added" : "Compare"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => selectPlan(plan)}
                        className="flex-1"
                      >
                        Select Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedPlans.length > 0 && (
              <div className="text-center">
                <Button 
                  onClick={() => setCurrentStep('comparison')}
                  size="lg"
                >
                  Compare Selected Plans ({selectedPlans.length})
                </Button>
              </div>
            )}

            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('provider')}
              >
                ← Back to Providers
              </Button>
            </div>
          </section>
        )}

        {/* Compare Plans Section */}
        {currentStep === 'comparison' && selectedPlans.length > 0 && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Compare Plans & Benefits
              </h2>
              <p className="text-lg text-muted-foreground">
                Easily compare features, benefits, and add-ons across plans.
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[800px] bg-card rounded-lg border">
                <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-t-lg">
                  <div className="font-semibold">Feature</div>
                  {selectedPlans.map((plan) => (
                    <div key={plan.id} className="text-center">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => selectPlan(plan)}
                          className="flex-1"
                        >
                          Select
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCompare(plan.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="divide-y">
                  {Object.keys(selectedPlans[0]?.details?.features || {}).map((feature) => (
                    <div key={feature} className="grid grid-cols-4 gap-4 p-4">
                      <div className="font-medium">{feature}</div>
                      {selectedPlans.map((plan) => (
                        <div key={plan.id} className="text-center">
                          {renderComparisonValue(plan.details.features[feature])}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('plan')}
              >
                ← Back to Plans
              </Button>
            </div>
          </section>
        )}

        {/* Features & Add-ons Section */}
        {currentStep === 'addons' && selectedPlan && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Customize Your Plan
              </h2>
              <p className="text-lg text-muted-foreground">
                Add extra features to enhance your coverage.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {addOns.map((addOn) => (
                <Card key={addOn.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-sm">{addOn.name}</h3>
                      <Checkbox
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => toggleAddOn(addOn.id)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{addOn.description}</p>
                    <p className="font-semibold text-primary">₹{addOn.price}/year</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center space-y-4">
              <Button 
                onClick={() => setCurrentStep('summary')}
                size="lg"
              >
                Continue to Summary
              </Button>
              <div>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('plan')}
                >
                  ← Back to Plans
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Summary & CTA Section */}
        {currentStep === 'summary' && selectedPlan && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Your Selection Summary
              </h2>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="font-medium">Provider:</span>
                      <span>{currentProvider?.trade_name || currentProvider?.provider_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Plan:</span>
                      <span>{selectedPlan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Base Premium:</span>
                      <span>{selectedPlan.details.premium}/year</span>
                    </div>
                    
                    {selectedAddOns.length > 0 && (
                      <div>
                        <div className="font-medium mb-2">Selected Add-ons:</div>
                        {selectedAddOns.map(addOnId => {
                          const addOn = addOns.find(a => a.id === addOnId);
                          return addOn ? (
                            <div key={addOnId} className="flex justify-between text-sm">
                              <span>{addOn.name}</span>
                              <span>₹{addOn.price}/year</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Premium:</span>
                      <span className="text-primary">₹{calculateTotalPremium().toLocaleString()}/year</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button size="lg" className="flex-1">
                  Proceed to Checkout
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setCurrentStep('addons')}
                >
                  Go Back & Edit
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Contact Section */}
        <section className="text-center py-12 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Need Help Choosing?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Our expert advisors are here to help you find the perfect insurance plan for your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center text-sm">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>Toll-Free: 1800-123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Support</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PlanComparison;