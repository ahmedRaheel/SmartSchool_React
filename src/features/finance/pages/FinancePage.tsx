import { useState, useMemo } from "react";
import { DollarSign, Plus, Search, TrendingUp, Wallet, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useInvoices, useCreateInvoice, useCreatePayment, useFeeTypes, useCreateFeeType, useAdminDashboard } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const STATUS_PILL: Record<string,string> = { PAID:"success", PENDING:"warning", OVERDUE:"danger", CANCELLED:"gray" };

function parseMeta(json?: string|null) {
  try { return JSON.parse(json ?? "{}"); } catch { return {}; }
}

export function FinancePage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [q, setQ]               = useState("");
  const [statusFilter, setStatus]= useState("ALL");
  const [invoiceModal, setIM]    = useState(false);
  const [payModal, setPM]        = useState<string|null>(null);
  const [feeModal, setFM]        = useState(false);
  const [invForm, setInvForm]    = useState({ name:"", metadataJson:"" });
  const [payAmount, setPayAmount] = useState("");
  const [feeForm, setFeeForm]    = useState({ name:"", frequency:"Monthly", description:"" });
  const [error, setError]        = useState("");
  const [success, setSuccess]    = useState("");

  const { data: dash }    = useAdminDashboard();
  const { data, isLoading} = useInvoices();
  const { data: fees }    = useFeeTypes();
  const createInvoice = useCreateInvoice();
  const createPayment = useCreatePayment();
  const createFeeType = useCreateFeeType();

  const invoices  = (data as any)?.items ?? (data as any) ?? [];
  const feeItems  = Array.isArray(fees) ? fees : (fees as any)?.items ?? [];
  const total     = (data as any)?.totalCount ?? invoices.length;

  const filtered  = useMemo(() =>
    invoices.filter((inv:any) => {
      const meta = parseMeta(inv.metadataJson);
      const status = meta.status ?? "";
      const matchQ = `${inv.name} ${inv.code}`.toLowerCase().includes(q.toLowerCase());
      const matchS = statusFilter === "ALL" || status === statusFilter;
      return matchQ && matchS;
    }),
    [invoices, q, statusFilter]);

  const collected  = dash?.CollectedAmount ?? 0;
  const outstanding = dash?.OutstandingAmount ?? 0;

  async function saveInvoice() {
    if (!invForm.name) { setError("Name required"); return; }
    try {
      await createInvoice.mutateAsync({ tenantId: tid, name: invForm.name, metadataJson: invForm.metadataJson || undefined });
      setIM(false); setInvForm({ name:"", metadataJson:"" }); setError(""); setSuccess("Invoice created");
      setTimeout(() => setSuccess(""), 3000);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  async function savePayment() {
    if (!payModal || !payAmount) { setError("Amount required"); return; }
    try {
      await createPayment.mutateAsync({ tenantId: tid, invoiceId: payModal, amount: Number(payAmount), name: `Payment for invoice` });
      setPM(null); setPayAmount(""); setError(""); setSuccess("Payment recorded");
      setTimeout(() => setSuccess(""), 3000);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  async function saveFeeType() {
    if (!feeForm.name) { setError("Name required"); return; }
    try {
      await createFeeType.mutateAsync({ tenantId: tid, name: feeForm.name, frequency: feeForm.frequency, description: feeForm.description || undefined });
      setFM(false); setFeeForm({ name:"", frequency:"Monthly", description:"" }); setError(""); setSuccess("Fee type created");
      setTimeout(() => setSuccess(""), 3000);
    } catch(e:any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  return (
    <>
      <PageHeader
        title="Finance"
        subtitle="Fee collection, invoices and payment records"
        action={
          <div className="page-actions">
            <button className="secondary" onClick={() => { setFM(true); setError(""); }}>⚙️ Fee types</button>
            <button className="secondary" onClick={() => { setIM(true); setError(""); }}>+ New invoice</button>
          </div>
        }
      />

      {success && (
        <div style={{ padding:"10px 16px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:8, marginBottom:12, fontSize:12, color:"#065f46", fontWeight:600 }}>{success}</div>
      )}

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total invoices"     value={String(total)}                              note="All time"      color="#0F2241" bg="#EEF2FF"><Wallet size={20}/></StatCard>
        <StatCard label="Collected"          value={`PKR ${(collected/1000).toFixed(0)}K`}     note="↑ This term"   color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Outstanding"        value={`PKR ${(outstanding/1000).toFixed(0)}K`}   note="Pending/Overdue"color="#D97706" bg="#FFFBEB"><DollarSign size={20}/></StatCard>
        <StatCard label="Fee types"          value={String(feeItems.length)}                    note="Configured"    color="#8B5CF6" bg="#F5F3FF"><Plus size={20}/></StatCard>
      </section>

      {/* Fee types summary */}
      {feeItems.length > 0 && (
        <div className="surface" style={{ marginBottom:16 }}>
          <div className="surface-head"><h3>Fee types</h3><p>Configured fee categories</p></div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, padding:"0 20px 16px" }}>
            {feeItems.map((ft:any) => (
              <div key={ft.id} style={{ padding:"6px 12px", borderRadius:8, background:"var(--surface-2)", border:"1px solid var(--line)", fontSize:11 }}>
                <b>{ft.name}</b>
                <span style={{ marginLeft:6, color:"var(--muted)" }}>{ft.frequency}</span>
                {ft.description && <span style={{ marginLeft:6, color:"var(--muted)" }}>— {ft.description}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8 }}>
            <label className="search-box" style={{ maxWidth:260 }}>
              <Search size={14}/>
              <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search invoices…"/>
            </label>
            <select value={statusFilter} onChange={e=>setStatus(e.target.value)}
              style={{ height:36, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12 }}>
              <option value="ALL">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading invoices…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr><th>Invoice</th><th>Student</th><th>Amount</th><th>Fee type</th><th>Due date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No invoices found.</td></tr>
                ) : filtered.map((inv:any) => {
                  const meta = parseMeta(inv.metadataJson);
                  const status = meta.status ?? "PENDING";
                  return (
                    <tr key={inv.id}>
                      <td><code style={{ fontSize:11 }}>{inv.code}</code></td>
                      <td>{inv.name.replace(/— .+$/, "").trim()}</td>
                      <td><b>PKR {(meta.amount ?? 0).toLocaleString()}</b></td>
                      <td>{meta.feeType ?? "—"}</td>
                      <td style={{ color: status==="OVERDUE"?"var(--danger)":"inherit" }}>{meta.dueDate ?? "—"}</td>
                      <td><span className={`status-pill ${STATUS_PILL[status] ?? "gray"}`}>{status}</span></td>
                      <td>
                        <div className="row-actions">
                          {status !== "PAID" && (
                            <button className="table-action" style={{ fontSize:10 }} onClick={() => { setPM(inv.id); setPayAmount(""); setError(""); }}>
                              Collect
                            </button>
                          )}
                          <button className="table-action" style={{ fontSize:10 }}>View</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} invoices</span></div>
      </div>

      {/* New invoice modal */}
      {invoiceModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setIM(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>New invoice</h2><button className="icon-button" onClick={()=>setIM(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Description *</span><input value={invForm.name} onChange={e=>setInvForm(p=>({...p,name:e.target.value}))} placeholder="e.g. September Tuition — Ahmed Hassan"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setIM(false)}>Cancel</button>
              <button className="primary" onClick={saveInvoice} disabled={createInvoice.isPending}>{createInvoice.isPending?"Creating…":"Create invoice"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Collect payment modal */}
      {payModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setPM(null)}}>
          <div className="modal-card" style={{ width:"min(380px,96vw)" }}>
            <div className="modal-head"><h2>Record payment</h2><button className="icon-button" onClick={()=>setPM(null)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Amount (PKR) *</span><input type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="0.00"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setPM(null)}>Cancel</button>
              <button className="primary" onClick={savePayment} disabled={createPayment.isPending}>{createPayment.isPending?"Saving…":"Record payment"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Fee type modal */}
      {feeModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFM(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add fee type</h2><button className="icon-button" onClick={()=>setFM(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={feeForm.name} onChange={e=>setFeeForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Tuition Fee"/></label>
              <label className="human-field"><span>Frequency *</span>
                <select value={feeForm.frequency} onChange={e=>setFeeForm(p=>({...p,frequency:e.target.value}))}>
                  <option value="Monthly">Monthly</option>
                  <option value="Term">Per term</option>
                  <option value="Annual">Annual</option>
                  <option value="OneTime">One-time</option>
                </select>
              </label>
              <label className="human-field field-wide"><span>Description</span><input value={feeForm.description} onChange={e=>setFeeForm(p=>({...p,description:e.target.value}))} placeholder="Optional"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setFM(false)}>Cancel</button>
              <button className="primary" onClick={saveFeeType}>{createFeeType.isPending?"Saving…":"Save fee type"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
