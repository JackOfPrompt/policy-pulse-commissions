import { useState } from "react";
import Header from "@/components/Header";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Heart, Car, Shield, Building, Home, CreditCard, Dog, Plane, Search, Filter, ArrowUpDown, ExternalLink, Star, TrendingUp, CheckCircle, Info } from "lucide-react";
import productsHero from "@/assets/products-hero.jpg";
import Footer from "@/components/Footer";
import { useLOBs } from "@/hooks/useLOBs";
import { LOBIcon } from "@/components/LOBIcon";
import { Skeleton } from "@/components/ui/skeleton";
const productTypes = [{
  id: 'health',
  name: 'Health Insurance',
  icon: Heart,
  color: 'text-red-500'
}, {
  id: 'motor',
  name: 'Motor Insurance',
  icon: Car,
  color: 'text-blue-500'
}, {
  id: 'life',
  name: 'Life Insurance',
  icon: Shield,
  color: 'text-green-500'
}, {
  id: 'commercial',
  name: 'Commercial Insurance',
  icon: Building,
  color: 'text-purple-500'
}, {
  id: 'property',
  name: 'Property Insurance',
  icon: Home,
  color: 'text-orange-500'
}, {
  id: 'loan',
  name: 'Loan Insurance',
  icon: CreditCard,
  color: 'text-cyan-500'
}, {
  id: 'pet',
  name: 'Pet Insurance',
  icon: Dog,
  color: 'text-pink-500'
}, {
  id: 'travel',
  name: 'Travel Insurance',
  icon: Plane,
  color: 'text-indigo-500'
}];
import useProviders from "@/hooks/useProviders";
const sampleProducts = [{
  name: 'Star Health Optima',
  provider: 'Star Health',
  type: 'health',
  sumAssured: '₹5L - ₹1Cr',
  premium: '₹5,000 - ₹50,000',
  tenure: '1-10 years',
  coverage: 'Hospitalization, Critical Illness',
  riders: 'Maternity, OPD',
  rating: 4.5,
  popular: true
}, {
  name: 'HDFC ERGO My Health Suraksha',
  provider: 'HDFC ERGO',
  type: 'health',
  sumAssured: '₹3L - ₹75L',
  premium: '₹4,500 - ₹35,000',
  tenure: '1-5 years',
  coverage: 'Hospitalization, Day Care',
  riders: 'Critical Illness, Personal Accident',
  rating: 4.3,
  popular: false
}, {
  name: 'Bajaj Allianz Car Insurance',
  provider: 'Bajaj Allianz',
  type: 'motor',
  sumAssured: '₹2L - ₹50L',
  premium: '₹3,000 - ₹25,000',
  tenure: '1 year',
  coverage: 'Third Party, Own Damage',
  riders: 'Zero Depreciation, Engine Protection',
  rating: 4.4,
  popular: true
}, {
  name: 'ICICI Pru iProtect Smart',
  provider: 'ICICI Lombard',
  type: 'life',
  sumAssured: '₹10L - ₹10Cr',
  premium: '₹8,000 - ₹1,00,000',
  tenure: '5-40 years',
  coverage: 'Term Life, Accidental Death',
  riders: 'Critical Illness, Disability',
  rating: 4.6,
  popular: true
}];
const tips = [{
  title: 'How to Select Health Insurance',
  description: 'Key factors to consider when choosing the right health insurance policy for your family.',
  icon: Heart
}, {
  title: 'Motor Insurance FAQs',
  description: 'Common questions about car and bike insurance coverage, claims, and renewals.',
  icon: Car
}, {
  title: 'Life Insurance Guide',
  description: 'Understanding term vs ULIP policies and choosing the right life coverage amount.',
  icon: Shield
}, {
  title: 'Commercial Insurance Advice',
  description: 'Protecting your business with the right commercial insurance coverage.',
  icon: Building
}];
export default function Products() {
  const {
    providers
  } = useProviders();
  const {
    lobs,
    loading: lobsLoading
  } = useLOBs();
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [sumAssuredRange, setSumAssuredRange] = useState([100000]);
  const [premiumRange, setPremiumRange] = useState([5000]);
  const filteredProducts = sampleProducts.filter(product => {
    const matchesType = selectedType === 'all' || product.type === selectedType;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || product.provider === selectedProvider;
    return matchesType && matchesSearch && matchesProvider;
  });
  const popularProducts = sampleProducts.filter(product => product.popular);
  return <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 bg-gradient-to-br from-primary to-secondary" style={{
      backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${productsHero})`,
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
                <BreadcrumbPage className="text-white">Products</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="max-w-5xl mx-auto text-center text-white">
            <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
              Insurance Made Simple
            </h1>
            <h2 className="text-2xl md:text-3xl mb-12 text-white/90 font-light">
              Discover the perfect insurance coverage from India's most trusted providers
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="btn-hero px-8 py-4 text-lg" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')}>
                Explore Products
                <ExternalLink className="ml-2 h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg">
                Compare Plans
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories Grid */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Choose Your Protection</h2>
            
          </div>
          
          {lobsLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from({
            length: 8
          }).map((_, index) => <Card key={index} className="group cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  <CardContent className="p-8 text-center">
                    <div className="inline-flex p-4 rounded-full bg-muted mb-4">
                      <Skeleton className="h-8 w-8" />
                    </div>
                    <Skeleton className="h-5 w-24 mx-auto mb-2" />
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </CardContent>
                </Card>)}
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {(lobs.length > 0 ? lobs : productTypes).map((item, index) => {
            const isLOB = 'lob_id' in item;
            const id = isLOB ? item.lob_code : item.id;
            const name = isLOB ? item.lob_name : item.name;
            const IconComponent = isLOB ? Shield : item.icon;
            const color = isLOB ? 'text-primary' : item.color;
            return <Card key={isLOB ? item.lob_id : item.id} className={`group cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${selectedType === id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedType(id)}>
                    <CardContent className="p-8 text-center">
                      <div className={`inline-flex p-4 rounded-full bg-gradient-to-br ${selectedType === id ? 'from-primary to-primary/80' : 'from-muted to-muted/80'} mb-4 group-hover:from-primary group-hover:to-primary/80 transition-all overflow-hidden`}>
                        {isLOB && item.icon_file_path ? <LOBIcon iconPath={item.icon_file_path} lobName={item.lob_name} size="md" className={`${selectedType === id ? 'brightness-0 invert' : ''} group-hover:brightness-0 group-hover:invert transition-all`} /> : <IconComponent className={`h-8 w-8 ${selectedType === id ? 'text-white' : color} group-hover:text-white transition-colors`} />}
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{name}</h3>
                      
                    </CardContent>
                  </Card>;
          })}
            </div>}

          {/* Quick Filters */}
          <Card className="shadow-lg border-2">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Products</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Product or provider name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-12" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map(provider => <SelectItem key={provider.provider_id} value={provider.trade_name || provider.provider_name}>
                          {provider.trade_name || provider.provider_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Premium Range: ₹{premiumRange[0].toLocaleString()}
                  </label>
                  <Slider value={premiumRange} onValueChange={setPremiumRange} max={100000} min={1000} step={1000} className="mt-4" />
                </div>

                <div className="flex items-end">
                  <Button className="w-full h-12 text-base">
                    <Filter className="mr-2 h-5 w-5" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Available Products</h2>
              <p className="text-muted-foreground">
                {filteredProducts.length} products match your criteria
              </p>
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort by Premium
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => {
            const productType = productTypes.find(type => type.id === product.type);
            const IconComponent = productType?.icon || Shield;
            return <Card key={index} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/20 overflow-hidden">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <IconComponent className={`h-6 w-6 ${productType?.color || 'text-primary'}`} />
                          </div>
                          {product.popular && <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>}
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating}</span>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                      <p className="text-muted-foreground font-medium">{product.provider}</p>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Sum Assured</p>
                          <p className="font-semibold text-primary">{product.sumAssured}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Premium</p>
                          <p className="font-semibold text-primary">{product.premium}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{product.coverage}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-blue-500" />
                          <span className="text-sm">Tenure: {product.tenure}</span>
                        </div>
                        {product.riders && <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{product.riders}</Badge>
                          </div>}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button className="w-full h-12 text-base" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')}>
                        Get Instant Quote
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                      <Button variant="outline" className="w-full">
                        Compare Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Featured Providers */}
      <section className="py-12 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Trusted Insurance Partners</h2>
            
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {providers.slice(0, 10).map(provider => <Card key={provider.provider_id} className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg mb-4 flex items-center justify-center">
                    {provider.logo_file_path ? <img src={provider.logo_file_path} alt={`${provider.provider_name} logo`} className="w-10 h-10 object-contain" /> : <span className="font-bold text-primary text-lg">{(provider.trade_name || provider.provider_name).charAt(0)}</span>}
                  </div>
                  <h3 className="font-semibold text-sm">{provider.trade_name || provider.provider_name}</h3>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Expert Tips */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Expert Insurance Guidance</h2>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {tips.map((tip, index) => {
            const IconComponent = tip.icon;
            return <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <IconComponent className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold">{tip.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">{tip.description}</p>
                    <Button variant="link" className="p-0 text-primary font-semibold group-hover:underline">
                      Learn More →
                    </Button>
                  </div>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6">Start Your Insurance Journey Today</h2>
          <h3 className="text-2xl mb-12 text-white/90 font-light max-w-3xl mx-auto">
            Join millions of satisfied customers who trust LMV Insurance for their protection needs
          </h3>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="lg" variant="secondary" onClick={() => window.open('https://www.lmvinsurance.com/', '_blank')} className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold">
              Get Your Quote Now
              <ExternalLink className="ml-2 h-6 w-6" />
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold">
              Compare All Plans
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
}