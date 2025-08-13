import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import BulkImportDialog from "@/components/admin/mdm/BulkImportDialog";

export type FieldType = "text" | "textarea" | "number" | "select";

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  // For select fields
  options?: Array<{ label: string; value: string }>; // static options
  optionsSource?: { table: string; labelField: string; valueField: string; orderBy?: string };
}

interface ColumnConfig {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface MdmCrudPageProps {
  table: string;
  title: string;
  columns: ColumnConfig[];
  formFields: FieldConfig[];
  searchKeys?: string[]; // fields to ilike search on
  orderBy?: string; // default order field
}

const PAGE_SIZE = 10;

export default function MdmCrudPage({ table, title, columns, formFields, searchKeys = ["name", "code"], orderBy = "updated_at", }: MdmCrudPageProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [selectOptions, setSelectOptions] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  // Load select options for fields with optionsSource
  useEffect(() => {
    (async () => {
      const loaders = formFields
        .filter((f) => f.type === "select" && f.optionsSource)
        .map(async (f) => {
          const src = f.optionsSource!;
          let query = (supabase as any).from(src.table).select(`${src.valueField}, ${src.labelField}`);
          if (src.orderBy) query = query.order(src.orderBy as any, { ascending: true });
          const { data, error } = await query.limit(1000);
          if (!error && data) {
            return [
              f.name,
              data.map((d: any) => ({ label: d[src.labelField], value: String(d[src.valueField]) })),
            ] as const;
          }
          return [f.name, []] as const;
        });
      const entries = await Promise.all(loaders);
      setSelectOptions(Object.fromEntries(entries));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mdm", table, page, search],
    queryFn: async () => {
      let query = (supabase as any).from(table).select("*", { count: "exact" });
      if (search.trim() && searchKeys.length > 0) {
        // Apply OR ilike across keys using PostgREST's or syntax
        const or = searchKeys.map((k) => `${k}.ilike.%${search}%`).join(",");
        query = query.or(or);
      }
      query = query.order(orderBy as any, { ascending: false }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return { rows: data || [], count: count || 0 };
    },
    staleTime: 10_000,
  });

  const total = data?.count || 0;
  const rows = data?.rows || [];
  const pageCount = Math.ceil(total / PAGE_SIZE) || 1;

  const resetForm = () => setFormState({});

  const startCreate = () => {
    setEditing(null);
    resetForm();
    setOpen(true);
  };
  const startEdit = (row: any) => {
    setEditing(row);
    setFormState(row);
    setOpen(true);
  };

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...formState };
      if (editing) {
        const { error } = await (supabase as any).from(table).update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from(table).insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editing ? "Updated" : "Created", description: `${title} ${editing ? "updated" : "created"} successfully.` });
      setOpen(false);
      setEditing(null);
      resetForm();
      qc.invalidateQueries({ queryKey: ["mdm", table] });
    },
    onError: (e: any) => {
      toast({ title: "Save failed", description: e?.message || String(e), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: any) => {
      const { error } = await (supabase as any).from(table).delete().eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Deleted", description: `${title} deleted successfully.` });
      qc.invalidateQueries({ queryKey: ["mdm", table] });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    },
  });

  const renderField = (f: FieldConfig) => {
    const val = formState[f.name] ?? "";
    const onChange = (v: any) => setFormState((s) => ({ ...s, [f.name]: v }));
    switch (f.type) {
      case "textarea":
        return (
          <Textarea
            id={f.name}
            value={val}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
          />
        );
      case "number":
        return (
          <Input
            id={f.name}
            type="number"
            value={val}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={f.placeholder}
          />
        );
      case "select": {
        const opts = f.options || selectOptions[f.name] || [];
        return (
          <Select value={val ? String(val) : undefined} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={f.name}>
              <SelectValue placeholder={f.placeholder || `Select ${f.label}`} />
            </SelectTrigger>
            <SelectContent>
              {opts.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      default:
        return (
          <Input
            id={f.name}
            value={val}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
          />
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder={`Search ${title.toLowerCase()}...`}
            aria-label="Search"
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={startCreate}>New</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? `Edit ${title}` : `Create ${title}`}</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  {formFields.map((f) => (
                    <div key={f.name} className="flex flex-col gap-2">
                      <Label htmlFor={f.name}>{f.label}{f.required ? " *" : ""}</Label>
                      {renderField(f)}
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={() => upsertMutation.mutate()} disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <BulkImportDialog
              table={table}
              title={title}
              templateFields={formFields.map((f) => f.name)}
              onComplete={() => qc.invalidateQueries({ queryKey: ["mdm", table] })}
            />
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>Loading...</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-destructive">{(error as any)?.message || String(error)}</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>No data</TableCell>
                </TableRow>
              ) : (
                rows.map((row: any) => (
                  <TableRow key={row.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "")}</TableCell>
                    ))}
                    <TableCell className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEdit(row)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => setConfirmDelete(row)}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm">Total: {total}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</Button>
            <div className="text-sm">Page {page + 1} / {pageCount}</div>
            <Button variant="outline" disabled={page + 1 >= pageCount} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {title}?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                if (confirmDelete) deleteMutation.mutate(confirmDelete);
                setConfirmDelete(null);
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
