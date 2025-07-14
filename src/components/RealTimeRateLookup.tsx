import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Zap,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  Settings,
  Clock,
  Shield,
  Target,
  AlertTriangle
} from "lucide-react";

interface CommissionRate {
  id: string;
  productType: string;
  agentTier: string;
  baseRate: number;
  territory?: string;
  effectiveDate: string;
  expiryDate?: string;
  volumeThreshold?: number;
  volumeBonus?: number;
  isActive: boolean;
  lastModified: string;
  modifiedBy: string;
}

interface RateLookupRequest {
  productType: string;
  agentId: string;
  territory: string;
  policyDate: string;
  premiumAmount: number;
}

interface RateLookupResult {
  baseRate: number;
  volumeBonus: number;
  finalRate: number;
  applicableRules: string[];
  cacheHit: boolean;
  auditTrail: AuditEntry[];
}

interface AuditEntry {
  action: string;
  timestamp: string;
  user: string;
  oldValue?: string;
  newValue?: string;
}

export function RealTimeRateLookup() {
  const [rates, setRates] = useState<CommissionRate[]>([
    {
      id: '1',
      productType: 'Auto Insurance',
      agentTier: 'Platinum',
      baseRate: 6.5,
      territory: 'North',
      effectiveDate: '2024-01-01',
      expiryDate: '2024-12-31',
      volumeThreshold: 100000,
      volumeBonus: 1.5,
      isActive: true,
      lastModified: '2024-01-15 10:30:00',
      modifiedBy: 'Admin'
    },
    {
      id: '2',
      productType: 'Home Insurance',
      agentTier: 'Gold',
      baseRate: 5.2,
      territory: 'South',
      effectiveDate: '2024-01-01',
      volumeThreshold: 75000,
      volumeBonus: 1.0,
      isActive: true,
      lastModified: '2024-01-14 15:45:00',
      modifiedBy: 'Rate Manager'
    },
    {
      id: '3',
      productType: 'Life Insurance',
      agentTier: 'Silver',
      baseRate: 8.0,
      effectiveDate: '2024-01-01',
      volumeThreshold: 50000,
      volumeBonus: 0.8,
      isActive: true,
      lastModified: '2024-01-13 09:15:00',
      modifiedBy: 'Underwriter'
    }
  ]);

  const [lookupRequest, setLookupRequest] = useState<RateLookupRequest>({
    productType: '',
    agentId: '',
    territory: '',
    policyDate: '',
    premiumAmount: 0
  });

  const [lookupResult, setLookupResult] = useState<RateLookupResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    hits: 1247,
    misses: 89,
    hitRate: 93.3
  });

  const { toast } = useToast();

  const performRateLookup = async () => {
    if (!lookupRequest.productType || !lookupRequest.agentId || !lookupRequest.premiumAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for rate lookup",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call with realistic delay
    setTimeout(() => {
      const baseRate = getBaseRate(lookupRequest);
      const volumeBonus = calculateVolumeBonus(lookupRequest.premiumAmount);
      const finalRate = baseRate + volumeBonus;

      const result: RateLookupResult = {
        baseRate,
        volumeBonus,
        finalRate,
        applicableRules: [
          'Product-based rate applied',
          'Agent tier bonus included',
          lookupRequest.territory && 'Territory adjustment applied',
          lookupRequest.premiumAmount > 50000 && 'Volume bonus applied'
        ].filter(Boolean) as string[],
        cacheHit: Math.random() > 0.3, // 70% cache hit rate
        auditTrail: [
          {
            action: 'Rate lookup performed',
            timestamp: new Date().toISOString(),
            user: 'System',
          }
        ]
      };

      setLookupResult(result);
      setIsLoading(false);

      toast({
        title: "Rate Lookup Complete",
        description: `Commission rate: ${finalRate.toFixed(2)}% (${result.cacheHit ? 'cached' : 'fresh'})`,
      });
    }, 1500);
  };

  const getBaseRate = (request: RateLookupRequest): number => {
    const matchingRate = rates.find(rate => 
      rate.productType === request.productType && 
      rate.isActive &&
      (!rate.territory || rate.territory === request.territory)
    );
    return matchingRate?.baseRate || 5.0;
  };

  const calculateVolumeBonus = (premiumAmount: number): number => {
    if (premiumAmount > 100000) return 1.5;
    if (premiumAmount > 75000) return 1.0;
    if (premiumAmount > 50000) return 0.5;
    return 0;
  };

  const addNewRate = () => {
    const newRate: CommissionRate = {
      id: Date.now().toString(),
      productType: 'New Product',
      agentTier: 'Silver',
      baseRate: 5.0,
      effectiveDate: new Date().toISOString().split('T')[0],
      isActive: true,
      lastModified: new Date().toLocaleString(),
      modifiedBy: 'Current User'
    };
    setRates(prev => [newRate, ...prev]);
    
    toast({
      title: "Rate Added",
      description: "New commission rate has been created",
    });
  };

  const toggleRateStatus = (rateId: string) => {
    setRates(prev => prev.map(rate => 
      rate.id === rateId 
        ? { ...rate, isActive: !rate.isActive, lastModified: new Date().toLocaleString() }
        : rate
    ));
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lookup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lookup" className="gap-2">
            <Search className="w-4 h-4" />
            Rate Lookup
          </TabsTrigger>
          <TabsTrigger value="management" className="gap-2">
            <Settings className="w-4 h-4" />
            Rate Management
          </TabsTrigger>
          <TabsTrigger value="caching" className="gap-2">
            <Zap className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Shield className="w-4 h-4" />
            Audit Trail
          </TabsTrigger>
        </TabsList>

        {/* Rate Lookup */}
        <TabsContent value="lookup" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lookup Form */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  Real-time Rate Lookup
                </CardTitle>
                <CardDescription>
                  Get instant commission rates with multi-factor calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productType">Product Type</Label>
                  <Select value={lookupRequest.productType} onValueChange={(value) => 
                    setLookupRequest(prev => ({ ...prev, productType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Auto Insurance">Auto Insurance</SelectItem>
                      <SelectItem value="Home Insurance">Home Insurance</SelectItem>
                      <SelectItem value="Life Insurance">Life Insurance</SelectItem>
                      <SelectItem value="Health Insurance">Health Insurance</SelectItem>
                      <SelectItem value="Commercial Insurance">Commercial Insurance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="agentId">Agent ID</Label>
                  <Input
                    id="agentId"
                    placeholder="AGT001"
                    value={lookupRequest.agentId}
                    onChange={(e) => setLookupRequest(prev => ({ ...prev, agentId: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="territory">Territory (Optional)</Label>
                  <Select value={lookupRequest.territory} onValueChange={(value) => 
                    setLookupRequest(prev => ({ ...prev, territory: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="North">North</SelectItem>
                      <SelectItem value="South">South</SelectItem>
                      <SelectItem value="East">East</SelectItem>
                      <SelectItem value="West">West</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="policyDate">Policy Date</Label>
                  <Input
                    id="policyDate"
                    type="date"
                    value={lookupRequest.policyDate}
                    onChange={(e) => setLookupRequest(prev => ({ ...prev, policyDate: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="premiumAmount">Premium Amount ($)</Label>
                  <Input
                    id="premiumAmount"
                    type="number"
                    placeholder="0.00"
                    value={lookupRequest.premiumAmount || ''}
                    onChange={(e) => setLookupRequest(prev => ({ 
                      ...prev, 
                      premiumAmount: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>

                <Button 
                  onClick={performRateLookup} 
                  disabled={isLoading}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      Looking up rates...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Get Commission Rate
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Lookup Results */}
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Rate Calculation Results
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of commission rate calculation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lookupResult ? (
                  <div className="space-y-4 animate-fade-in">
                    {/* Final Rate Display */}
                    <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {lookupResult.finalRate.toFixed(2)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Final Commission Rate</div>
                      {lookupResult.cacheHit && (
                        <Badge variant="outline" className="mt-2 bg-success/10 text-success border-success/20">
                          <Zap className="w-3 h-3 mr-1" />
                          Cached Result
                        </Badge>
                      )}
                    </div>

                    {/* Rate Breakdown */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Rate Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm">Base Rate</span>
                          <span className="font-medium">{lookupResult.baseRate.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm">Volume Bonus</span>
                          <span className="font-medium text-success">+{lookupResult.volumeBonus.toFixed(2)}%</span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between items-center p-2 bg-primary/5 rounded font-medium">
                            <span>Total Rate</span>
                            <span className="text-primary">{lookupResult.finalRate.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Applied Rules */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Applied Rules</h4>
                      <div className="space-y-2">
                        {lookupResult.applicableRules.map((rule, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-success rounded-full"></div>
                            {rule}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Info */}
                    <Alert>
                      <Zap className="w-4 h-4" />
                      <AlertDescription>
                        Response time: {lookupResult.cacheHit ? '23ms' : '127ms'} • 
                        Source: {lookupResult.cacheHit ? 'Cache' : 'Database'}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Ready for Rate Lookup</h3>
                    <p className="text-muted-foreground">
                      Fill in the form and click "Get Commission Rate" to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rate Management */}
        <TabsContent value="management" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Commission Rate Management
                  </CardTitle>
                  <CardDescription>
                    Configure and manage commission rate structures
                  </CardDescription>
                </div>
                <Button onClick={addNewRate} className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Add New Rate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rates.map((rate) => (
                  <div key={rate.id} className="border rounded-lg p-4 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${rate.isActive ? 'bg-success' : 'bg-muted-foreground'}`}></div>
                        <div>
                          <h3 className="font-medium">{rate.productType}</h3>
                          <p className="text-sm text-muted-foreground">
                            {rate.agentTier} Tier • {rate.territory || 'All Territories'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rate.isActive ? "default" : "secondary"}>
                          {rate.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRateStatus(rate.id)}
                        >
                          {rate.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Base Rate</p>
                        <p className="font-medium">{rate.baseRate}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume Threshold</p>
                        <p className="font-medium">${rate.volumeThreshold?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Volume Bonus</p>
                        <p className="font-medium">+{rate.volumeBonus}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Effective Date</p>
                        <p className="font-medium">{rate.effectiveDate}</p>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground border-t pt-2">
                      Last modified: {rate.lastModified} by {rate.modifiedBy}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance & Caching */}
        <TabsContent value="caching" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-primary" />
                  Cache Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{cacheStats.hitRate}%</div>
                    <div className="text-sm text-muted-foreground">Hit Rate</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cache Hits</span>
                      <span className="font-medium text-success">{cacheStats.hits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Cache Misses</span>
                      <span className="font-medium text-warning">{cacheStats.misses}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  Response Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Cached Lookup</span>
                      <span className="font-medium text-success">23ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Database Lookup</span>
                      <span className="font-medium text-warning">127ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Response</span>
                      <span className="font-medium">34ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="w-5 h-5 text-primary" />
                  Cache Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Zap className="w-4 h-4" />
                    Clear Cache
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Preload Rates
                  </Button>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Settings className="w-4 h-4" />
                    Configure TTL
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="space-y-6">
          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Rate Change Audit Trail
              </CardTitle>
              <CardDescription>
                Complete history of rate modifications and overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Audit Trail</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive audit logging system ready for implementation
                </p>
                <Button variant="outline">
                  View Audit History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}