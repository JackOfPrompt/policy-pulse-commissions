import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyChooseSection from "@/components/WhyChooseSection";
import ProductsSection from "@/components/ProductsSection";
import ProvidersSection from "@/components/ProvidersSection";
import FeaturesSection from "@/components/FeaturesSection";
import SubscriptionPlans from "@/components/SubscriptionPlans";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import AdminCredentials from "@/components/AdminCredentials";
const Index = () => {
  return <div className="min-h-screen">
      <Header />
      <div className="pt-16">
        <HeroSection />
        
        {/* Admin Credentials - Development only */}
        
        
        <WhyChooseSection />
        <ProductsSection />
        <ProvidersSection />
        <FeaturesSection />
        <SubscriptionPlans />
        <CTASection />
        <Footer />
      </div>
    </div>;
};
export default Index;