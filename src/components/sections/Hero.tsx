import { useEffect, useMemo, useState } from "react";
import heroImage from "@/assets/hero-agents-charts.jpg";
import { Button } from "@/components/ui/button";


const QUOTES = [
  "Insurance is the safety net for life's uncertainties.",
  "Smart brokers use smarter tools.",
  "Trust is built when data and empathy meet.",
  "Automation frees brokers to focus on relationships.",
  "Secure systems build confident customers.",
];

export function Hero() {
  const [index, setIndex] = useState(0);

  // pick a random starting quote for variety
  const startIndex = useMemo(() => Math.floor(Math.random() * QUOTES.length), []);

  useEffect(() => {
    setIndex(startIndex);
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % QUOTES.length);
    }, 300000); // 5 minutes
    return () => clearInterval(id);
  }, [startIndex]);


  return (
    <section aria-labelledby="hero-heading" className="container py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <article>
          <p className="text-sm text-muted-foreground mb-4" aria-live="polite">{QUOTES[index]}</p>
          <h1 id="hero-heading" className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simplify Insurance Broking with AI-Powered Automation
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Manage policies, customers, and quotes in one secure platform—built for modern brokers.
          </p>
          <div className="flex items-center gap-4">
            <Button asChild size="xl" variant="hero" className="bg-[length:400%_100%] animate-shine">
              <a href="/select-role" aria-label="Get started and select role">Get Started →</a>
            </Button>
            <a href="/auth" className="text-primary hover:underline">
              Login / Sign Up
            </a>
          </div>
        </article>

        <div className="relative">
          <figure className="rounded-xl border bg-card shadow-[var(--shadow-elevated)] p-2 md:p-3">
            <img
              src={heroImage}
              alt="Vector illustration of brokers and customers discussing over charts and dashboards"
              className="w-full h-auto rounded-lg select-none will-change-transform animate-float"
              draggable={false}
            />
          </figure>
        </div>
      </div>
    </section>
  );
}
