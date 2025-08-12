const steps = [
  { title: "Sign Up & Select Role", text: "Choose Agent, Admin, or Support." },
  { title: "Add Clients & Policies", text: "Import data or add records manually." },
  { title: "Track Quotes, Renewals, and Claims", text: "Stay on top with reminders and dashboards." },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="container py-16">
      <h2 id="how-heading" className="text-2xl md:text-3xl font-semibold tracking-tight mb-8">
        How It Works
      </h2>
      <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, i) => (
          <li key={s.title} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-medium">
                {i + 1}
              </span>
              <h3 className="font-medium">{s.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
