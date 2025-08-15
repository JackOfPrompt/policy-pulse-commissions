import { Check, Star, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    name: "Starter",
    icon: Zap,
    price: "₹2,999",
    period: "/month",
    description: "Perfect for small insurance agencies",
    features: [
      "Up to 100 policies",
      "Basic CRM features",
      "Email support",
      "Standard analytics",
      "2 user accounts",
      "Mobile app access"
    ],
    popular: false,
    color: "from-blue-500 to-indigo-500"
  },
  {
    name: "Professional",
    icon: Star,
    price: "₹5,999",
    period: "/month",
    description: "Ideal for growing insurance businesses",
    features: [
      "Up to 500 policies",
      "Advanced CRM & automation",
      "Priority phone support",
      "AI-powered analytics",
      "5 user accounts",
      "Custom integrations",
      "White-label options"
    ],
    popular: true,
    color: "from-green-500 to-emerald-500"
  },
  {
    name: "Enterprise",
    icon: Crown,
    price: "₹12,999",
    period: "/month",
    description: "Complete solution for large enterprises",
    features: [
      "Unlimited policies",
      "Full CRM suite with AI",
      "24/7 dedicated support",
      "Advanced business intelligence",
      "Unlimited users",
      "Custom development",
      "Multi-tenant architecture",
      "SLA guarantee"
    ],
    popular: false,
    color: "from-purple-500 to-pink-500"
  }
];

const SubscriptionPlans = () => {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Abiraksha Insurtech Platform
          </h2>
          <p className="text-lg text-muted-foreground mb-2">
            Multi-tenant SaaS platform for insurance professionals
          </p>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan to power your insurance business with our comprehensive platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-6 card-feature hover-lift ${plan.popular ? 'ring-2 ring-primary' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className={`w-12 h-12 bg-gradient-to-br ${plan.color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-secondary mr-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${plan.popular ? 'btn-hero' : 'btn-secondary'}`}
                onClick={() => window.open('https://lmvinsurance.in/', '_blank')}
              >
                {plan.popular ? 'Get Started' : 'Choose Plan'}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            All plans include 30-day free trial • No setup fees • Cancel anytime
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://lmvinsurance.in/', '_blank')}
          >
            Contact Sales for Custom Plans
          </Button>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlans;