import { Car, HeartPulse, Heart, Home, Plane } from "lucide-react";

const products = [
  { name: "Motor Insurance", icon: Car },
  { name: "Health Insurance", icon: HeartPulse },
  { name: "Life Insurance", icon: Heart },
  { name: "Property Insurance", icon: Home },
  { name: "Travel Insurance", icon: Plane },
];

export function ProductsGrid() {
  return (
    <section aria-labelledby="products-heading" className="container py-16">
      <h2 id="products-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        Insurance Products
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {products.map((p) => (
          <article key={p.name} className="rounded-xl border bg-card p-4 flex items-center justify-center gap-2 hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <p.icon aria-hidden className="h-5 w-5 text-primary" />
            <span className="text-sm md:text-base">{p.name}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
