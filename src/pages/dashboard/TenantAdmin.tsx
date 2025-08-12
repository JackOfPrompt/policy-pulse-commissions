import React from "react";
import { Helmet } from "react-helmet-async";

const TenantAdminDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Tenant Admin Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="Tenant Admin dashboard to manage tenant settings, teams, and policies." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/tenant-admin`} />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Tenant Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage tenant configuration, users, and access.</p>
        </header>
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Placeholder page. Add tenant metrics and management tools here.</p>
        </section>
      </main>
    </>
  );
};

export default TenantAdminDashboard;
