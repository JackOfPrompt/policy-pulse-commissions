import React from "react";
import { Helmet } from "react-helmet-async";

const EmployeeDashboard: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Employee Dashboard | Abiraksha Insurtech</title>
        <meta name="description" content="Employee dashboard to access tasks, policies, and resources." />
        <link rel="canonical" href={`${window.location.origin}/dashboard/employee`} />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground mt-2">Your work hub: tasks, documents, and shortcuts.</p>
        </header>
        <section className="rounded-lg border bg-card p-6">
          <p className="text-sm text-muted-foreground">Starter content. Add task lists and helpful links here.</p>
        </section>
      </main>
    </>
  );
};

export default EmployeeDashboard;
