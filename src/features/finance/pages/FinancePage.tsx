import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useInvoices, useCreateInvoice, useRecordPayment } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import type { Invoice } from "../../../core/api/smartschoolApi";

const PAYMENT_METHODS = ["Cash","Bank Transfer","Online Portal","Cheque","Wallet"];

export function FinancePage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const { data, isLoading, refetch } = useInvoices();
  const createInvoice  = useCreateInvoice();
  const recordPayment  = useRecordPayment();

  const [q, setQ]             = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [invForm, setInvForm] = useState({ studentId:"", amount:"", dueDate:"", feeTypeCode:"TUITION" });
  const [payForm, setPayForm] = useState({ amount:"", paymentMethod:"Cash", referenceNumber:"", paymentDate: new Date().toISOString().slice(0, 10) });

  const invoices = data?.items ?? [];
  const filtered = invoices.filter(inv =>
    (inv.invoiceNumber ?? "").toLowerCase().includes(q.toLowerCase()) ||
    inv.studentId.toLowerCase().includes(q.toLowerCase())
  );

  const totals = invoices.reduce((a, inv) => ({
    collected: a.collected + (inv.status === "PAID" ? inv.totalAmount : 0),
    pending:   a.pending   + (inv.status === "PENDING" ? inv.totalAmount : 0),
    overdue:   a.overdue   + (inv.status === "OVERDUE" ? inv.totalAmount : 0),
  }), { collected: 0, pending: 0, overdue: 0 });

  async function saveInvoice() {
    if (!invForm.studentId || !invForm.amount) { setError("Student ID and amount are required."); return; }
    setSaving(true); setError("");
    try {
      await createInvoice.mutateAsync({
        tenantId, studentId: invForm.studentId,
        amount: Number(invForm.amount), dueDate: invForm.dueDate || null,
        feeTypeCode: invForm.feeTypeCode,
      });
      setAddOpen(false);
      void refetch();
    } catch (err: any) {
      setError(err?.message ?? "Could not create invoice.");
    } finally { setSaving(false); }
  }

  async function savePayment() {
    if (!payForm.amount || !payTarget) return;
    setSaving(true); setError("");
    try {
      await recordPayment.mutateAsync({
        tenantId, invoiceId: payTarget.studentInvoiceId,
        amount: Number(payForm.amount), paymentMethod: payForm.paymentMethod,
        referenceNumber: payForm.referenceNumber || null,
        paymentDate: payForm.paymentDate,
      });
      setPayOpen(false);
      void refetch();
    } catch (err: any) {
      setError(err?.message ?? "Could not record payment.");
    } finally { setSaving(false); }
  }

  const STATUS_PILL: Record<string, string> = {
    PAID:"success", PENDING:"warning", OVERDUE:"danger", CANCELLED:"gray", PARTIAL:"info",
  };

  return (
    <>
      <PageHeader
        title="Fees & Finance"
        subtitle="Invoices, payments and fee collection management"
        action={
          <div className="page-actions">
            <button className="secondary">Export</button>
            <button className="primary" onClick={() => { setInvForm({ studentId:"", amount:"", dueDate:"", feeTypeCode:"TUITION" }); setAddOpen(true); setError(""); }}>
              <Plus size={15}/> New invoice
            </button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Collected"       value={`PKR ${totals.collected.toLocaleString()}`} note="" color="#10B981" bg="#ECFDF5"><span style={{ fontSize: 20 }}>💰</span></StatCard>
        <StatCard label="Pending"         value={`PKR ${totals.pending.toLocaleString()}`}   note={`${invoices.filter(i => i.status === "PENDING").length} invoices`} color="#D97706" bg="#FFFBEB"><span style={{ fontSize: 20 }}>⏳</span></StatCard>
        <StatCard label="Overdue"         value={`PKR ${totals.overdue.toLocaleString()}`}   note="Action needed" color="#EF4444" bg="#FFF0F1"><span style={{ fontSize: 20 }}>🚨</span></StatCard>
        <StatCard label="Collection rate" value={invoices.length ? `${Math.round(invoices.filter(i => i.status === "PAID").length / invoices.length * 100)}%` : "—"} note="" color="#2563EB" bg="#EFF6FF"><span style={{ fontSize: 20 }}>📊</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth: 300 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search invoice or student…"/>
          </label>
          <button className="primary" onClick={() => { setInvForm({ studentId:"", amount:"", dueDate:"", feeTypeCode:"TUITION" }); setAddOpen(true); setError(""); }}>
            <Plus size={14}/> New invoice
          </button>
        </div>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading invoices…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Invoice no.</th><th>Student</th><th>Amount</th><th>Paid</th><th>Due date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 30, color: "var(--text-muted)" }}>No invoices found.</td></tr>
                ) : filtered.map(inv => (
                  <tr key={inv.studentInvoiceId}>
                    <td><code style={{ fontSize: 11 }}>{inv.invoiceNumber ?? inv.studentInvoiceId.slice(0, 8)}</code></td>
                    <td><code style={{ fontSize: 11 }}>{inv.studentId.slice(0, 12)}…</code></td>
                    <td><b>PKR {inv.totalAmount.toLocaleString()}</b></td>
                    <td>PKR {inv.paidAmount.toLocaleString()}</td>
                    <td>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</td>
                    <td><span className={`status-pill ${STATUS_PILL[inv.status] ?? "gray"}`}>{inv.status}</span></td>
                    <td>
                      <div className="row-actions">
                        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                          <button className="table-action" style={{ color: "var(--text-success)" }}
                            onClick={() => { setPayTarget(inv); setPayForm({ amount: String(inv.totalAmount - inv.paidAmount), paymentMethod:"Cash", referenceNumber:"", paymentDate: new Date().toISOString().slice(0,10) }); setPayOpen(true); setError(""); }}>
                            Collect
                          </button>
                        )}
                        {inv.status === "PAID" && <button className="table-action">Receipt</button>}
                        <button className="table-action">View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} invoices shown</span></div>
      </div>

      {/* New Invoice Modal */}
      {addOpen && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setAddOpen(false); }}>
          <div className="modal-card" style={{ width: "min(560px, 96vw)" }}>
            <div className="modal-head"><h2>Create invoice</h2><button className="icon-button" onClick={() => setAddOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>Student ID *</span><input value={invForm.studentId} onChange={e => setInvForm(p => ({ ...p, studentId: e.target.value }))} placeholder="Paste student UUID"/></label>
                <label className="human-field"><span>Fee type</span>
                  <select value={invForm.feeTypeCode} onChange={e => setInvForm(p => ({ ...p, feeTypeCode: e.target.value }))}>
                    {["TUITION","TRANSPORT","LIBRARY","LAB","SPORTS","ADMISSION"].map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()} Fee</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={invForm.amount} onChange={e => setInvForm(p => ({ ...p, amount: e.target.value }))}/></label>
                <label className="human-field"><span>Due date</span><input type="date" value={invForm.dueDate} onChange={e => setInvForm(p => ({ ...p, dueDate: e.target.value }))}/></label>
              </div>
              {error && <div style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setAddOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => void saveInvoice()} disabled={saving || !invForm.studentId || !invForm.amount}>{saving ? "Saving…" : "Create invoice"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payOpen && payTarget && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setPayOpen(false); }}>
          <div className="modal-card" style={{ width: "min(500px, 96vw)" }}>
            <div className="modal-head"><h2>Record payment</h2><button className="icon-button" onClick={() => setPayOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div style={{ padding: "0 0 14px", borderBottom: "0.5px solid var(--border)", marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Invoice</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{payTarget.invoiceNumber ?? payTarget.studentInvoiceId.slice(0,12)}</div>
                <div style={{ fontSize: 12, color: "var(--text-danger)" }}>Outstanding: PKR {(payTarget.totalAmount - payTarget.paidAmount).toLocaleString()}</div>
              </div>
              <div className="human-form-grid">
                <label className="human-field"><span>Amount (PKR) *</span><input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: e.target.value }))}/></label>
                <label className="human-field"><span>Payment method</span>
                  <select value={payForm.paymentMethod} onChange={e => setPayForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Payment date</span><input type="date" value={payForm.paymentDate} onChange={e => setPayForm(p => ({ ...p, paymentDate: e.target.value }))}/></label>
                <label className="human-field"><span>Reference / transaction no.</span><input value={payForm.referenceNumber} onChange={e => setPayForm(p => ({ ...p, referenceNumber: e.target.value }))} placeholder="Bank reference if any"/></label>
              </div>
              {error && <div style={{ color: "var(--text-danger)", fontSize: 12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setPayOpen(false)}>Cancel</button>
              <button className="primary" onClick={() => void savePayment()} disabled={saving || !payForm.amount}>{saving ? "Saving…" : "Record payment"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
