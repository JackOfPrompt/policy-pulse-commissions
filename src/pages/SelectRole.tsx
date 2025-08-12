import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const roles = [
  { name: "System Admin", emoji: "🛠️" },
  { name: "System IT Support", emoji: "💻" },
  { name: "Tenant Admin", emoji: "🏢" },
  { name: "Tenant Employee", emoji: "👔" },
  { name: "Tenant Agent", emoji: "📋" },
  { name: "Customer", emoji: "🙋‍♂️" },
];

const SelectRole: React.FC = () => {
  const navigate = useNavigate();

  const handleSelect = (roleName: string) => {
    try {
      localStorage.setItem("selectedRole", roleName);
    } catch {}
    navigate("/auth");
  };

  return (
    <>
      <Helmet>
        <title>Select Role | Abiraksha Insurtech</title>
        <meta name="description" content="Select your role to get started with Abiraksha Insurtech platform." />
        <link rel="canonical" href={`${window.location.origin}/select-role`} />
      </Helmet>
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Select your role</h1>
          <p className="text-muted-foreground mt-2">This helps us tailor your dashboard and permissions.</p>
        </header>
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <Button key={r.name} variant="outline" className="justify-start h-auto py-6" onClick={() => handleSelect(r.name)} aria-label={`Select ${r.name}`}>
              <span className="mr-3 text-2xl" aria-hidden>
                {r.emoji}
              </span>
              <span className="text-left">
                <span className="block font-semibold">{r.name}</span>
              </span>
            </Button>
          ))}
        </section>
      </main>
    </>
  );
};

export default SelectRole;
