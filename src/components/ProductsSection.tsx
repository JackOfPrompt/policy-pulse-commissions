import { Heart, Car, Shield, Building2, Home, CreditCard, PawPrint, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLOBs } from "@/hooks/useLOBs";
import { LOBIcon } from "@/components/LOBIcon";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Fallback products with icons for when LOBs are not available
const fallbackProducts = [
  {
    icon: Heart,
    title: "Health Insurance",
    url: "https://www.lmvinsurance.com/health",
    gradient: "from-red-500 to-pink-500"
  },
  {
    icon: Car,
    title: "Motor Insurance", 
    url: "https://www.lmvinsurance.com/motor/car/details",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Shield,
    title: "Life Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Building2,
    title: "Commercial Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-purple-500 to-indigo-500"
  },
  {
    icon: Home,
    title: "Property Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-orange-500 to-amber-500"
  },
  {
    icon: CreditCard,
    title: "Loan Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-teal-500 to-cyan-500"
  },
  {
    icon: PawPrint,
    title: "Pet Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: Plane,
    title: "Travel Insurance",
    url: "https://www.lmvinsurance.com/",
    gradient: "from-indigo-500 to-blue-500"
  }
];

const gradients = [
  "from-red-500 to-pink-500",
  "from-blue-500 to-cyan-500",
  "from-green-500 to-emerald-500",
  "from-purple-500 to-indigo-500",
  "from-orange-500 to-amber-500",
  "from-teal-500 to-cyan-500",
  "from-pink-500 to-rose-500",
  "from-indigo-500 to-blue-500"
];

const ProductsSection = () => {
  const { lobs, loading, error } = useLOBs();

  if (loading) {
    return (
      <section id="products" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Insurance Products
            </h2>
          </div>
          <Carousel className="w-full">
            <CarouselContent>
              {Array.from({ length: 8 }).map((_, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/4">
                  <div className="card-product">
                    <div className="flex flex-col items-center text-center h-full p-4">
                      <Skeleton className="w-12 h-12 rounded-lg mb-3" />
                      <Skeleton className="h-4 w-24 mb-3" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>
    );
  }

  // Use LOBs if available, otherwise fallback to static products
  const products = lobs.length > 0 ? lobs : fallbackProducts;

  return (
    <section id="products" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Our Insurance Products
          </h2>
        </div>

        <Carousel className="w-full">
          <CarouselContent>
            {products.map((product, index) => {
              // For LOBs, use different properties
              const isLOB = 'lob_id' in product;
              const title = isLOB ? product.lob_name : product.title;
              const url = isLOB ? "https://www.lmvinsurance.com/" : product.url;
              const gradient = isLOB ? gradients[index % gradients.length] : product.gradient;
              
              return (
                <CarouselItem key={isLOB ? product.lob_id : index} className="md:basis-1/2 lg:basis-1/4">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="card-product group cursor-pointer block"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex flex-col items-center text-center h-full p-4">
                      {isLOB ? (
                        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                          {product.icon_file_path ? (
                            <LOBIcon 
                              iconPath={product.icon_file_path} 
                              lobName={product.lob_name} 
                              size="sm"
                              className="brightness-0 invert"
                            />
                          ) : (
                            <Shield className="w-6 h-6 text-white" />
                          )}
                        </div>
                      ) : (
                        <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                          <product.icon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <h3 className="text-sm font-semibold text-foreground mb-3">
                        {title}
                      </h3>
                      
                      <div className="mt-auto">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 text-xs"
                        >
                          Learn More →
                        </Button>
                      </div>
                    </div>
                  </a>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="text-center mt-12">
          <a 
            href="https://www.lmvinsurance.com/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="btn-accent">
              View All Products & Get Quotes
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;