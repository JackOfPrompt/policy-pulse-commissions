import { useState } from "react";
import Header from "@/components/Header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, Car, Shield, Building, Home, CreditCard, Dog, Plane, Search, Filter, Plus, X, ExternalLink, Star, CheckCircle, Info, TrendingUp } from "lucide-react";
import compareHero from "@/assets/compare-hero.jpg";
import Footer from "@/components/Footer";
import { BackButton } from "@/components/ui/back-button";
const productTypes = [{
  id: 'health',
  name: 'Health Insurance',
  icon: Heart
}, {
  id: 'motor',
  name: 'Motor Insurance',
  icon: Car
}, {
  id: 'life',
  name: 'Life Insurance',
  icon: Shield
}, {
  id: 'commercial',
  name: 'Commercial Insurance',
  icon: Building
}, {
  id: 'property',
  name: 'Property Insurance',
  icon: Home
}, {
  id: 'loan',
  name: 'Loan Insurance',
  icon: CreditCard
}, {
  id: 'pet',
  name: 'Pet Insurance',
  icon: Dog
}, {
  id: 'travel',
  name: 'Travel Insurance',
  icon: Plane
}];
import useProviders from "@/hooks/useProviders";
const availablePlans = [{
  id: 1,
  name: 'Star Health Optima',
  provider: 'Star Health',
  type: 'health',
  sumAssured: '₹10,00,000',
  premium: '₹15,000',
  tenure: '1 Year',
  coverage: ['Hospitalization', 'Critical Illness', 'Pre/Post Hospitalization'],
  riders: ['Maternity Cover', 'OPD Cover', 'Wellness Benefits'],
  networkHospitals: '9,900+',
  claimRatio: '85%',
  specialFeatures: ['No Room Rent Limit', 'Automatic Recharge', '24x7 Helpline'],
  rating: 4.5
}, {
  id: 2,
  name: 'HDFC ERGO My Health Suraksha',
  provider: 'HDFC ERGO',
  type: 'health',
  sumAssured: '₹10,00,000',
  premium: '₹12,500',
  tenure: '1 Year',
  coverage: ['Hospitalization', 'Day Care Procedures', 'AYUSH Treatment'],
  riders: ['Critical Illness', 'Personal Accident', 'Hospital Cash'],
  networkHospitals: '7,200+',
  claimRatio: '92%',
  specialFeatures: ['Health Check-up', 'Teleconsultation', 'Second Opinion'],
  rating: 4.3
}, {
  id: 3,
  name: 'Bajaj Allianz Car Insurance',
  provider: 'Bajaj Allianz',
  type: 'motor',
  sumAssured: '₹8,00,000',
  premium: '₹8,500',
  tenure: '1 Year',
  coverage: ['Own Damage', 'Third Party Liability', 'Natural Calamities'],
  riders: ['Zero Depreciation', 'Engine Protection', 'Roadside Assistance'],
  networkHospitals: 'N/A',
  claimRatio: '88%',
  specialFeatures: ['Cashless Claims', 'Quick Settlement', 'Mobile App'],
  rating: 4.4
}];
const comparisonFeatures = ['Sum Assured', 'Premium Amount', 'Policy Tenure', 'Coverage Benefits', 'Available Riders', 'Network Hospitals', 'Claim Settlement Ratio', 'Special Features', 'Customer Rating'];
const tips = [{
  title: 'Health Insurance Key Factors',
  content: 'Consider coverage amount, network hospitals, waiting period, and claim settlement ratio when choosing health insurance.',
  icon: Heart
}, {
  title: 'Motor Insurance Coverage Tips',
  content: 'Evaluate IDV, add-ons like zero depreciation, and cashless garage network for comprehensive motor insurance.',
  icon: Car
}, {
  title: 'Life Insurance Planning',
  content: 'Calculate life cover as 10-15 times annual income and choose between term and ULIP based on your goals.',
  icon: Shield
}, {
  title: 'Commercial Insurance Guide',
  content: 'Assess business risks, property value, and liability exposure to determine appropriate commercial coverage.',
  icon: Building
}];
export default function ComparePlans() {
  const { providers } = useProviders();
  const [selectedPlans, setSelectedPlans] = useState<number[]>([1, 2]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const filteredPlans = availablePlans.filter(plan => {
    const matchesType = selectedType === 'all' || plan.type === selectedType;
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || plan.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || plan.provider === selectedProvider;
    return matchesType && matchesSearch && matchesProvider;
  });
  const plansToCompare = availablePlans.filter(plan => selectedPlans.includes(plan.id));
  const togglePlanSelection = (planId: number) => {
    setSelectedPlans(prev => {
      if (prev.includes(planId)) {
        return prev.filter(id => id !== planId);
      } else if (prev.length < 4) {
        return [...prev, planId];
      } else {
        return prev;
      }
    });
  };
  const addPlanToComparison = (planId: number) => {
    if (!selectedPlans.includes(planId) && selectedPlans.length < 4) {
      setSelectedPlans(prev => [...prev, planId]);
    }
  };
  const removePlanFromComparison = (planId: number) => {
    setSelectedPlans(prev => prev.filter(id => id !== planId));
  };
  const renderComparisonValue = (plan: any, feature: string) => {
    switch (feature) {
      case 'Sum Assured':
        return plan.sumAssured;
      case 'Premium Amount':
        return plan.premium;
      case 'Policy Tenure':
        return plan.tenure;
      case 'Coverage Benefits':
        return <ul className="text-sm space-y-1">
            {plan.coverage.slice(0, 3).map((item: string, idx: number) => <li key={idx} className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {item}
              </li>)}
          </ul>;
      case 'Available Riders':
        return <ul className="text-sm space-y-1">
            {plan.riders.slice(0, 2).map((item: string, idx: number) => <li key={idx} className="flex items-center gap-1">
                <Plus className="h-3 w-3 text-blue-500" />
                {item}
              </li>)}
          </ul>;
      case 'Network Hospitals':
        return plan.networkHospitals;
      case 'Claim Settlement Ratio':
        return <div className="flex items-center gap-1">
            <span className="font-medium">{plan.claimRatio}</span>
            <TrendingUp className="h-3 w-3 text-green-500" />
          </div>;
      case 'Special Features':
        return <ul className="text-sm space-y-1">
            {plan.specialFeatures.slice(0, 2).map((item: string, idx: number) => <li key={idx} className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {item}
              </li>)}
          </ul>;
      case 'Customer Rating':
        return <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{plan.rating}</span>
          </div>;
      default:
        return '-';
    }
  };
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <BackButton to="/" label="Back to Home" />
      </div>
      
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary to-secondary" style={{
      backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${compareHero})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
        <div className="container mx-auto px-4">
          <Breadcrumb className="mb-8">
            <BreadcrumbList className="text-white">
              <BreadcrumbItem>
                <BreadcrumbLink href="/" className="text-white hover:text-white/80">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white" />
              <BreadcrumbItem>
                <BreadcrumbLink href="/products" className="text-white hover:text-white/80">Products</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-white" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-white">Compare Plans</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Compare Insurance Plans Side by Side
            </h1>
            <h2 className="text-xl md:text-2xl mb-8 text-white/90">
              Make informed decisions by comparing Health, Life, Motor, Commercial, Property, Loan, Pet & Travel Insurance plans from top providers.
            </h2>
            <Button size="lg" className="btn-hero" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')}>
              Get a Quote
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="shadow-lg">
            <CardHeader>
              
              <CardDescription>
                Select plans to compare (up to 4 plans) • Currently comparing: {selectedPlans.length} plan{selectedPlans.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search Plans</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="e.g., Star Health Optima" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                  </div>
                </div>

                {/* Product Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {productTypes.map(type => <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Provider */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map(provider => (
                        <SelectItem key={provider.provider_id} value={provider.trade_name || provider.provider_name}>
                          {provider.trade_name || provider.provider_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Add Plan Button */}
                <div className="flex items-end">
                  <Button className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Available Plans */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans for Comparison</CardTitle>
              <CardDescription>
                Select plans to add to your comparison table
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.map(plan => <Card key={plan.id} className={`card-product cursor-pointer ${selectedPlans.includes(plan.id) ? 'ring-2 ring-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <p className="text-sm text-muted-foreground">{plan.provider}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={selectedPlans.includes(plan.id)} onCheckedChange={() => togglePlanSelection(plan.id)} />
                          {selectedPlans.includes(plan.id) && <Badge variant="secondary">Selected</Badge>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Sum Assured:</span>
                          <p className="font-medium">{plan.sumAssured}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Premium:</span>
                          <p className="font-medium">{plan.premium}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rating:</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{plan.rating}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Claim Ratio:</span>
                          <p className="font-medium">{plan.claimRatio}</p>
                        </div>
                      </div>
                      <Button variant={selectedPlans.includes(plan.id) ? "outline" : "default"} className="w-full" onClick={() => {
                    if (selectedPlans.includes(plan.id)) {
                      removePlanFromComparison(plan.id);
                    } else {
                      addPlanToComparison(plan.id);
                    }
                  }} disabled={!selectedPlans.includes(plan.id) && selectedPlans.length >= 4}>
                        {selectedPlans.includes(plan.id) ? 'Remove from Comparison' : 'Add to Compare'}
                      </Button>
                    </CardContent>
                  </Card>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Comparison Table */}
      {plansToCompare.length >= 2 && <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Your Plan Comparison</h2>
              <p className="text-xl text-muted-foreground">
                Comparing {plansToCompare.length} plan{plansToCompare.length !== 1 ? 's' : ''} side by side
              </p>
            </div>

            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Features</TableHead>
                      {plansToCompare.map(plan => <TableHead key={plan.id} className="min-w-64">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.provider}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => removePlanFromComparison(plan.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button className="w-full" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')}>
                              Buy Now
                            </Button>
                          </div>
                        </TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonFeatures.map(feature => <TableRow key={feature}>
                        <TableCell className="font-medium bg-muted/30">
                          {feature}
                        </TableCell>
                        {plansToCompare.map(plan => <TableCell key={plan.id}>
                            {renderComparisonValue(plan, feature)}
                          </TableCell>)}
                      </TableRow>)}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </section>}

      {/* Recommendations */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Recommended Plans Based on Your Selection</h2>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availablePlans.slice(0, 3).map(plan => <Card key={plan.id} className="card-product">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Recommended
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{plan.rating}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.provider}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Sum Assured</span>
                      <span className="text-sm font-medium">{plan.sumAssured}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Premium</span>
                      <span className="text-sm font-medium">{plan.premium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Claim Ratio</span>
                      <span className="text-sm font-medium">{plan.claimRatio}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')}>
                    View Plan
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Educational Tips */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">How to Choose the Right Plan</h2>
            
          </div>

          <Accordion type="single" collapsible className="max-w-4xl mx-auto">
            {tips.map((tip, index) => {
            const IconComponent = tip.icon;
            return <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-primary" />
                      <span>{tip.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground ml-8">{tip.content}</p>
                    <Button variant="link" className="ml-8 p-0 mt-2">
                      Read Full Guide →
                    </Button>
                  </AccordionContent>
                </AccordionItem>;
          })}
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Purchase Your Plan?</h2>
          <h3 className="text-xl mb-8 text-white/90">
            Compare, choose, and buy insurance policies online from India's top providers.
          </h3>
          <Button size="lg" variant="secondary" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')} className="bg-white text-primary hover:bg-white/90">
            Get Started
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>;
}