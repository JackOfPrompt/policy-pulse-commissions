import React from "react";
import { Helmet } from "react-helmet-async";

const AgentDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Agent Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="Agent dashboard to manage leads, quotes, and renewals." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/agent`} />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Agent Dashboard</h1>
          <p className="text-muted-foreground mt-2">Track leads, proposals, and policies.</p>
        </header>
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Initial scaffold. Add pipeline charts and quick actions here.</p>
        </section>
      </main>
    </>
  );
};

export default AgentDashboard;
