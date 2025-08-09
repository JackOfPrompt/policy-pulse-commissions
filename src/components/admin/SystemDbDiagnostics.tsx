import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Database } from "lucide-react";

interface TestResult {
  step: string;
  status: "idle" | "running" | "success" | "error";
  message?: string;
}

export default function SystemDbDiagnostics() {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  // Simple input state aligned to table columns we know exist
  const [lob, setLob] = useState({ lob_code: "MOTOR", lob_name: "Motor", description: "Motor Insurance" });
  const [provider, setProvider] = useState({ insurer_name: "TEST INSURER", contact_email: "test@insurer.com", phone_number: "9999999999", website: "https://example.com" });
  const [product, setProduct] = useState({ product_name: "TEST PRODUCT", product_code: "TP-001" });

  const pushResult = (step: string, status: TestResult["status"], message?: string) =>
    setResults((r) => [...r, { step, status, message }]);

  const reset = () => setResults([]);

  const runCrudTests = async () => {
    if (running) return;
    setRunning(true);
    reset();

    const ns = Date.now();
    let createdLobId: string | null = null;
    let createdProviderId: string | null = null;
    let createdProductId: string | null = null;

    try {
      pushResult("Check connectivity", "running");
      const { data: ping, error: pingErr } = await supabase.from("lines_of_business").select("lob_id").limit(1);
      if (pingErr) throw pingErr;
      pushResult("Check connectivity", "success", `OK (${ping?.length ?? 0} rows visible)`);

      // Create LOB
      pushResult("Create LOB", "running");
      const { data: lobIns, error: lobErr } = await supabase
        .from("lines_of_business")
        .insert({
          lob_code: `${lob.lob_code}-${ns}`,
          lob_name: `${lob.lob_name} ${ns}`,
          description: lob.description,
          is_active: true,
        })
        .select("lob_id")
        .maybeSingle();
      if (lobErr) throw lobErr;
      createdLobId = lobIns?.lob_id ?? null;
      pushResult("Create LOB", "success", createdLobId ? `lob_id=${createdLobId}` : "Created (no id returned)");

      // Create Provider
      pushResult("Create Provider", "running");
      const { data: provIns, error: provErr } = await supabase
        .from("insurance_providers")
        .insert({
          insurer_name: `${provider.insurer_name} ${ns}`,
          contact_email: provider.contact_email,
          phone_number: provider.phone_number,
          website: provider.website,
          status: "Active",
        })
        .select("provider_id")
        .maybeSingle();
      if (provErr) throw provErr;
      createdProviderId = provIns?.provider_id ?? null;
      pushResult("Create Provider", "success", createdProviderId ? `provider_id=${createdProviderId}` : "Created (no id returned)");

      // Create Product (requires provider_id & lob_id)
      pushResult("Create Product", "running");
      const { data: prodIns, error: prodErr } = await supabase
        .from("insurance_products")
        .insert({
          product_name: `${product.product_name} ${ns}`,
          product_code: `${product.product_code}-${ns}`,
          provider_id: createdProviderId,
          lob_id: createdLobId,
          status: "Active",
        })
        .select("product_id, product_code")
        .maybeSingle();
      if (prodErr) throw prodErr;
      createdProductId = prodIns?.product_id ?? null;
      pushResult("Create Product", "success", createdProductId ? `product_id=${createdProductId}` : "Created (no id returned)");

      // Read Product
      pushResult("Read Product", "running");
      const { data: prodRead, error: prodReadErr } = await supabase
        .from("insurance_products")
        .select("product_id, product_code, product_name")
        .eq("product_id", createdProductId)
        .maybeSingle();
      if (prodReadErr) throw prodReadErr;
      pushResult("Read Product", "success", prodRead ? `Found ${prodRead.product_code}` : "No row");

      // Update Product
      pushResult("Update Product", "running");
      const { error: prodUpdErr } = await supabase
        .from("insurance_products")
        .update({ product_code: `${product.product_code}-${ns}-UPD` })
        .eq("product_id", createdProductId);
      if (prodUpdErr) throw prodUpdErr;
      pushResult("Update Product", "success", "Updated code");

      // Cleanup delete Product
      pushResult("Delete Product", "running");
      const { error: prodDelErr } = await supabase
        .from("insurance_products")
        .delete()
        .eq("product_id", createdProductId);
      if (prodDelErr) throw prodDelErr;
      pushResult("Delete Product", "success");

      // Cleanup Provider
      pushResult("Delete Provider", "running");
      const { error: provDelErr } = await supabase
        .from("insurance_providers")
        .delete()
        .eq("provider_id", createdProviderId);
      if (provDelErr) throw provDelErr;
      pushResult("Delete Provider", "success");

      // Cleanup LOB
      pushResult("Delete LOB", "running");
      const { error: lobDelErr } = await supabase
        .from("lines_of_business")
        .delete()
        .eq("lob_id", createdLobId);
      if (lobDelErr) throw lobDelErr;
      pushResult("Delete LOB", "success");

      toast({ title: "Diagnostics completed", description: "CRUD tests succeeded", duration: 3000 });
    } catch (e: any) {
      console.error(e);
      pushResult("Error", "error", e?.message ?? "Unknown error");
      toast({ title: "Diagnostics failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  const StatusIcon = ({ s }: { s: TestResult["status"] }) => {
    if (s === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    if (s === "success") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (s === "error") return <XCircle className="h-4 w-4 text-red-600" />;
    return <Database className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <section aria-labelledby="db-diagnostics">
      <Card>
        <CardHeader>
          <CardTitle id="db-diagnostics" className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" /> System DB Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lob_code">LOB Code</Label>
              <Input id="lob_code" value={lob.lob_code} onChange={(e) => setLob({ ...lob, lob_code: e.target.value })} />
              <Label htmlFor="lob_name">LOB Name</Label>
              <Input id="lob_name" value={lob.lob_name} onChange={(e) => setLob({ ...lob, lob_name: e.target.value })} />
              <Label htmlFor="lob_desc">Description</Label>
              <Input id="lob_desc" value={lob.description} onChange={(e) => setLob({ ...lob, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurer_name">Provider Name</Label>
              <Input id="insurer_name" value={provider.insurer_name} onChange={(e) => setProvider({ ...provider, insurer_name: e.target.value })} />
              <Label htmlFor="provider_email">Contact Email</Label>
              <Input id="provider_email" value={provider.contact_email} onChange={(e) => setProvider({ ...provider, contact_email: e.target.value })} />
              <Label htmlFor="provider_phone">Phone</Label>
              <Input id="provider_phone" value={provider.phone_number} onChange={(e) => setProvider({ ...provider, phone_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_name">Product Name</Label>
              <Input id="product_name" value={product.product_name} onChange={(e) => setProduct({ ...product, product_name: e.target.value })} />
              <Label htmlFor="product_code">Product Code</Label>
              <Input id="product_code" value={product.product_code} onChange={(e) => setProduct({ ...product, product_code: e.target.value })} />
              <div className="pt-4">
                <Button onClick={runCrudTests} disabled={running} className="w-full">
                  {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {running ? "Running Diagnostics..." : "Run CRUD Diagnostics"}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Results</h3>
              <Badge variant="secondary">{results.length} steps</Badge>
            </div>
            <div className="space-y-2">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No diagnostics run yet.</p>
              ) : (
                <ul className="space-y-2">
                  {results.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 rounded-md border border-border">
                      <StatusIcon s={r.status} />
                      <div className="text-sm">
                        <div className="font-medium text-foreground">{r.step}</div>
                        {r.message ? <div className="text-muted-foreground">{r.message}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
