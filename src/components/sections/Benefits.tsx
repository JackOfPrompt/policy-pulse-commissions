import { FileText, Bot, Building2, Lock } from "lucide-react";

const items = [
  { title: "Smart Policy Management", icon: FileText, text: "Track renewals, claims, and add-ons easily." },
  { title: "AI-Assisted Quoting", icon: Bot, text: "Generate accurate quotes instantly." },
  { title: "Multi-Tenant Control", icon: Building2, text: "Manage multiple agencies from one dashboard." },
  { title: "Secure & Compliant", icon: Lock, text: "Data encrypted and hosted on secure cloud." },
];

export function Benefits() {
  return (
    <section aria-labelledby="benefits-heading" className="container py-16">
      <h2 id="benefits-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        Key Benefits
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <article key={it.title} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-[var(--shadow-elevated)] transition-shadow">
            <it.icon aria-hidden className="h-6 w-6 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">{it.title}</h3>
            <p className="text-sm text-muted-foreground">{it.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
