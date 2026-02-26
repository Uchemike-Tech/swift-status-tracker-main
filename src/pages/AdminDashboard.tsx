import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { CreateTransferDialog } from "@/components/CreateTransferDialog";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { Copy, LogOut, Plus, Search, Trash } from "lucide-react";
import logo from "@/assets/logo.png";

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<Tables<"transfers">[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTransfer, setEditTransfer] = useState<Tables<"transfers"> | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchTransfers();
  }, [user, isAdmin]);

  const fetchTransfers = async () => {
    const query = supabase.from("transfers").select("*").order("created_at", { ascending: false });
    const { data, error } = await query;
    if (error) {
      toast.error("Failed to load transfers");
      return;
    }
    setTransfers(data || []);
  };

  const filtered = transfers.filter((t) => {
    const matchSearch =
      !search ||
      t.public_id.toLowerCase().includes(search.toLowerCase()) ||
      t.recipient_name.toLowerCase().includes(search.toLowerCase()) ||
      t.sender_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchMethod = methodFilter === "all" || t.method === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const copyLink = (publicId: string) => {
    const url = `${window.location.origin}/transfer/${publicId}`;
    navigator.clipboard.writeText(url);
    toast.success("Public link copied!");
  };

  const openEdit = (transfer: Tables<"transfers">) => {
    setEditTransfer(transfer);
    setDialogOpen(true);
  };
  
  const deleteTransfer = async (transfer: Tables<"transfers">) => {
    try {
      const { error: eventsErr } = await supabase
        .from("transfer_timeline_events")
        .delete()
        .eq("transfer_id", transfer.id);
      if (eventsErr) {
        toast.error("Failed to delete timeline events");
        return;
      }
      const { error: transferErr } = await supabase
        .from("transfers")
        .delete()
        .eq("id", transfer.id);
      if (transferErr) {
        toast.error("Failed to delete transfer");
        return;
      }
      setTransfers((prev) => prev.filter((t) => t.id !== transfer.id));
      toast.success("Transfer deleted");
    } catch {
      toast.error("Unexpected error deleting transfer");
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Swift Payment Tracker" className="h-8" />
            <span className="text-lg font-semibold text-foreground">Admin Dashboard</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Actions row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, sender, or recipient..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[130px]"><SelectValue placeholder="Method" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="crypto">Crypto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => {
              setEditTransfer(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Create Transfer
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No transfers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{t.public_id}</TableCell>
                    <TableCell>{t.sender_name}</TableCell>
                    <TableCell>{t.recipient_name}</TableCell>
                    <TableCell className="font-medium">
                      {t.method === "crypto"
                        ? `${Number(t.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${t.crypto_type || ""}`
                        : `${t.currency} ${Number(t.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </TableCell>
                    <TableCell className="capitalize">{t.method}</TableCell>
                    <TableCell>
                      {t.fee_paid ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-xs">Paid</span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-800 px-2 py-0.5 text-xs">Unpaid</span>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        className="mr-2"
                        size="sm"
                        onClick={() => openEdit(t)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="mr-2"
                            size="sm"
                            variant="destructive"
                          >
                            <Trash className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete transfer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the transfer and its timeline events. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteTransfer(t)}>
                              Confirm Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyLink(t.public_id);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <CreateTransferDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={fetchTransfers}
        editTransfer={editTransfer}
      />
    </div>
  );
};

export default AdminDashboard;
