import { Shield, Users, TrendingUp, Handshake, Brain, Headphones } from "lucide-react";
const features = [{
  icon: Shield,
  title: "Trusted for 10+ Years",
  description: "A decade of reliable insurance services and customer satisfaction"
}, {
  icon: Users,
  title: "Thousands of Satisfied Customers",
  description: "Join our growing community of protected and happy policyholders"
}, {
  icon: TrendingUp,
  title: "Crores of Insured Amount",
  description: "Successfully managing substantial insurance portfolios with expertise"
}, {
  icon: Handshake,
  title: "Multi-Provider Partnerships",
  description: "Extensive network with India's leading insurance companies"
}, {
  icon: Brain,
  title: "AI-Powered CRM & Analytics",
  description: "Smart technology for personalized recommendations and insights"
}, {
  icon: Headphones,
  title: "24/7 Customer Support",
  description: "Round-the-clock assistance for all your insurance needs"
}];
const WhyChooseSection = () => {
  return <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose LMV Insurance?
          </h2>
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => <div key={index} className="card-feature hover-lift group text-center p-5" style={{
          animationDelay: `${index * 0.1}s`
        }}>
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
export default WhyChooseSection;