import React, { useEffect, useMemo, useState } from "react";
import SystemAdminModulePage from "@/components/admin/SystemAdminModulePage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
const sb = supabase as any;

interface Lob {
  id: string;
  lob_name: string;
  lob_code: string;
  description: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export default function Lobs() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Lob[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<keyof Lob>('lob_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lob | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      // @ts-ignore - mdm tables not yet in generated types
      let query = sb
        .from('mdm_lobs')
        .select('*', { count: 'exact' })
        .order(sortBy as string, { ascending: sortAsc })
        .range(from, to);

      if (search.trim()) {
        const s = `%${search.trim()}%`;
        query = query.or(`lob_name.ilike.${s},lob_code.ilike.${s}`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      setRows((data as any) || []);
      setTotal(count || 0);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Load error', description: e?.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, sortBy, sortAsc]);

  const handleSave = async (form: { lob_name: string; lob_code: string; description?: string }) => {
    try {
      if (editing) {
        // @ts-ignore
        const { error } = await sb
          .from('mdm_lobs')
          .update({ lob_name: form.lob_name, lob_code: form.lob_code, description: form.description })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Updated', description: 'Line of Business updated successfully.' });
      } else {
        const { error } = await sb
          .from('mdm_lobs')
          .insert([{ lob_name: form.lob_name, lob_code: form.lob_code, description: form.description, status: 'active', tenant_id: null }]);
        if (error) throw error;
        toast({ title: 'Created', description: 'Line of Business created successfully.' });
      }
      setOpen(false);
      setEditing(null);
      fetchData();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Save error', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (row: Lob, next: boolean) => {
    try {
      const { error } = await sb.from('mdm_lobs').update({ status: next ? 'active' : 'inactive' }).eq('id', row.id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: next ? 'active' : 'inactive' } : r)));
      toast({ title: 'Status updated' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Update error', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  const handleDelete = async (row: Lob) => {
    try {
      const { error } = await sb.from('mdm_lobs').delete().eq('id', row.id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setTotal((t) => Math.max(0, t - 1));
      toast({ title: 'Deleted', description: 'Line of Business deleted.' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Delete error', description: e?.message || String(e), variant: 'destructive' });
    }
  };

  return (
    <SystemAdminModulePage slug="MDM/Lobs" title="Line of Business" description="Manage Lines of Business">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lines of Business</CardTitle>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search name or code..."
              value={search}
              onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            />
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
              <DialogTrigger asChild>
                <Button size="sm">Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editing ? 'Edit LOB' : 'Add LOB'}</DialogTitle>
                </DialogHeader>
                <LobForm
                  initial={editing || undefined}
                  onSubmit={handleSave}
                />
                <DialogFooter>
                  <Button variant="ghost" onClick={() => { setOpen(false); setEditing(null); }}>Cancel</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => { setSortBy('lob_name'); setSortAsc(sortBy === 'lob_name' ? !sortAsc : true); }} className="cursor-pointer">Name</TableHead>
                  <TableHead onClick={() => { setSortBy('lob_code'); setSortAsc(sortBy === 'lob_code' ? !sortAsc : true); }} className="cursor-pointer">Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.lob_name}</TableCell>
                    <TableCell>{r.lob_code}</TableCell>
                    <TableCell className="max-w-[420px] truncate" title={r.description || ''}>{r.description}</TableCell>
                    <TableCell>
                      <Switch checked={r.status === 'active'} onCheckedChange={(v) => handleToggleStatus(r, v)} />
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}>Edit</Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this LOB?</AlertDialogTitle>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(r)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No data found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }} />
                </PaginationItem>
                <div className="px-3 text-sm text-muted-foreground self-center">Page {page} of {totalPages}</div>
                <PaginationItem>
                  <PaginationNext onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </SystemAdminModulePage>
  );
}

function LobForm({ initial, onSubmit }: { initial?: Partial<Lob>; onSubmit: (v: { lob_name: string; lob_code: string; description?: string }) => void }) {
  const [lob_name, setName] = useState(initial?.lob_name || "");
  const [lob_code, setCode] = useState(initial?.lob_code || "");
  const [description, setDescription] = useState(initial?.description || "");

  useEffect(() => {
    setName(initial?.lob_name || "");
    setCode(initial?.lob_code || "");
    setDescription(initial?.description || "");
  }, [initial]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!lob_name.trim() || !lob_code.trim()) return;
        onSubmit({ lob_name: lob_name.trim(), lob_code: lob_code.trim(), description: description?.trim() });
      }}
      className="space-y-3"
    >
      <div className="grid gap-2">
        <Label htmlFor="lob_name">Name</Label>
        <Input id="lob_name" value={lob_name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lob_code">Code</Label>
        <Input id="lob_code" value={lob_code} onChange={(e) => setCode(e.target.value)} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description || ''} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="pt-2">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
