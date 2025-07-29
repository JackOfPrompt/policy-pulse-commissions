import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, FileText, BarChart3, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const features = [
    {
      icon: Shield,
      title: "Admin Portal",
      description: "Comprehensive administrative dashboard for insurance management",
      path: "/admin/overview"
    },
    {
      icon: Users,
      title: "Agent Management",
      description: "Manage insurance agents, track performance, and handle commissions",
      path: "/admin/agents"
    },
    {
      icon: FileText,
      title: "Policy Management",
      description: "Handle insurance policies, renewals, and customer coverage",
      path: "/admin/policies"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Generate comprehensive reports and business intelligence",
      path: "/admin/reports"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-primary text-primary-foreground">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-white/30">
              Insurance Management System
            </Badge>
            <h1 className="text-5xl font-bold mb-6">
              Admin Dashboard Portal
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Comprehensive insurance management system with powerful admin tools 
              for managing providers, agents, policies, and business analytics.
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                <Link to="/admin/overview">
                  Access Admin Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Powerful Admin Features
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Access all the tools you need to efficiently manage your insurance business 
            from a single, comprehensive dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card key={feature.title} className="shadow-card hover:shadow-lg transition-shadow group">
                <CardHeader>
                  <div className="p-3 bg-accent rounded-lg w-fit mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    asChild 
                    variant="outline" 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                  >
                    <Link to={feature.path}>
                      Access Module
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access */}
        <Card className="shadow-card bg-gradient-secondary">
          <CardContent className="pt-8">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Quick Access Dashboard
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Click below to access the admin dashboard directly. 
                No authentication required for immediate access to all features.
              </p>
              <Button 
                asChild 
                className="bg-gradient-primary shadow-primary"
              >
                <Link to="/admin/overview">
                  Go to Admin Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
