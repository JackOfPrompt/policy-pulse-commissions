import { useNavigate } from "react-router-dom";
import useProviders from "@/hooks/useProviders";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
const ProvidersSection = () => {
  const navigate = useNavigate();
  const { providers, loading, error } = useProviders();
  
  const handleProviderClick = (providerId: string) => {
    navigate(`/plan-comparison?provider=${providerId}`);
  };

  if (error) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-destructive">Failed to load insurance providers</p>
        </div>
      </section>
    );
  }
  return <section className="py-16 bg-muted/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Trusted Insurance Providers
          </h2>
          
        </div>

        <Carousel className="w-full mb-12">
          <CarouselContent>
            {loading ? (
              // Show skeleton loading
              Array.from({ length: 12 }).map((_, index) => (
                <CarouselItem key={index} className="md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
                  <div className="bg-card p-6 rounded-xl">
                    <div className="text-center">
                      <Skeleton className="w-12 h-12 mx-auto mb-3 rounded" />
                      <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                  </div>
                </CarouselItem>
              ))
            ) : (
              providers.map((provider, index) => (
                <CarouselItem key={provider.provider_id} className="md:basis-1/3 lg:basis-1/4 xl:basis-1/6">
                  <div 
                    className="bg-card p-6 rounded-xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:-translate-y-1 cursor-pointer group" 
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleProviderClick(provider.provider_code)}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {provider.logo_file_path ? (
                          <img 
                            src={provider.logo_file_path} 
                            alt={`${provider.provider_name} logo`}
                            className="w-12 h-12 mx-auto object-contain"
                          />
                        ) : (
                          "🏢"
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-foreground leading-tight">
                        {provider.trade_name || provider.provider_name}
                      </h3>
                    </div>
                  </div>
                </CarouselItem>
              ))
            )}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="text-center">
          <a href="https://www.lmvinsurance.com/" target="_blank" rel="noopener noreferrer">
            <button className="btn-secondary">
              View All Products →
            </button>
          </a>
        </div>
      </div>
    </section>;
};
export default ProvidersSection;