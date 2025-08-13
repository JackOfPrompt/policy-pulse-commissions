import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

interface BulkImportDialogProps {
  table: string;
  title: string;
  templateFields: string[]; // fields we recommend including in the template
  onComplete?: () => void;
}

const GUESS_KEYS = [
  "code",
  "*_code",
  "name",
  "provider_code",
  "product_type_code",
  "vehicle_type_code",
  "policy_type_code",
  "plan_type_code",
  "sub_type_code",
  "lob_code",
  "city_name",
];

function guessKey(headers: string[]): string | undefined {
  const hset = new Set(headers.map((h) => h.toLowerCase()));
  // direct matches
  for (const k of GUESS_KEYS) {
    if (!k.includes("*")) {
      if (hset.has(k)) return k;
    }
  }
  // wildcard *_code
  for (const h of headers) {
    if (h.toLowerCase().endsWith("_code")) return h;
  }
  // fallback first header
  return headers[0];
}

export default function BulkImportDialog({ table, title, templateFields, onComplete }: BulkImportDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [matchKey, setMatchKey] = useState<string | undefined>(undefined);
  const [rows, setRows] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: Array<{ row: any; error: string }> } | null>(null);

  const canStart = !!file && !!rows.length && !!matchKey && !importing;

  const handleFile = async (f: File | null) => {
    setFile(f);
    setHeaders([]);
    setRows([]);
    setResult(null);
    if (!f) return;
    const data = await f.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" });
    const hdrs = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[];
    const normHdrs = (hdrs || []).map((h) => String(h || "").trim());
    setHeaders(normHdrs);
    setMatchKey(guessKey(normHdrs));
    // normalize keys to exact header strings
    setRows(json as any[]);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([templateFields]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${table}-template.csv`);
  };

  const downloadErrors = () => {
    if (!result || result.errors.length === 0) return;
    const errRows = result.errors.map((e) => ({ ...e.row, __error: e.error }));
    const ws = XLSX.utils.json_to_sheet(errRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Errors");
    XLSX.writeFile(wb, `${table}-import-errors.csv`);
  };

  const startImport = async () => {
    if (!matchKey || rows.length === 0) return;
    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      // 1) Build list of keys from file
      const keys = Array.from(new Set(rows.map((r) => String(r[matchKey] || "").trim()).filter(Boolean)));

      // 2) Fetch existing ids for these keys (in chunks of 500)
      const existingMap = new Map<string, string>();
      for (let i = 0; i < keys.length; i += 500) {
        const slice = keys.slice(i, i + 500);
        let query = (supabase as any).from(table).select(`id, ${matchKey}`).in(matchKey, slice);
        const { data, error } = await query;
        if (error) throw error;
        (data || []).forEach((d: any) => existingMap.set(String(d[matchKey]), d.id));
      }

      // 3) Prepare payload: existing => include id (update), new => no id (insert)
      const payload = rows.map((r) => {
        const keyVal = String(r[matchKey] || "").trim();
        const id = keyVal ? existingMap.get(keyVal) : undefined;
        const obj: any = {};
        // copy all known headers into object
        headers.forEach((h) => (obj[h] = r[h]));
        if (id) obj.id = id;
        return obj;
      });

      // 4) Upsert in chunks; when chunk fails, retry per-row to collect errors
      let inserted = 0;
      let updated = 0;
      const errors: Array<{ row: any; error: string }> = [];

      const total = payload.length;
      const chunkSize = 200;

      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await (supabase as any)
          .from(table)
          .upsert(chunk, { onConflict: "id" });
        if (error) {
          // retry per row
          for (const row of chunk) {
            const { error: rowErr } = await (supabase as any)
              .from(table)
              .upsert([row], { onConflict: "id" });
            if (rowErr) {
              errors.push({ row, error: rowErr.message || String(rowErr) });
            } else {
              if (row.id) updated += 1; else inserted += 1;
            }
          }
        } else {
          // optimistic counts based on presence of id
          updated += chunk.filter((r) => !!r.id).length;
          inserted += chunk.filter((r) => !r.id).length;
        }
        setProgress(Math.round(((i + chunk.length) / total) * 100));
      }

      setResult({ inserted, updated, errors });
      toast({ title: `${title} import complete`, description: `${inserted} inserted, ${updated} updated${errors.length ? ", with errors" : ""}.` });
      onComplete?.();
    } catch (e: any) {
      toast({ title: "Import failed", description: e?.message || String(e), variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import {title}s</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            <Button type="button" variant="ghost" onClick={downloadTemplate}>
              Download CSV template
            </Button>
          </div>
          {headers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Match existing by</Label>
                <Select value={matchKey} onValueChange={setMatchKey as any}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select key column" />
                  </SelectTrigger>
                  <SelectContent>
                    {headers.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Total rows detected</Label>
                <div className="text-sm text-muted-foreground pt-2">{rows.length}</div>
              </div>
            </div>
          )}

          {importing && (
            <div className="space-y-2">
              <Label>Processing...</Label>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <div className="rounded-md border p-3 text-sm">
              <div>Inserted: {result.inserted}</div>
              <div>Updated: {result.updated}</div>
              <div className={result.errors.length ? "text-destructive" : undefined}>Errors: {result.errors.length}</div>
              {result.errors.length > 0 && (
                <div className="pt-2">
                  <Button type="button" variant="destructive" onClick={downloadErrors}>
                    Download error report
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          <Button onClick={startImport} disabled={!canStart}>{importing ? "Importing..." : "Start Import"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
