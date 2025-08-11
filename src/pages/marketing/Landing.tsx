import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Shield, Building2, Heart, Car, Factory, Sparkles, Lock, Globe2, Linkedin, Twitter, Mail, BarChart3, Layers, ShoppingCart } from 'lucide-react';
import { useTenantBranding } from '@/hooks/useTenantBranding';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import QuoteOfTheDay from '@/components/marketing/QuoteOfTheDay';

interface LOB { id: string; lob_name: string; description?: string | null }
interface Provider { id: string; insurer_name: string; logo_url?: string | null }
interface Plan { plan_id: string; plan_name: string; monthly_price: number | null; annual_price: number | null; features?: any; trial_days?: number | null }

export default function Landing() {
  const navigate = useNavigate();
  const { brandName, logoUrl, isTenantSubdomain } = useTenantBranding();
  const { toast } = useToast();

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
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('plan_id, plan_name, monthly_price, annual_price, features, trial_days, is_active')
          .eq('is_active', true)
          .order('monthly_price', { ascending: true });
        if (active && planData) {
          setPlans(planData as any);
        }
      } catch {
        if (active) {
          setPlans([
            { plan_id: 'starter', plan_name: 'Starter', monthly_price: 0, annual_price: 0, features: ['Tenant-branded portal', 'Up to 3 users', 'Email support'], trial_days: 14 },
            { plan_id: 'pro', plan_name: 'Pro', monthly_price: 1999, annual_price: 19990, features: ['Unlimited users', 'Policy workflows', 'Provider integrations'] },
            { plan_id: 'enterprise', plan_name: 'Enterprise', monthly_price: null, annual_price: null, features: ['Custom SLA', 'Dedicated support', 'SSO, Audit logs'] },
          ] as any);
        }
      }
    })();
    return () => { active = false; };
  }, []);

const goToDashboard = () => {
    if (isTenantSubdomain) navigate('/tenant/overview');
    else navigate('/tenant-select');
  };

  const handleSeed = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('seed-test-auth');
      if (error) throw error;
      toast({ title: 'Seeding complete', description: 'Tenants and admins created. Check console for details.' });
      console.log('seed-test-auth result:', data);
    } catch (e: any) {
      // Show detailed error body from Edge Function if available
      try {
        const resp = e?.context?.response;
        const bodyText = resp ? await resp.text() : '';
        toast({ title: 'Seeding failed', description: bodyText || e?.message || 'Unknown error' });
        console.error('seed-test-auth error:', e, bodyText);
      } catch {
        toast({ title: 'Seeding failed', description: e?.message || 'Unknown error' });
        console.error('seed-test-auth error:', e);
      }
    }
  };

  const heroImgAlt = `${brandName} insurance SaaS dashboard illustration`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brandName,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: "White-labeled SaaS for insurance broking to manage policies and enable online purchases.",
    url: window.location.origin,
    offers: [
      { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "INR" },
      { "@type": "Offer", name: "Professional", price: "1999", priceCurrency: "INR" },
      { "@type": "Offer", name: "Enterprise", price: "0", priceCurrency: "INR", availability: "https://schema.org/PreOrder" }
    ]
  };

  return (
    <HelmetProvider>
      <div className="abiraksha-landing font-inter min-h-screen bg-background">
        <Helmet>
          <title>Abiraksha Insuretech — Next-Gen Broker SaaS</title>
          <meta name="description" content="White-labeled SaaS for insurance broking: manage policies, enable online purchases, and streamline operations." />
          <link rel="canonical" href={window.location.href} />
          <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
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
              <a href="#" className="hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <a href="#contact" className="hover:text-foreground transition-colors">Contact</a>
              <a href="/tenant-select" onClick={(e) => { e.preventDefault(); navigate('/tenant-select'); }} className="hover:text-foreground transition-colors">Login</a>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/tenant-select')}>Login</Button>
            </div>
          </div>
        </header>

        <main>
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5">
            <div className="container mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                  Empowering Insurance Brokers with Next-Gen Technology
                </h1>
                <div className="flex">
                  <Button onClick={() => navigate('/tenant-select')}>Login</Button>
                </div>
              </div>
              <div className="relative">
                <QuoteOfTheDay />
                <span className="sr-only">{heroImgAlt}</span>
              </div>
            </div>
          </section>

          {/* LOB categories - icon view */}
          <section id="categories" className="container mx-auto px-4 py-12 md:py-16">
            <h2 className="text-2xl font-semibold mb-6">Insurance Product Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { id: 'motor', name: 'Motor Insurance', Icon: Car },
                { id: 'health', name: 'Health Insurance', Icon: Heart },
                { id: 'life', name: 'Life Insurance', Icon: Shield },
                { id: 'commercial', name: 'Commercial', Icon: Factory },
                { id: 'global', name: 'Travel', Icon: Globe2 },
                { id: 'secure', name: 'Cyber', Icon: Lock },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="group rounded-xl border border-border/50 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 p-6 text-left hover:shadow-primary transition-smooth hover:scale-[1.02]"
                  onClick={() => navigate(`/products?category=${c.id}`)}
                  aria-label={`Explore ${c.name}`}
                >
                  <c.Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="mt-3 text-sm font-medium">{c.name}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Trusted by insurers - logo carousel */}
          <section className="bg-secondary/50 backdrop-blur supports-[backdrop-filter]:bg-secondary/50 py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Trusted by insurers</h2>
              <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]}
                className="w-full"
              >
                <CarouselContent>
                  {providerList.map((p) => {
                    const logoSrc = p.logo_url && p.logo_url.startsWith('http')
                      ? p.logo_url
                      : (p.logo_url ? `https://vnrwnqcoytwdinlxswqe.supabase.co/storage/v1/object/public/provider-documents/${p.logo_url}` : null);
                    return (
                      <CarouselItem key={p.id} className="basis-1/2 sm:basis-1/3 md:basis-1/5 lg:basis-1/6">
                        <div className="h-16 rounded-md bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 border border-border/50 flex items-center justify-center hover:shadow-primary transition hover-scale">
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={`${p.insurer_name} logo`}
                              className="max-h-10 w-auto"
                              loading="lazy"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">{p.insurer_name}</span>
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <CarouselPrevious className="hidden md:inline-flex" />
                <CarouselNext className="hidden md:inline-flex" />
              </Carousel>
            </div>
          </section>

          {/* Features */}
          <section className="container mx-auto px-4 py-12 md:py-16" id="features">
            <h2 className="text-2xl font-semibold mb-6">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm hover:shadow-primary transition-smooth hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Online Policy Purchase</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Sell and manage policies seamlessly online
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-primary transition-smooth hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Multi-Tenant Platform</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Serve multiple branches or clients with isolated data
                </CardContent>
              </Card>
              <Card className="shadow-sm hover:shadow-primary transition-smooth hover:scale-[1.01]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">Advanced Analytics</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Gain insights with real-time dashboards
                </CardContent>
              </Card>
            </div>
          </section>

          {/* About */}
          <section className="container mx-auto px-4 py-12 md:py-16" id="about">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-semibold mb-4">About Abiraksha Insuretech</h2>
                <p className="text-muted-foreground">
                  Abiraksha Insuretech is a white-labeled SaaS platform built for insurance broking companies. 
                  Manage end-to-end policy lifecycles, enable secure online purchases, and streamline operations 
                  across branches with powerful workflows, approvals, and integrations.
                </p>
              </div>
              <Card className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 border border-border/50">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Digital onboarding and KYC</li>
                    <li>Provider and product catalog management</li>
                    <li>Commission automation and reports</li>
                    <li>Renewals and reminders</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="bg-secondary/50 py-12 md:py-16">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-semibold mb-6">Pricing & Plans</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(plans.length ? plans : [
                  { plan_id: 'free', plan_name: 'Free', monthly_price: 0, annual_price: 0, features: ['Branding','Policies','Reports'], trial_days: 0 },
                ]).map((plan) => {
                  const hasPrice = plan.monthly_price != null || plan.annual_price != null;
                  const priceLabel = plan.monthly_price != null
                    ? `₹${Number(plan.monthly_price).toLocaleString()}`
                    : (plan.annual_price != null ? `₹${Number(plan.annual_price).toLocaleString()}` : 'Contact Us');
                  const priceSuffix = plan.monthly_price != null ? '/mo' : (plan.annual_price != null ? '/yr' : '');
                  const features = Array.isArray(plan.features) ? plan.features : [];
                  return (
                    <Card key={plan.plan_id} className="bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60 border border-border/50 hover:shadow-primary transition-smooth hover:scale-[1.01]">
                      <CardHeader>
                        <CardTitle>{plan.plan_name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold mb-2">{priceLabel}{priceSuffix && <span className="text-base text-muted-foreground">{priceSuffix}</span>}</p>
                        {typeof plan.trial_days === 'number' && plan.trial_days > 0 && (
                          <p className="text-muted-foreground mb-4">{plan.trial_days}-day free trial</p>
                        )}
                        {features.length > 0 && (
                          <ul className="text-sm text-muted-foreground mb-6 list-disc pl-5 space-y-1">
                            {features.slice(0, 6).map((f: any, idx: number) => (
                              <li key={idx}>{String(f)}</li>
                            ))}
                          </ul>
                        )}
                        <Button variant={hasPrice ? 'default' : 'outline'} onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
                          {hasPrice ? `Choose ${plan.plan_name}` : 'Talk to Sales'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>
        </main>

        <footer id="contact" className="border-t">
          <div className="container mx-auto px-4 py-8 text-sm text-muted-foreground grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-semibold text-foreground mb-2">Abiraksha Insuretech</p>
              <p>White-labeled SaaS for insurance brokers</p>
            </div>
            <div>
              <p className="font-semibold text-foreground mb-2">Contact</p>
              <p>Email: support@abiraksha.example</p>
              <p>Phone: +91-00000-00000</p>
            </div>
            <div className="flex items-center md:justify-end gap-4">
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground transition-colors"><Linkedin className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="mailto:support@abiraksha.example" aria-label="Email" className="hover:text-foreground transition-colors"><Mail className="h-5 w-5" /></a>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
}
