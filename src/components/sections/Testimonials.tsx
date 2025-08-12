const testimonials = [
  {
    quote: "Abiraksha streamlined our renewals and cut quoting time in half.",
    author: "Priya S, Independent Broker",
  },
  {
    quote: "The AI suggestions are surprisingly accurate—and save hours.",
    author: "Rahul M, Agency Owner",
  },
  {
    quote: "Secure, fast, and easy to onboard our team.",
    author: "Neha K, Operations Lead",
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="container py-16">
      <h2 id="testimonials-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        What Brokers Say
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <figure key={t.author} className="rounded-xl border bg-card p-6 shadow-sm">
            <blockquote className="text-sm md:text-base">“{t.quote}”</blockquote>
            <figcaption className="mt-3 text-xs text-muted-foreground">{t.author}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
