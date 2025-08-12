import { Helmet } from "react-helmet-async";
import { Hero } from "@/components/sections/Hero";
import { Benefits } from "@/components/sections/Benefits";
import { ProductIntro } from "@/components/sections/ProductIntro";
import { Plans } from "@/components/sections/Plans";
import { ProductsGrid } from "@/components/sections/ProductsGrid";
import { Providers } from "@/components/sections/Providers";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { Footer } from "@/components/sections/Footer";

const Index = () => {
  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const ldOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Abiraksha Insurtech",
    url: canonical,
  };
  const ldSoftware = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Abiraksha Insurtech",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "AI-powered insurance broking platform to manage policies, customers, and quotes securely.",
  };

  return (
    <>
      <Helmet>
        <title>Abiraksha Insurtech – AI-Powered Insurance Broking</title>
        <meta
          name="description"
          content="Simplify insurance broking with AI. Manage policies, customers, and quotes in one secure platform."
        />
        {canonical && <link rel="canonical" href={canonical} />}
        <meta property="og:title" content="Abiraksha Insurtech – AI-Powered Insurance Broking" />
        <meta property="og:description" content="Simplify insurance broking with AI. Manage policies, customers, and quotes in one secure platform." />
        <script type="application/ld+json">{JSON.stringify(ldOrganization)}</script>
        <script type="application/ld+json">{JSON.stringify(ldSoftware)}</script>
      </Helmet>

      <header className="border-b">
        <div className="container h-14 flex items-center justify-between">
          <a href="#" className="font-semibold">Abiraksha Insurtech</a>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#plans" className="hover:text-foreground">Plans</a>
            <a href="#providers" className="hover:text-foreground">Providers</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>
        </div>
      </header>

      <main>
        <Hero />
        <Benefits />
        <ProductIntro />
        <Plans />
        <ProductsGrid />
        <Providers />
        <HowItWorks />
        <Testimonials />
      </main>

      <Footer />
    </>
  );
};

export default Index;
