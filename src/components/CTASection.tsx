import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import ctaImage from "@/assets/cta-illustration.jpg";

const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary to-secondary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/20 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-white/20 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-white/10 rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Start Your Insurance Journey Today
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Compare, buy, and manage policies from India's top providers in one platform. 
              Experience seamless insurance with personalized recommendations and transparent pricing.
            </p>

            {/* Benefits List */}
            <div className="mb-8 space-y-3">
              {[
                "Instant policy comparison across multiple providers",
                "AI-powered personalized recommendations",
                "24/7 customer support and claims assistance",
                "Transparent pricing with no hidden charges"
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white/90">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://www.lmvinsurance.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block"
              >
                <Button className="bg-white text-primary hover:bg-white/90 px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 group">
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              
              <Button 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
              >
                Contact Sales
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-2xl">
              <img 
                src={ctaImage} 
                alt="Digital insurance platform dashboard showing policy management interface"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-white text-primary p-4 rounded-xl shadow-lg">
              <div className="text-2xl font-bold">₹50L+</div>
              <div className="text-sm">Coverage Available</div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-secondary text-white p-4 rounded-xl shadow-lg">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;