import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, CalendarDays, CheckCircle2, FileText, Play, Search, UserRound, WalletCards, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useEmployees } from "../../../core/api/queries";
import { operationalApi } from "../../../core/api/operationalApi";
import { toItems } from "../../../core/utils/dataHelpers";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const pkr = (value: number) => new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", maximumFractionDigits: 0 }).format(Number(value || 0));
const monthName = (year: number, month: number) => new Date(year, month - 1, 1).toLocaleDateString("en-PK", { month: "long", year: "numeric" });

export function PayrollPage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const canRun = permissions.can("payroll.run");
  const [tab, setTab] = useState<"compensation" | "runs" | "payslips">("compensation");
  const [search, setSearch] = useState("");
  const [compModal, setCompModal] = useState(false);
  const [runModal, setRunModal] = useState(false);
  const now = new Date();
  const [compForm, setCompForm] = useState({ employeeId: "", jobGradeId: "", effectiveFrom: now.toISOString().slice(0, 10), basicSalary: "", grossSalary: "", currencyCode: "PKR" });
  const [runForm, setRunForm] = useState({ year: String(now.getFullYear()), month: String(now.getMonth() + 1) });

  const dashboard = useQuery({
    queryKey: ["payroll-operations", tenantId],
    queryFn: () => operationalApi.payroll.dashboard(tenantId),
    enabled: Boolean(tenantId),
  });
  const { data: employeeData } = useEmployees(1, compModal);
  const employees = toItems(employeeData);

  const saveCompensation = useMutation({
    mutationFn: () => operationalApi.payroll.saveCompensation({
      tenantId,
      employeeId: compForm.employeeId,
      jobGradeId: compForm.jobGradeId || null,
      effectiveFrom: compForm.effectiveFrom,
      basicSalary: Number(compForm.basicSalary),
      grossSalary: compForm.grossSalary ? Number(compForm.grossSalary) : null,
      currencyCode: compForm.currencyCode.toUpperCase(),
    }),
    onSuccess: async () => {
      setCompModal(false);
      setCompForm({ employeeId: "", jobGradeId: "", effectiveFrom: now.toISOString().slice(0, 10), basicSalary: "", grossSalary: "", currencyCode: "PKR" });
      await queryClient.invalidateQueries({ queryKey: ["payroll-operations", tenantId] });
    },
  });

  const createRun = useMutation({
    mutationFn: () => operationalApi.payroll.createRun({ tenantId, year: Number(runForm.year), month: Number(runForm.month) }),
    onSuccess: async () => {
      setRunModal(false);
      setTab("runs");
      await queryClient.invalidateQueries({ queryKey: ["payroll-operations", tenantId] });
    },
  });

  const approveRun = useMutation({
    mutationFn: (runId: string) => operationalApi.payroll.approveRun(tenantId, runId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payroll-operations", tenantId] }),
  });

  const compensations = dashboard.data?.compensations ?? [];
  const runs = dashboard.data?.runs ?? [];
  const payslips = dashboard.data?.payslips ?? [];
  const activeCompensations = compensations.filter(item => !item.effectiveTo && item.status.toUpperCase() === "ACTIVE");
  const monthlyGross = activeCompensations.reduce((sum, item) => sum + Number(item.grossSalary), 0);
  const latestRun = runs[0];
  const latestPayslipNet = payslips.filter(item => !latestRun || item.runId === latestRun.runId).reduce((sum, item) => sum + Number(item.netAmount), 0);
  const term = search.trim().toLowerCase();
  const filteredComp = compensations.filter(item => `${item.employeeName} ${item.employeeNumber} ${item.status}`.toLowerCase().includes(term));
  const filteredRuns = runs.filter(item => `${item.year} ${item.month} ${item.status}`.toLowerCase().includes(term));
  const filteredPayslips = payslips.filter(item => `${item.employeeName} ${item.employeeNumber} ${item.year} ${item.month} ${item.runStatus}`.toLowerCase().includes(term));

  return (
    <>
      <PageHeader
        title="Payroll"
        subtitle="Effective compensation, payroll runs and persisted payslips"
        action={canRun ? (
          <div className="page-actions">
            <button className="secondary" onClick={() => setCompModal(true)}><BadgeDollarSign size={14} /> Set compensation</button>
            <button className="primary" onClick={() => setRunModal(true)}><Play size={14} /> Run payroll</button>
          </div>
        ) : undefined}
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Active compensation" value={String(activeCompensations.length)} note="employees configured" color="#2563EB" bg="#EFF6FF"><UserRound size={20} /></StatCard>
        <StatCard label="Monthly gross" value={pkr(monthlyGross)} note="current compensation" color="#4F46E5" bg="#EEF2FF"><BadgeDollarSign size={20} /></StatCard>
        <StatCard label="Payroll runs" value={String(runs.length)} note={latestRun ? monthName(latestRun.year, latestRun.month) : "none yet"} color="#D97706" bg="#FFFBEB"><CalendarDays size={20} /></StatCard>
        <StatCard label="Latest net payroll" value={pkr(latestPayslipNet)} note={`${latestRun?.employeeCount ?? 0} employees`} color="#059669" bg="#ECFDF5"><WalletCards size={20} /></StatCard>
      </section>

      <div className="section-tabs">
        <button className={tab === "compensation" ? "active" : ""} onClick={() => setTab("compensation")}>👥 Compensation ({compensations.length})</button>
        <button className={tab === "runs" ? "active" : ""} onClick={() => setTab("runs")}>⚙ Payroll runs ({runs.length})</button>
        <button className={tab === "payslips" ? "active" : ""} onClick={() => setTab("payslips")}>📄 Payslips ({payslips.length})</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left"><h3>{tab === "compensation" ? "Employee compensation" : tab === "runs" ? "Payroll run history" : "Payslip register"}</h3><p>{tab === "compensation" ? "Effective-dated salary source used for payroll generation." : tab === "runs" ? "Monthly payroll snapshots and approval status." : "Persisted employee payroll results."}</p></div>
          <label className="search-box" style={{ maxWidth: 300 }}><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search employee, period or status…" /></label>
        </div>

        {dashboard.isLoading ? <div className="empty-state"><b>Loading payroll…</b></div> : tab === "compensation" ? (
          filteredComp.length === 0 ? <div className="empty-state"><BadgeDollarSign size={34} /><b>No compensation configured</b><p>Set effective compensation before creating a payroll run.</p></div> : (
            <div className="table-wrap sticky-head"><table className="premium-table">
              <thead><tr><th>Employee</th><th>Number</th><th>Effective from</th><th>Basic salary</th><th>Gross salary</th><th>Currency</th><th>Status</th></tr></thead>
              <tbody>{filteredComp.map(item => <tr key={item.compensationId}>
                <td><b>{item.employeeName}</b></td><td><code style={{ fontSize: 11 }}>{item.employeeNumber}</code></td><td>{new Date(`${item.effectiveFrom}T00:00:00`).toLocaleDateString("en-PK")}</td><td>{pkr(item.basicSalary)}</td><td><b>{pkr(item.grossSalary)}</b></td><td>{item.currencyCode}</td><td><span className={`status-pill ${item.status.toUpperCase() === "ACTIVE" ? "success" : "gray"}`}>{item.status}</span></td>
              </tr>)}</tbody>
            </table></div>
          )
        ) : tab === "runs" ? (
          filteredRuns.length === 0 ? <div className="empty-state"><CalendarDays size={34} /><b>No payroll runs</b><p>Run payroll after employee compensation is configured.</p></div> : (
            <div className="table-wrap sticky-head"><table className="premium-table">
              <thead><tr><th>Period</th><th>Employees</th><th>Gross</th><th>Net</th><th>Created</th><th>Status</th>{canRun && <th style={{ textAlign: "right" }}>Action</th>}</tr></thead>
              <tbody>{filteredRuns.map(run => <tr key={run.runId}>
                <td><b>{monthName(run.year, run.month)}</b></td><td>{run.employeeCount}</td><td>{pkr(run.grossAmount)}</td><td><b>{pkr(run.netAmount)}</b></td><td>{new Date(run.createdAt).toLocaleString("en-PK")}</td><td><span className={`status-pill ${run.status.toUpperCase() === "APPROVED" ? "success" : "warning"}`}>{run.status}</span></td>
                {canRun && <td style={{ textAlign: "right" }}>{run.status.toUpperCase() !== "APPROVED" && <button className="soft-button" disabled={approveRun.isPending} onClick={() => approveRun.mutate(run.runId)}><CheckCircle2 size={13} /> Approve</button>}</td>}
              </tr>)}</tbody>
            </table></div>
          )
        ) : (
          filteredPayslips.length === 0 ? <div className="empty-state"><FileText size={34} /><b>No payslips generated</b><p>Creating a payroll run snapshots employee payroll records.</p></div> : (
            <div className="table-wrap sticky-head"><table className="premium-table">
              <thead><tr><th>Employee</th><th>Number</th><th>Period</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Run status</th></tr></thead>
              <tbody>{filteredPayslips.map(item => <tr key={item.employeePayrollId}>
                <td><b>{item.employeeName}</b></td><td><code style={{ fontSize: 11 }}>{item.employeeNumber}</code></td><td>{monthName(item.year, item.month)}</td><td>{pkr(item.grossAmount)}</td><td>{pkr(item.deductionAmount)}</td><td><b style={{ color: "var(--success)" }}>{pkr(item.netAmount)}</b></td><td><span className={`status-pill ${item.runStatus.toUpperCase() === "APPROVED" ? "success" : "warning"}`}>{item.runStatus}</span></td>
              </tr>)}</tbody>
            </table></div>
          )
        )}
      </div>

      {compModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setCompModal(false)}>
          <div className="modal-card" style={{ width: "min(650px,96vw)" }}>
            <div className="modal-head"><div><h2>Set employee compensation</h2><p>A new effective-dated record becomes the payroll source.</p></div><button className="icon-button" onClick={() => setCompModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Employee *</span><select value={compForm.employeeId} onChange={event => setCompForm(current => ({ ...current, employeeId: event.target.value }))}><option value="">Select active employee</option>{employees.map((employee: any) => <option key={employee.id} value={employee.id}>{employee.firstName} {employee.lastName ?? ""} ({employee.employeeNumber ?? employee.id.slice(-6)})</option>)}</select></label>
              <label className="human-field"><span>Effective from *</span><input type="date" value={compForm.effectiveFrom} onChange={event => setCompForm(current => ({ ...current, effectiveFrom: event.target.value }))} /></label>
              <label className="human-field"><span>Currency</span><input maxLength={3} value={compForm.currencyCode} onChange={event => setCompForm(current => ({ ...current, currencyCode: event.target.value.toUpperCase() }))} /></label>
              <label className="human-field"><span>Basic salary *</span><input type="number" min="1" value={compForm.basicSalary} onChange={event => setCompForm(current => ({ ...current, basicSalary: event.target.value }))} /></label>
              <label className="human-field"><span>Gross salary</span><input type="number" min={compForm.basicSalary || "1"} value={compForm.grossSalary} onChange={event => setCompForm(current => ({ ...current, grossSalary: event.target.value }))} placeholder="Defaults to basic" /></label>
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setCompModal(false)}>Cancel</button><button className="primary" disabled={!compForm.employeeId || !compForm.effectiveFrom || Number(compForm.basicSalary) <= 0 || saveCompensation.isPending} onClick={() => saveCompensation.mutate()}>{saveCompensation.isPending ? "Saving…" : "Save compensation"}</button></div>
          </div>
        </div>
      )}

      {runModal && (
        <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setRunModal(false)}>
          <div className="modal-card" style={{ width: "min(520px,96vw)" }}>
            <div className="modal-head"><div><h2>Run payroll</h2><p>Creates an immutable payroll snapshot for the selected month.</p></div><button className="icon-button" onClick={() => setRunModal(false)}><X size={18} /></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field"><span>Year *</span><input type="number" min="2000" max="2200" value={runForm.year} onChange={event => setRunForm(current => ({ ...current, year: event.target.value }))} /></label>
              <label className="human-field"><span>Month *</span><select value={runForm.month} onChange={event => setRunForm(current => ({ ...current, month: event.target.value }))}>{Array.from({ length: 12 }, (_, index) => index + 1).map(month => <option key={month} value={month}>{new Date(2026, month - 1, 1).toLocaleDateString("en-PK", { month: "long" })}</option>)}</select></label>
              <div className="field-wide" style={{ padding: "12px 14px", borderRadius:"var(--r-md)", background: "var(--surface-2)", border: "1px solid var(--line)", fontSize: 12 }}>Configured employees: <b>{activeCompensations.length}</b> · Current gross basis: <b>{pkr(monthlyGross)}</b></div>
            </div></div>
            <div className="modal-actions"><button className="secondary" onClick={() => setRunModal(false)}>Cancel</button><button className="primary" disabled={activeCompensations.length === 0 || createRun.isPending} onClick={() => createRun.mutate()}>{createRun.isPending ? "Processing…" : "Create payroll run"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}
