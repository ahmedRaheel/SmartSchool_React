import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Banknote, CreditCard, FilePlus2, ReceiptText, Search, Wallet, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useAcademicYears, useStudents } from "../../../core/api/queries";
import { operationalApi } from "../../../core/api/operationalApi";
import { toItems } from "../../../core/utils/dataHelpers";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const PAYMENT_METHODS = ["CASH", "CARD", "BANK_TRANSFER", "CHEQUE", "ONLINE", "OTHER"];
const pkr = (value: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(value || 0));
const displayDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-PK", { dateStyle: "medium" });

export function FinancePage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const canCreateInvoice = permissions.can("finance.invoices.create");
  const canRecordPayment = permissions.can("finance.payments.record");
  const canManageFinance = permissions.can("finance.invoices.list") || permissions.can("finance.invoices.create") || permissions.can("finance.invoices.manage") || permissions.can("finance.payments.record") || permissions.can("finance.fees.manage");

  const [tab, setTab] = useState<"invoices" | "payments">("invoices");
  const [search, setSearch] = useState("");
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [invoiceForm, setInvoiceForm] = useState({ studentId: "", academicYearId: "", invoiceDate: today, dueDate: "", totalAmount: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ invoiceId: "", amount: "", paymentMethod: "CASH", referenceNo: "" });

  const dashboard = useQuery({
    queryKey: ["finance-operations", tenantId],
    queryFn: () => operationalApi.finance.dashboard(tenantId),
    enabled: canManageFinance && Boolean(tenantId),
  });
  const { data: studentsData } = useStudents(1, invoiceModal);
  const { data: yearsData } = useAcademicYears(user?.branchId ?? undefined);
  const students = toItems(studentsData);
  const academicYears = toItems(yearsData);

  const createInvoice = useMutation({
    mutationFn: () => operationalApi.finance.createInvoice({
      tenantId,
      studentId: invoiceForm.studentId,
      academicYearId: invoiceForm.academicYearId || null,
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate || null,
      totalAmount: Number(invoiceForm.totalAmount),
      description: invoiceForm.description.trim() || null,
    }),
    onSuccess: async () => {
      setInvoiceModal(false);
      setInvoiceForm({ studentId: "", academicYearId: "", invoiceDate: today, dueDate: "", totalAmount: "", description: "" });
      await queryClient.invalidateQueries({ queryKey: ["finance-operations", tenantId] });
    },
  });

  const postPayment = useMutation({
    mutationFn: () => operationalApi.finance.postPayment({
      tenantId,
      invoiceId: paymentForm.invoiceId,
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      referenceNo: paymentForm.referenceNo.trim() || null,
    }),
    onSuccess: async () => {
      setPaymentModal(false);
      setPaymentForm({ invoiceId: "", amount: "", paymentMethod: "CASH", referenceNo: "" });
      await queryClient.invalidateQueries({ queryKey: ["finance-operations", tenantId] });
    },
  });

  if (!canManageFinance) {
    return (
      <>
        <PageHeader title="Fees & Finance" subtitle="Your financial information is available from the self-service portal." />
        <div className="surface">
          <div className="empty-state">
            <Wallet size={34} />
            <b>Finance operations are restricted to authorized staff</b>
            <p>Your role can view personal fee information, but it cannot open the school accounting workspace.</p>
          </div>
        </div>
      </>
    );
  }

  const invoices = dashboard.data?.invoices ?? [];
  const payments = dashboard.data?.payments ?? [];
  const outstandingInvoices = invoices.filter(item => Number(item.balanceAmount) > 0 && item.status.toUpperCase() !== "CANCELLED");
  const billed = invoices.reduce((sum, item) => sum + Number(item.totalAmount), 0);
  const term = search.trim().toLowerCase();
  const filteredInvoices = invoices.filter(item => `${item.invoiceNumber} ${item.studentName} ${item.status}`.toLowerCase().includes(term));
  const filteredPayments = payments.filter(item => `${item.paymentNumber} ${item.studentName} ${item.paymentMethod} ${item.referenceNo ?? ""}`.toLowerCase().includes(term));
  const selectedInvoice = outstandingInvoices.find(item => item.invoiceId === paymentForm.invoiceId);

  return (
    <>
      <PageHeader
        title="Finance & Fees"
        subtitle="Student invoices, outstanding balances and posted payments"
        action={(canCreateInvoice || canRecordPayment) ? (
          <div className="page-actions">
            {canCreateInvoice && <button className="secondary" onClick={() => setInvoiceModal(true)}><FilePlus2 size={14} /> New invoice</button>}
            {canRecordPayment && <button className="primary" onClick={() => setPaymentModal(true)}><Banknote size={14} /> Record payment</button>}
          </div>
        ) : undefined}
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total billed" value={pkr(billed)} note={`${invoices.length} invoices`} color="#2563EB" bg="#EFF6FF"><ReceiptText size={20} /></StatCard>
        <StatCard label="Outstanding" value={pkr(dashboard.data?.outstandingBalance ?? 0)} note={`${outstandingInvoices.length} open invoices`} color="#D97706" bg="#FFFBEB"><Wallet size={20} /></StatCard>
        <StatCard label="Collected this month" value={pkr(dashboard.data?.collectedThisMonth ?? 0)} note="posted payments" color="#059669" bg="#ECFDF5"><Banknote size={20} /></StatCard>
        <StatCard label="Payment entries" value={String(payments.length)} note="latest ledger view" color="#4F46E5" bg="#EEF2FF"><CreditCard size={20} /></StatCard>
      </section>

      <div className="section-tabs">
        <button className={tab === "invoices" ? "active" : ""} onClick={() => setTab("invoices")}>🧾 Invoices ({invoices.length})</button>
        <button className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}>💳 Payments ({payments.length})</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left"><h3>{tab === "invoices" ? "Student invoices" : "Payment ledger"}</h3><p>{tab === "invoices" ? "Balances update when payments are allocated." : "Posted payments are immutable accounting entries."}</p></div>
          <label className="search-box" style={{ maxWidth: 320 }}><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search number, student, method…" /></label>
        </div>

        {dashboard.isLoading ? (
          <div className="empty-state"><b>Loading finance records…</b></div>
        ) : tab === "invoices" ? (
          filteredInvoices.length === 0 ? <div className="empty-state"><ReceiptText size={34} /><b>No invoices found</b><p>Create an invoice for an active student.</p></div> : (
            <div className="table-wrap sticky-head"><table className="premium-table">
              <thead><tr><th>Invoice</th><th>Student</th><th>Invoice date</th><th>Due date</th><th>Total</th><th>Balance</th><th>Status</th>{canRecordPayment && <th style={{ textAlign: "right" }}>Action</th>}</tr></thead>
              <tbody>{filteredInvoices.map(invoice => <tr key={invoice.invoiceId}>
                <td><b>{invoice.invoiceNumber}</b></td><td>{invoice.studentName}</td><td>{displayDate(invoice.invoiceDate)}</td><td>{invoice.dueDate ? displayDate(invoice.dueDate) : "—"}</td><td><b>{pkr(invoice.totalAmount)}</b></td>
                <td><b style={{ color: Number(invoice.balanceAmount) > 0 ? "var(--warning)" : "var(--success)" }}>{pkr(invoice.balanceAmount)}</b></td>
                <td><span className={`status-pill ${Number(invoice.balanceAmount) <= 0 ? "success" : invoice.status.toUpperCase() === "OVERDUE" ? "danger" : "warning"}`}>{invoice.status}</span></td>
                {canRecordPayment && <td style={{ textAlign: "right" }}>{Number(invoice.balanceAmount) > 0 && <button className="soft-button" onClick={() => { setPaymentForm(current => ({ ...current, invoiceId: invoice.invoiceId, amount: String(invoice.balanceAmount) })); setPaymentModal(true); }}>Pay</button>}</td>}
              </tr>)}</tbody>
            </table></div>
          )
        ) : (
          filteredPayments.length === 0 ? <div className="empty-state"><CreditCard size={34} /><b>No payments posted</b><p>Recorded payments will appear here as an immutable ledger.</p></div> : (
            <div className="table-wrap sticky-head"><table className="premium-table">
              <thead><tr><th>Payment</th><th>Student</th><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
              <tbody>{filteredPayments.map(payment => <tr key={payment.paymentId}>
                <td><b>{payment.paymentNumber}</b></td><td>{payment.studentName}</td><td>{new Date(payment.paymentDate).toLocaleString("en-PK")}</td><td><b style={{ color: "var(--success)" }}>{pkr(payment.amount)}</b></td><td><span className="status-pill info">{payment.paymentMethod.replaceAll("_", " ")}</span></td><td>{payment.referenceNo || "—"}</td>
              </tr>)}</tbody>
            </table></div>
          )
        )}
      </div>

      {invoiceModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setInvoiceModal(false)}>
          <div className="modal-card" style={{ width: "min(680px,96vw)" }}>
            <div className="modal-head"><div><h2>Create student invoice</h2><p>The full amount starts as outstanding balance.</p></div><button className="icon-button" onClick={() => setInvoiceModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Student *</span><select value={invoiceForm.studentId} onChange={event => setInvoiceForm(current => ({ ...current, studentId: event.target.value }))}><option value="">Select student</option>{students.map((student: any) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName ?? ""} ({student.studentNumber ?? student.id.slice(-6)})</option>)}</select></label>
              <label className="human-field"><span>Academic year</span><select value={invoiceForm.academicYearId} onChange={event => setInvoiceForm(current => ({ ...current, academicYearId: event.target.value }))}><option value="">Not specified</option>{academicYears.map((year: any) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
              <label className="human-field"><span>Total amount (PKR) *</span><input type="number" min="1" value={invoiceForm.totalAmount} onChange={event => setInvoiceForm(current => ({ ...current, totalAmount: event.target.value }))} /></label>
              <label className="human-field"><span>Invoice date *</span><input type="date" value={invoiceForm.invoiceDate} onChange={event => setInvoiceForm(current => ({ ...current, invoiceDate: event.target.value }))} /></label>
              <label className="human-field"><span>Due date</span><input type="date" min={invoiceForm.invoiceDate} value={invoiceForm.dueDate} onChange={event => setInvoiceForm(current => ({ ...current, dueDate: event.target.value }))} /></label>
              <label className="human-field field-wide"><span>Description</span><textarea value={invoiceForm.description} onChange={event => setInvoiceForm(current => ({ ...current, description: event.target.value }))} placeholder="Fee period, fee type or billing note" /></label>
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setInvoiceModal(false)}>Cancel</button><button className="primary" disabled={!invoiceForm.studentId || !invoiceForm.invoiceDate || Number(invoiceForm.totalAmount) <= 0 || createInvoice.isPending} onClick={() => createInvoice.mutate()}>{createInvoice.isPending ? "Creating…" : "Create invoice"}</button></div>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setPaymentModal(false)}>
          <div className="modal-card" style={{ width: "min(620px,96vw)" }}>
            <div className="modal-head"><div><h2>Record payment</h2><p>Payment is allocated to one outstanding invoice.</p></div><button className="icon-button" onClick={() => setPaymentModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Outstanding invoice *</span><select value={paymentForm.invoiceId} onChange={event => { const invoice = outstandingInvoices.find(item => item.invoiceId === event.target.value); setPaymentForm(current => ({ ...current, invoiceId: event.target.value, amount: invoice ? String(invoice.balanceAmount) : current.amount })); }}><option value="">Select invoice</option>{outstandingInvoices.map(invoice => <option key={invoice.invoiceId} value={invoice.invoiceId}>{invoice.invoiceNumber} · {invoice.studentName} · {pkr(invoice.balanceAmount)} due</option>)}</select></label>
              <label className="human-field"><span>Amount *</span><input type="number" min="1" max={selectedInvoice?.balanceAmount} value={paymentForm.amount} onChange={event => setPaymentForm(current => ({ ...current, amount: event.target.value }))} /></label>
              <label className="human-field"><span>Payment method *</span><select value={paymentForm.paymentMethod} onChange={event => setPaymentForm(current => ({ ...current, paymentMethod: event.target.value }))}>{PAYMENT_METHODS.map(method => <option key={method} value={method}>{method.replaceAll("_", " ")}</option>)}</select></label>
              <label className="human-field field-wide"><span>Reference / cheque / transaction no.</span><input value={paymentForm.referenceNo} onChange={event => setPaymentForm(current => ({ ...current, referenceNo: event.target.value }))} /></label>
              {selectedInvoice && <div className="field-wide" style={{ padding: "12px 14px", borderRadius:"var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>Current outstanding: <b>{pkr(selectedInvoice.balanceAmount)}</b></div>}
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setPaymentModal(false)}>Cancel</button><button className="primary" disabled={!paymentForm.invoiceId || Number(paymentForm.amount) <= 0 || (selectedInvoice ? Number(paymentForm.amount) > Number(selectedInvoice.balanceAmount) : false) || postPayment.isPending} onClick={() => postPayment.mutate()}>{postPayment.isPending ? "Posting…" : "Post payment"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
