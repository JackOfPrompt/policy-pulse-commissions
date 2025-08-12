import React, { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { RequireRole } from "@/components/auth/RequireRole";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  slug: string; // path segment without spaces
  title: string; // display title
  description?: string;
  children?: ReactNode;
}

export default function SystemAdminModulePage({ slug, title, description, children }: Props) {
  const canonical = `${window.location.origin}/dashboard/system-admin/${slug}`;
  return (
    <>
      <Helmet>
        <title>{`System Admin - ${title} | Abiraksha Insurtech`}</title>
        <meta name="description" content={`${title} module for System Admin. ${description || "Manage and configure platform data."}`} />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <RequireRole allowedRoles={["System Admin"]}>
        <AdminLayout>
          <div className="container mx-auto max-w-[1400px] px-4 py-6 animate-fade-in">
            <section aria-labelledby="module-title" className="space-y-4">
              <header>
                <h1 id="module-title" className="text-3xl font-bold">{title}</h1>
              </header>
              {children ? (
                children
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">This section is under construction.</CardContent>
                </Card>
              )}
            </section>
          </div>
        </AdminLayout>
      </RequireRole>
    </>
  );
}
