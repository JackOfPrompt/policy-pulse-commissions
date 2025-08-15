import { CheckCircle, Shield, Users, TrendingUp, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import useProviders from "@/hooks/useProviders";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Transparency",
      description: "Clear policies, no hidden clauses"
    },
    {
      icon: Heart,
      title: "Customer-First",
      description: "Every decision prioritizes customer benefit"
    },
    {
      icon: TrendingUp,
      title: "Innovation",
      description: "AI-powered CRM, business analytics, and digital solutions"
    },
    {
      icon: Award,
      title: "Integrity",
      description: "Ethical practices in all services"
    }
  ];

  const journey = [
    { year: "2013", milestone: "LMV Insurance founded" },
    { year: "2015", milestone: "Crossed 10,000 satisfied customers" },
    { year: "2018", milestone: "Launched our digital CRM platform" },
    { year: "2020", milestone: "Partnered with 30+ top insurance providers" },
    { year: "2025", milestone: "Managing crores of insured amounts across thousands of policies" }
  ];

  const insuranceLines = [
    "Health Insurance",
    "Motor Insurance", 
    "Life Insurance",
    "Commercial Insurance",
    "Property Insurance",
    "Loan & Credit Insurance",
    "Pet Insurance",
    "Travel Insurance"
  ];

  const { providers } = useProviders();

  const whyChooseReasons = [
    "10+ years of experience in insurance broking",
    "Thousands of satisfied customers",
    "Crores of insured amount handled",
    "Multi-provider partnerships for comparison and choice",
    "AI-powered CRM & analytics for seamless customer experience",
    "24/7 customer support"
  ];

  const teamDepartments = [
    "Leadership & Management",
    "Operations & Customer Support", 
    "Product & Technology",
    "Analytics & AI"
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary to-secondary text-primary-foreground py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold mb-6">About LMV Insurance</h1>
              <p className="text-xl md:text-2xl opacity-90 leading-relaxed">
                Leading insurance broking company in India, with over 10 years of trusted service, 
                helping thousands protect their lives, assets, and businesses.
              </p>
            </div>
          </div>
        </section>

        {/* Who We Are */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold mb-16 text-foreground">Who We Are</h2>
              <div className="prose prose-lg max-w-none text-muted-foreground mb-12">
                <p className="text-lg leading-relaxed mb-8">
                  LMV Insurance is a leading insurance broking company in India, with over 10 years of trusted service. 
                  We help thousands of customers protect their lives, assets, and businesses by offering comprehensive 
                  insurance solutions across multiple lines of business, including:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {insuranceLines.map((line, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-secondary mr-3 flex-shrink-0" />
                      <span className="text-muted-foreground">{line}</span>
                    </div>
                  ))}
                </div>
                
                <p className="text-lg leading-relaxed">
                  Partnered with India's top insurance providers, we ensure transparency, reliability, 
                  and the best coverage for every customer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-foreground">Our Mission & Vision</h2>
              <div className="grid lg:grid-cols-2 gap-12">
                <Card className="p-8 card-feature">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Mission</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To empower individuals and businesses to make informed insurance decisions, 
                    providing simple, transparent, and reliable solutions.
                  </p>
                </Card>
                <Card className="p-8 card-feature">
                  <h3 className="text-2xl font-bold mb-4 text-foreground">Vision</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    To simplify insurance across India by leveraging digital innovation and trusted partnerships, 
                    making insurance accessible to everyone.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-foreground">Core Values</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <Card key={index} className="p-6 text-center card-feature hover-lift">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-lg mb-4">
                      <value.icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{value.title}</h3>
                    <p className="text-muted-foreground text-sm">{value.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Our Journey */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-16 text-foreground">Our Journey</h2>
              <p className="text-lg text-muted-foreground text-center mb-12">
                LMV Insurance has grown steadily over the past decade, building trust with customers and providers alike:
              </p>
              <div className="space-y-8">
                {journey.map((item, index) => (
                  <div key={index} className="flex items-center gap-6">
                    <div className="flex-shrink-0 w-20 h-20 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-lg">{item.year}</span>
                    </div>
                    <Card className="flex-1 p-6 card-feature">
                      <p className="text-muted-foreground font-medium">{item.milestone}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-8 text-foreground">Our Team</h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                Our experienced team combines industry expertise with digital innovation to deliver 
                end-to-end insurance solutions. Key roles include:
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamDepartments.map((department, index) => (
                  <Card key={index} className="p-6 card-feature hover-lift">
                    <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{department}</h3>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Insurance Providers */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-8 text-foreground">
                Our Trusted Insurance Providers
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                We partner with India's leading insurance providers across multiple categories 
                to ensure comprehensive coverage:
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {providers.map((provider) => (
                  <div key={provider.provider_id} className="p-4 bg-card rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <p className="text-sm text-muted-foreground">{provider.trade_name || provider.provider_name}</p>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Button 
                  size="lg" 
                  className="btn-secondary"
                  onClick={() => window.location.href = '/products'}
                >
                  Explore Our Products →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose LMV */}
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-12 text-foreground">Why Choose LMV Insurance?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {whyChooseReasons.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <CheckCircle className="h-6 w-6 text-secondary flex-shrink-0" />
                    <span className="text-muted-foreground text-left">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Start Your Insurance Journey Today</h2>
            <p className="text-xl mb-8 opacity-90">
              Compare, choose, and purchase insurance policies online from India's top providers with LMV Insurance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="btn-hero bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => window.open('https://lmvinsurance.in/', '_blank')}
              >
                Get Started →
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                onClick={() => window.location.href = '/products'}
              >
                Explore Our Products →
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default About;