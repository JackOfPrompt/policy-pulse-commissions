const providers = ["Allianz", "AXA", "AIG", "Zurich", "MetLife", "Chubb"];

export function Providers() {
  return (
    <section id="providers" aria-labelledby="providers-heading" className="container py-16">
      <h2 id="providers-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        Trusted Providers
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 items-center">
        {providers.map((p) => (
          <div
            key={p}
            className="h-14 rounded-lg border bg-card flex items-center justify-center text-sm text-muted-foreground grayscale hover:grayscale-0 transition"
            aria-label={`Provider: ${p}`}
            title={p}
          >
            {p}
          </div>
        ))}
      </div>
    </section>
  );
}
