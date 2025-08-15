import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Heart, Car, Building2 } from "lucide-react";
import heroImage from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  const scrollToProducts = () => {
    const element = document.getElementById('products');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Happy family with car and house representing comprehensive insurance coverage"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-secondary/80"></div>
      </div>

      {/* Floating Insurance Icons */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Shield className="absolute top-20 left-20 w-8 h-8 text-white/30 animate-bounce" style={{ animationDelay: '0s' }} />
        <Heart className="absolute top-32 right-32 w-6 h-6 text-white/30 animate-bounce" style={{ animationDelay: '0.5s' }} />
        <Car className="absolute bottom-40 left-40 w-7 h-7 text-white/30 animate-bounce" style={{ animationDelay: '1s' }} />
        <Building2 className="absolute bottom-32 right-24 w-6 h-6 text-white/30 animate-bounce" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
        <div className="fade-in-up animate">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Simplifying Insurance for You
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-4 font-medium">
            Health, Life, Motor, Commercial & More
          </p>
        </div>
        
        <div className="fade-in-up animate" style={{ animationDelay: '0.2s' }}>
          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
            Trusted by thousands of customers over 10 years, covering crores of insured amount 
            with India's top insurance providers.
          </p>
        </div>
        
        <div className="fade-in-up animate flex flex-col sm:flex-row gap-6 justify-center items-center" style={{ animationDelay: '0.4s' }}>
          <a 
            href="https://www.lmvinsurance.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button className="btn-hero group" size="lg">
              Explore Policies
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </a>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={scrollToProducts}
            className="btn-secondary"
          >
            Learn More
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="fade-in-up animate mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto" style={{ animationDelay: '0.6s' }}>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">10+</div>
            <div className="text-white/80 text-sm">Years of Trust</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">10,000+</div>
            <div className="text-white/80 text-sm">Happy Customers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl md:text-3xl font-bold text-white mb-2">₹500Cr+</div>
            <div className="text-white/80 text-sm">Insured Amount</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;