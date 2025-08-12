import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Basic",
    subtitle: "For individual brokers",
    features: ["1 Tenant", "5 Users", "Basic Reporting"],
    featured: false,
  },
  {
    name: "Professional",
    subtitle: "For growing agencies",
    features: ["Unlimited Users", "Advanced Analytics", "API Access"],
    featured: true,
  },
  {
    name: "Enterprise",
    subtitle: "For large broker networks",
    features: ["White-label branding", "Custom Integrations", "Dedicated Support"],
    featured: false,
  },
];

export function Plans() {
  return (
    <section id="plans" aria-labelledby="plans-heading" className="container py-16">
      <h2 id="plans-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        Subscription Plans
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.featured ? "border-primary/40 shadow-[var(--shadow-elevated)]" : ""}>
            <CardHeader>
              <CardTitle className="flex items-baseline justify-between">
                <span>{plan.name}</span>
                {plan.featured && (
                  <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">Popular</span>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant={plan.featured ? "hero" : "default"} className={plan.featured ? "bg-[length:400%_100%]" : ""}>
                Choose Plan
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
