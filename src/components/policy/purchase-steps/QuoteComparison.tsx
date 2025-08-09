import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, ArrowLeft, Star, TrendingUp, Shield, Calculator, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuoteComparisonProps {
  lineOfBusiness: string;
  providerId: string;
  productId: string;
  customerDetails?: any;
  context: {
    initiatedByRole: 'admin' | 'employee' | 'agent' | 'customer';
    initiatedById: string;
    canSelectOnBehalf?: boolean;
  };
  onSelect: (quote: QuoteDetails) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface QuoteDetails {
  productId: string;
  productName: string;
  providerId: string;
  providerName: string;
  sumInsured: number;
  premium: number;
  taxes: number;
  totalPremium: number;
  paymentFrequency: string;
  features: string[];
  exclusions: string[];
  waitingPeriod?: string;
  bestValue?: boolean;
  featured?: boolean;
}

interface QuoteInputs {
  sumInsured: number;
  paymentFrequency: string;
  age?: number;
  vehicleAge?: number;
  gender?: string;
  smoker?: boolean;
}

export const QuoteComparison: React.FC<QuoteComparisonProps> = ({
  lineOfBusiness,
  providerId,
  productId,
  customerDetails,
  context,
  onSelect,
  onNext,
  onPrevious,
}) => {
  const [quotes, setQuotes] = useState<QuoteDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetails | null>(null);
  const [quoteInputs, setQuoteInputs] = useState<QuoteInputs>({
    sumInsured: 500000,
    paymentFrequency: 'Yearly',
    age: 30,
  });

  const [product, setProduct] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    fetchProductAndProvider();
  }, [productId, providerId]);

  const fetchProductAndProvider = async () => {
    try {
      const [productRes, providerRes] = await Promise.all([
        supabase.from('insurance_products').select('*').eq('id', productId).single(),
        supabase.from('insurance_providers').select('*').eq('id', providerId).single(),
      ]);

      if (productRes.data) setProduct(productRes.data);
      if (providerRes.data) setProvider(providerRes.data);
    } catch (error) {
      console.error('Error fetching product/provider:', error);
    }
  };

  const generateQuote = async () => {
    if (!product || !provider || !customerDetails) return;

    setLoading(true);
    try {
      // Simulate quote generation with realistic premium calculation using customer details
      const basePremium = calculateBasePremium(quoteInputs, customerDetails);
      const taxes = basePremium * 0.18; // 18% GST
      const totalPremium = basePremium + taxes;

      const quote: QuoteDetails = {
        productId,
        productName: product.name,
        providerId,
        providerName: provider.provider_name,
        sumInsured: quoteInputs.sumInsured,
        premium: basePremium,
        taxes,
        totalPremium,
        paymentFrequency: quoteInputs.paymentFrequency,
        features: product.features || [],
        exclusions: getExclusions(lineOfBusiness),
        waitingPeriod: getWaitingPeriod(lineOfBusiness),
        bestValue: Math.random() > 0.7, // Simulate best value detection
        featured: Math.random() > 0.8, // Simulate featured products
      };

      // Generate comparison quotes from other providers (simulated)
      const comparisonQuotes = await generateComparisonQuotes(quote);
      
      setQuotes([quote, ...comparisonQuotes]);
    } catch (error) {
      console.error('Error generating quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBasePremium = (inputs: QuoteInputs, customerData?: any): number => {
    let basePremium = 0;
    const { sumInsured, age = customerData?.dateOfBirth ? new Date().getFullYear() - new Date(customerData.dateOfBirth).getFullYear() : 30, paymentFrequency } = inputs;

    switch (lineOfBusiness.toLowerCase()) {
      case 'health':
        basePremium = (sumInsured * 0.025) + (age > 45 ? age * 50 : age * 30);
        if (customerData?.smoker) basePremium *= 1.3;
        if (customerData?.preExistingConditions?.length > 0) basePremium *= 1.2;
        break;
      case 'motor':
        basePremium = sumInsured * 0.03;
        const vehicleAge = customerData?.manufacturingYear ? new Date().getFullYear() - customerData.manufacturingYear : 0;
        if (vehicleAge > 5) basePremium *= 1.2;
        if (customerData?.ncbPercent) basePremium *= (1 - parseInt(customerData.ncbPercent) / 100);
        break;
      case 'life':
        basePremium = (sumInsured * 0.02) + (age * 100);
        if (customerData?.smoker) basePremium *= 1.5;
        break;
      case 'travel':
        basePremium = sumInsured * 0.01;
        if (customerData?.travelPurpose === 'adventure') basePremium *= 1.5;
        break;
      default:
        basePremium = sumInsured * 0.02;
    }

    // Adjust for payment frequency
    if (paymentFrequency === 'Monthly') basePremium *= 1.1;
    else if (paymentFrequency === 'Quarterly') basePremium *= 1.05;

    return Math.round(basePremium);
  };

  const generateComparisonQuotes = async (baseQuote: QuoteDetails): Promise<QuoteDetails[]> => {
    // Simulate fetching quotes from other providers
    const mockProviders = [
      { id: '1', name: 'Star Health Insurance', variation: 0.95 },
      { id: '2', name: 'HDFC ERGO General Insurance', variation: 1.08 },
      { id: '3', name: 'ICICI Lombard GIC', variation: 1.02 },
    ].filter(p => p.id !== providerId);

    return mockProviders.slice(0, 2).map((mockProvider, index) => ({
      ...baseQuote,
      productId: `${baseQuote.productId}-comp-${index}`,
      productName: `${lineOfBusiness} Insurance Plan`,
      providerId: mockProvider.id,
      providerName: mockProvider.name,
      premium: Math.round(baseQuote.premium * mockProvider.variation),
      totalPremium: Math.round((baseQuote.premium * mockProvider.variation) * 1.18),
      bestValue: mockProvider.variation < 1,
    }));
  };

  const getExclusions = (lob: string): string[] => {
    const exclusions: Record<string, string[]> = {
      health: ['Pre-existing diseases (first year)', 'Cosmetic surgeries', 'Dental treatments'],
      motor: ['Driving under influence', 'Racing/competitions', 'War risks'],
      life: ['Suicide (first year)', 'War risks', 'Aviation risks'],
      travel: ['Adventure sports', 'Pre-existing medical conditions', 'War/terrorism'],
    };
    return exclusions[lob.toLowerCase()] || [];
  };

  const getWaitingPeriod = (lob: string): string => {
    const waitingPeriods: Record<string, string> = {
      health: '30 days for diseases, 2 years for pre-existing',
      motor: 'No waiting period',
      life: '90 days for natural death',
      travel: 'No waiting period',
    };
    return waitingPeriods[lob.toLowerCase()] || 'As per policy terms';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleQuoteSelect = (quote: QuoteDetails) => {
    setSelectedQuote(quote);
    onSelect(quote);
  };

  const renderQuoteInputs = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Get Quotes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="sumInsured">Sum Insured</Label>
            <Select
              value={quoteInputs.sumInsured.toString()}
              onValueChange={(value) => setQuoteInputs(prev => ({ ...prev, sumInsured: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="300000">₹3,00,000</SelectItem>
                <SelectItem value="500000">₹5,00,000</SelectItem>
                <SelectItem value="1000000">₹10,00,000</SelectItem>
                <SelectItem value="2000000">₹20,00,000</SelectItem>
                <SelectItem value="5000000">₹50,00,000</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="paymentFrequency">Payment Frequency</Label>
            <Select
              value={quoteInputs.paymentFrequency}
              onValueChange={(value) => setQuoteInputs(prev => ({ ...prev, paymentFrequency: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yearly">Yearly</SelectItem>
                <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {['health', 'life'].includes(lineOfBusiness.toLowerCase()) && (
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                type="number"
                value={quoteInputs.age || ''}
                onChange={(e) => setQuoteInputs(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                placeholder="Age"
                min="18"
                max="80"
              />
            </div>
          )}

          {lineOfBusiness.toLowerCase() === 'motor' && (
            <div>
              <Label htmlFor="vehicleAge">Vehicle Age</Label>
              <Input
                type="number"
                value={quoteInputs.vehicleAge || ''}
                onChange={(e) => setQuoteInputs(prev => ({ ...prev, vehicleAge: parseInt(e.target.value) }))}
                placeholder="Vehicle Age"
                min="0"
                max="20"
              />
            </div>
          )}
        </div>

        <Button onClick={generateQuote} disabled={loading} className="w-full">
          {loading ? 'Generating Quotes...' : 'Get Quotes'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderQuoteCard = (quote: QuoteDetails, index: number) => (
    <Card
      key={`${quote.providerId}-${index}`}
      className={`cursor-pointer transition-all hover:shadow-lg ${
        selectedQuote?.productId === quote.productId ? 'ring-2 ring-primary bg-primary/5' : ''
      } ${quote.bestValue ? 'border-green-200 bg-green-50/50' : ''}`}
      onClick={() => handleQuoteSelect(quote)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {quote.providerName}
              {quote.featured && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
              {selectedQuote?.productId === quote.productId && (
                <CheckCircle className="w-5 h-5 text-primary" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{quote.productName}</p>
          </div>
          <div className="text-right">
            {quote.bestValue && (
              <Badge className="bg-green-100 text-green-800 mb-1">Best Value</Badge>
            )}
            {quote.featured && (
              <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Sum Insured</p>
            <p className="text-lg font-bold">{formatCurrency(quote.sumInsured)}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Premium ({quote.paymentFrequency})</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(quote.totalPremium)}</p>
            <p className="text-xs text-muted-foreground">
              Base: {formatCurrency(quote.premium)} + Tax: {formatCurrency(quote.taxes)}
            </p>
          </div>
        </div>

        {quote.features.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Key Features</p>
            <div className="flex flex-wrap gap-1">
              {quote.features.slice(0, 3).map((feature, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {quote.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{quote.features.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Waiting Period: {quote.waitingPeriod}</span>
            </div>
            {quote.bestValue && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span>Best Value</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Compare Quotes</h3>
        <p className="text-muted-foreground">
          Get instant quotes and compare across top insurers
        </p>
      </div>

      {renderQuoteInputs()}

      {quotes.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-4">Available Quotes</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {quotes.map((quote, index) => renderQuoteCard(quote, index))}
          </div>
        </div>
      )}

      {quotes.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Get Quotes?</h3>
            <p className="text-muted-foreground">
              Configure your requirements above and click "Get Quotes" to see available options.
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
        <Button
          onClick={onNext}
          disabled={!selectedQuote}
          className="min-w-32"
        >
          Continue with Quote
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};