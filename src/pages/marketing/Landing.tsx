import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Shield, Building2, Heart, Car, Factory, Sparkles, Lock, Globe2 } from 'lucide-react';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { supabase } from '@/integrations/supabase/client';

interface LOB { id: string; lob_name: string; description?: string | null }
interface Provider { id: string; insurer_name: string; logo_url?: string | null }
interface Plan { id: string; name: string; price_monthly: number | null; price_annual: number | null; features?: string[]; trial_days?: number | null }

export default function Landing() {
  const navigate = useNavigate();
  const { brandName, logoUrl, isTenantSubdomain } = useTenantBranding();

  const [lobs, setLobs] = useState<LOB[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);

  const providerList = useMemo<Provider[]>(() => (
    providers.length ? providers : Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, insurer_name: 'Insurer', logo_url: null } as unknown as Provider))
  ), [providers]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: lobData } = await supabase.from('lines_of_business').select('lob_id, lob_name, description').limit(4);
        if (active && lobData) {
          setLobs(lobData.map((r: any) => ({ id: r.lob_id, lob_name: r.lob_name, description: r.description })));
        }
      } catch {}
      try {
        const { data: provData } = await supabase.from('insurance_providers').select('provider_id, insurer_name, logo_url').limit(12);
        if (active && provData) {
          setProviders(provData.map((p: any) => ({ id: p.provider_id, insurer_name: p.insurer_name, logo_url: p.logo_url })));
        }
      } catch {}
      try {
        const { data: planData } = await supabase.from('subscription_plans').select('id, name, price_monthly, price_annual, features, trial_days').order('price_monthly', { ascending: true });
        if (active && planData) {
          setPlans(planData as any);
        }
      } catch {
        if (active) {
          setPlans([
            { id: 'starter', name: 'Starter', price_monthly: 0, price_annual: 0, features: ['Tenant-branded portal', 'Up to 3 users', 'Email support'], trial_days: 14 },
            { id: 'pro', name: 'Pro', price_monthly: 1999, price_annual: 19990, features: ['Unlimited users', 'Policy workflows', 'Provider integrations'] },
            { id: 'enterprise', name: 'Enterprise', price_monthly: null, price_annual: null, features: ['Custom SLA', 'Dedicated support', 'SSO, Audit logs'] },
          ]);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const goToDashboard = () => {
    if (isTenantSubdomain) navigate('/tenant/overview');
    else navigate('/tenant-select');
  };

  const heroImgAlt = `${brandName} insurance SaaS dashboard illustration`;

  return (
    <HelmetProvider>
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Abiraksha Insuretech SaaS for Brokers</title>
          <meta name="description" content="White-labeled SaaS for insurance brokers to sell and manage policies online. Fast issuance, secure payments, multi-insurer options." />
          <link rel="canonical" href={window.location.href} />
        </Helmet>

        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur border-b">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={`${brandName} logo`} className="h-8 w-auto" loading="lazy" />
              ) : (
                <Shield className="h-8 w-8 text-primary" />
              )}
              <span className="font-semibold text-lg">{brandName}</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#support" className="hover:text-foreground transition-colors">Support</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact Us</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/auth')}>Login</Button>
              <Button onClick={goToDashboard}>Login to Your Dashboard</Button>
            </div>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Empowering Brokers to Sell & Manage Insurance with Ease
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  Abiraksha Insuretech — Your White-Labeled Digital Insurance Platform
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={goToDashboard}>Login to Your Dashboard</Button>
                  <Button variant="outline" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Explore Plans</Button>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[16/10] rounded-xl border shadow-[var(--shadow-card)] bg-card flex items-center justify-center">
                  {/* Placeholder hero illustration */}
                  <div className="text-center p-8">
                    <div className="flex items-center justify-center gap-6 mb-4">
                      <Building2 className="h-10 w-10 text-primary" />
                      <Heart className="h-10 w-10 text-primary" />
                      <Car className="h-10 w-10 text-primary" />
                      <Factory className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Modern multi-device dashboard, policy icons, and digital workflows</p>
                  </div>
                </div>
                <span className="sr-only">{heroImgAlt}</span>
              </div>
            </div>
          </section>

          {/* LOB categories */}
          <section id="features" className="container mx-auto px-4 py-12 md:py-16">
            <h2 className="text-2xl font-semibold mb-6">Insurance Product Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(lobs.length ? lobs : [
                { id: 'motor', lob_name: 'Motor Insurance', description: 'Cars, bikes, and commercial vehicles' },
                { id: 'health', lob_name: 'Health Insurance', description: 'Individual and family health plans' },
                { id: 'life', lob_name: 'Life Insurance', description: 'Term and savings plans' },
                { id: 'commercial', lob_name: 'Commercial Insurance', description: 'SME and enterprise covers' },
              ]).map((lob) => (
                <Card key={lob.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-base">{lob.lob_name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{lob.description ?? 'Explore products and pricing'}</p>
                    <Button variant="outline" onClick={() => navigate(`/products?lob_id=${lob.id}`)}>View Products</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Providers carousel */}
          <section className="bg-secondary/50 py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Trusted by</span>
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <Carousel opts={{ align: 'start', loop: true }}>
                <CarouselContent>
                  {providerList.map((p) => (
                    <CarouselItem key={p.id} className="basis-1/2 sm:basis-1/3 md:basis-1/6 lg:basis-1/8 px-2">
                      <div className="h-16 rounded-md bg-card border flex items-center justify-center">
                        {p.logo_url ? (
                          <img src={p.logo_url} alt={`${p.insurer_name} logo`} className="max-h-10 w-auto" loading="lazy" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{p.insurer_name}</span>
                        )}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </section>

          {/* Why choose */}
          <section className="container mx-auto px-4 py-12 md:py-16">
            <h2 className="text-2xl font-semibold mb-6">Why Choose Abiraksha Insuretech</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><CardTitle className="text-base">Fast Policy Issuance</CardTitle></div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Real-time generation with e-docs</CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /><CardTitle className="text-base">Secure Payments</CardTitle></div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Integrated gateway & receipts</CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-primary" /><CardTitle className="text-base">Multi-Insurer Options</CardTitle></div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">Nationwide insurer coverage</CardContent>
              </Card>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="bg-secondary/50 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Pricing & Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(plans).map((plan) => (
                  <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{plan.name}</CardTitle>
                        {plan.trial_days && plan.trial_days > 0 && (
                          <Badge variant="secondary">{plan.trial_days}-day trial</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold mb-2">
                        {plan.price_monthly === null ? 'Contact Us' : `₹${plan.price_monthly}/mo`}
                      </div>
                      <ul className="text-sm text-muted-foreground mb-4 list-disc pl-5 space-y-1">
                        {(plan.features ?? ['Core features', 'Basic support']).map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                      <Button onClick={goToDashboard}>{plan.price_monthly === 0 ? 'Start Free Trial' : 'Subscribe Now'}</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer id="contact" className="border-t">
          <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-3">
            <p>© 2025 {brandName} — All Rights Reserved</p>
            <div className="flex items-center gap-4">
              <a href="#" aria-label="Privacy Policy" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" aria-label="Terms of Service" className="hover:text-foreground">Terms of Service</a>
              <a href="#support" className="hover:text-foreground">Contact Support</a>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}
