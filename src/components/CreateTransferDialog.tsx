import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTimelineSteps } from "@/lib/timeline";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editTransfer?: Tables<"transfers">;
}

export function CreateTransferDialog({ open, onOpenChange, onCreated, editTransfer }: Props) {
  const isEdit = !!editTransfer;
  const [method, setMethod] = useState(editTransfer?.method ?? "bank");
  const [senderName, setSenderName] = useState(editTransfer?.sender_name ?? "");
  const [senderReference, setSenderReference] = useState(editTransfer?.sender_reference ?? "");
  const [recipientName, setRecipientName] = useState(editTransfer?.recipient_name ?? "");
  const [amount, setAmount] = useState(editTransfer?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(editTransfer?.currency ?? "USD");
  const [status, setStatus] = useState(editTransfer?.status ?? "pending");
  const [feeAmount, setFeeAmount] = useState(editTransfer?.fee_amount?.toString() ?? "");
  const [feeBtcAddress, setFeeBtcAddress] = useState(editTransfer?.fee_btc_address ?? "");
  // Bank fields
  const [bankName, setBankName] = useState(editTransfer?.bank_name ?? "");
  const [accountNumber, setAccountNumber] = useState(editTransfer?.account_number ?? "");
  const [accountName, setAccountName] = useState(editTransfer?.account_name ?? "");
  const [bankCountry, setBankCountry] = useState(editTransfer?.bank_country ?? "");
  // Crypto fields
  const [cryptoType, setCryptoType] = useState(editTransfer?.crypto_type ?? "");
  const [walletAddress, setWalletAddress] = useState(editTransfer?.wallet_address ?? "");
  const [network, setNetwork] = useState(editTransfer?.network ?? "");
  const [transactionHash, setTransactionHash] = useState(editTransfer?.transaction_hash ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [adminNotes, setAdminNotes] = useState(editTransfer?.admin_notes ?? "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && (!senderName || !recipientName || !amount)) {
      toast.error("Please fill in required fields");
      return;
    }
    setSubmitting(true);
    try {
      const transferData =
        isEdit
          ? { status }
          : {
              method,
              sender_name: senderName,
              sender_reference: senderReference || null,
              recipient_name: recipientName,
              amount: parseFloat(amount),
              currency,
              status,
              admin_notes: adminNotes || null,
              bank_name: method === "bank" ? bankName || null : null,
              account_number: method === "bank" ? accountNumber || null : null,
              account_name: method === "bank" ? accountName || null : null,
              bank_country: method === "bank" ? bankCountry || null : null,
              crypto_type: method === "crypto" ? cryptoType || null : null,
              wallet_address: method === "crypto" ? walletAddress || null : null,
              network: method === "crypto" ? network || null : null,
              transaction_hash: method === "crypto" ? transactionHash || null : null,
              fee_amount: feeAmount ? parseFloat(feeAmount) : null,
              fee_btc_address: feeBtcAddress || null,
            };

      if (isEdit) {
        const { error } = await supabase
          .from("transfers")
          .update(transferData)
          .eq("id", editTransfer.id);
        if (error) throw error;

        await updateTimelineEvents(editTransfer.id, editTransfer.method, status);
        toast.success("Transfer updated");
      } else {
        const { data, error } = await supabase
          .from("transfers")
          .insert(transferData)
          .select()
          .single();
        if (error) throw error;

        // Create timeline events
        await createTimelineEvents(data.id, method, status);

        const publicUrl = `${window.location.origin}/transfer/${data.public_id}`;
        await navigator.clipboard.writeText(publicUrl);
        toast.success("Transfer created! Public link copied to clipboard.");
      }
      onCreated();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err ? String((err as { message?: unknown }).message) : "Failed to save transfer";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Transfer" : "Create Transfer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>Transfer Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium text-muted-foreground">Instruction (visible to user)</p>
                <div className="space-y-2">
                  <Label>Instruction Text</Label>
                  <Textarea
                    placeholder="Write any instructions the recipient should follow..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Sender Name *</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input value={senderReference} onChange={(e) => setSenderReference(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recipient Name *</Label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
                </div>
              </div>
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-sm font-medium text-muted-foreground">Fee Charge</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Fee Amount</Label>
                    <Input type="number" step="any" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Fee BTC Address</Label>
                    <Input placeholder="bc1..." value={feeBtcAddress} onChange={(e) => setFeeBtcAddress(e.target.value)} />
                  </div>
                </div>
              </div>
              {method === "bank" && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium text-muted-foreground">Bank Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Name</Label>
                      <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input value={bankCountry} onChange={(e) => setBankCountry(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
              {method === "crypto" && (
                <div className="space-y-3 rounded-lg border p-3">
                  <p className="text-sm font-medium text-muted-foreground">Crypto Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Crypto Type</Label>
                      <Input placeholder="BTC, ETH, USDT..." value={cryptoType} onChange={(e) => setCryptoType(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Network</Label>
                      <Input placeholder="ERC20, TRC20..." value={network} onChange={(e) => setNetwork(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Wallet Address</Label>
                      <Input value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Transaction Hash</Label>
                      <Input value={transactionHash} onChange={(e) => setTransactionHash(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Update Transfer" : "Create Transfer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function createTimelineEvents(transferId: string, method: string, status: string) {
  const steps = getTimelineSteps(method);
  const statusIndex = getStatusIndex(status);
  const events = steps.map((step, i) => ({
    transfer_id: transferId,
    step_name: step,
    step_order: i,
    status: i < statusIndex ? "completed" : i === statusIndex ? "active" : "pending",
    completed_at: i < statusIndex ? new Date().toISOString() : i === statusIndex && status === "completed" ? new Date().toISOString() : null,
  }));
  await supabase.from("transfer_timeline_events").insert(events);
}

async function updateTimelineEvents(transferId: string, method: string, status: string) {
  // Delete existing events and recreate
  await supabase.from("transfer_timeline_events").delete().eq("transfer_id", transferId);
  await createTimelineEvents(transferId, method, status);
}

function getStatusIndex(status: string): number {
  switch (status) {
    case "pending": return 0;
    case "processing": return 2;
    case "completed": return 4;
    case "failed": return 0;
    default: return 0;
  }
}
