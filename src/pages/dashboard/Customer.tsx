import React from "react";
import { Helmet } from "react-helmet-async";

const CustomerDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Customer Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="Customer dashboard to view policies, claims, and renewals." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/customer`} />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Customer Dashboard</h1>
          <p className="text-muted-foreground mt-2">Access your policies, claims, and support.</p>
        </header>
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Placeholder content. Add policy list and renewal reminders here.</p>
        </section>
      </main>
    </>
  );
};

export default CustomerDashboard;
