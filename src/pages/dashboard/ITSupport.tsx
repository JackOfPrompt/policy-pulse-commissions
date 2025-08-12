import React from "react";
import { Helmet } from "react-helmet-async";

const ITSupportDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>IT Support Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="IT Support dashboard for monitoring system health and resolving issues." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/it-support`} />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">IT Support Dashboard</h1>
          <p className="text-muted-foreground mt-2">Monitor incidents, logs, and platform status.</p>
        </header>
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Minimal placeholder. Add alerts, tickets, and tools here.</p>
        </section>
      </main>
    </>
  );
};

export default ITSupportDashboard;
