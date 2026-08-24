import { useEffect, useMemo, useState } from "react";
import { Building2, KeyRound, Search, ShieldCheck, UserRoundCog, UserX } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { env } from "../../../config/env";
import { useAuth } from "../../auth/auth";

type Tenant = { id?: string; tenantId?: string; code: string; name: string; isActive?: boolean };
type IdentityUser = { id: string; tenantId?: string | null; email: string; firstName: string; lastName: string;
  displayName?: string | null; accountType?: string | null; isActive: boolean; mustChangePassword: boolean; roles: string[] };
type CreatedAccount = { email: string; temporaryPassword: string };
const identityPath = (path: string) => import.meta.env.DEV ? `/identity${path}` : `${env.identityBaseUrl}${path}`;
const tenantIdOf = (tenant: Tenant) => tenant.id ?? tenant.tenantId ?? "";
const unwrap = <T,>(data: any): T[] => data?.items ?? data?.value?.items ?? (Array.isArray(data) ? data : []);

/** Platform administration workspace for SuperAdmin tenant and identity operations. */
export function PlatformAdminPage() {
  const { user, impersonate } = useAuth();
  const { notify } = useUi();
  const [tenantId, setTenantId] = useState(sessionStorage.getItem("selected_tenant_id") ?? "");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<IdentityUser[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedAccount | null>(null);
  const [impersonationTarget, setImpersonationTarget] = useState<IdentityUser | null>(null);
  const [reason, setReason] = useState("Support and troubleshooting session");
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "" });
  const isSuperAdmin = user?.roles.includes("SuperAdmin") ?? false;

  async function loadTenants(): Promise<void> {
    if (!isSuperAdmin) return;
    try {
      const { data } = await api.get("/api/tenancy/tenant", { params: { tenantId: user?.tenantId, page: 1, pageSize: 250 } });
      setTenants(unwrap<Tenant>(data));
    } catch (error) { notify({ kind: "error", title: "Tenants unavailable", message: getErrorMessage(error) }); }
  }

  async function loadUsers(): Promise<void> {
    if (!isSuperAdmin) return;
    try {
      const token = (localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token")) ?? "";
      const { data } = await fetch(`${identityPath("/api/identity/users")}?page=1&pageSize=100${tenantId ? `&tenantId=${tenantId}` : ""}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }).then(async response => {
          if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? `Identity request failed (${response.status}).`);
          return { data: await response.json() };
        });
      setUsers(unwrap<IdentityUser>(data));
    } catch (error) { notify({ kind: "error", title: "Users unavailable", message: getErrorMessage(error) }); }
  }

  useEffect(() => { void loadTenants(); }, [isSuperAdmin]);
  useEffect(() => { void loadUsers(); }, [tenantId, isSuperAdmin]);

  const visibleUsers = useMemo(() => users.filter(item =>
    `${item.displayName ?? ""} ${item.email} ${item.roles.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  function selectTenant(value: string): void {
    setTenantId(value);
    value ? sessionStorage.setItem("selected_tenant_id", value) : sessionStorage.removeItem("selected_tenant_id");
  }

  async function createAdmin(): Promise<void> {
    if (!tenantId || !form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      notify({ kind: "warning", title: "Complete required fields", message: "Select a tenant and enter the administrator's name and email." }); return;
    }
    setBusy(true);
    try {
      const token = (localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token")) ?? "";
      const response = await fetch(identityPath("/api/identity/users"), { method: "POST", headers: { Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ tenantId, schoolId: null,
          email: form.email.trim(), password: null, firstName: form.firstName.trim(), lastName: form.lastName.trim(), accountType: "SchoolAdmin", roles: ["SchoolAdmin"] }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail ?? data.title ?? "The administrator could not be created.");
      setCreated({ email: form.email.trim(), temporaryPassword: data.temporaryPassword }); setForm({ email: "", firstName: "", lastName: "" });
      notify({ kind: "success", title: "School administrator created", message: "The account is ready and must change its temporary password on first sign-in." });
      await loadUsers();
    } catch (error) { notify({ kind: "error", title: "Account creation failed", message: getErrorMessage(error) }); }
    finally { setBusy(false); }
  }

  async function setTenantActive(active: boolean): Promise<void> {
    if (!tenantId) { notify({ kind: "warning", message: "Select a tenant first." }); return; }
    try {
      const token = (localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token")) ?? "";
      const response = await fetch(identityPath(`/api/identity/users/tenant/${tenantId}/status`), { method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ isActive: active }) });
      const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.detail ?? data.title ?? "Status update failed.");
      notify({ kind: "success", title: active ? "Tenant enabled" : "Tenant disabled", message: `${data.affectedUsers ?? 0} user accounts were updated.` });
      await Promise.all([loadUsers(), loadTenants()]);
    } catch (error) { notify({ kind: "error", title: "Status update failed", message: getErrorMessage(error) }); }
  }

  async function beginImpersonation(): Promise<void> {
    if (!impersonationTarget) return;
    const result = await impersonate(impersonationTarget.id, reason);
    if (!result.success) { notify({ kind: "error", title: "Impersonation failed", message: result.message ?? "Identity rejected the request." }); return; }
    notify({ kind: "success", title: `Signed in as ${impersonationTarget.displayName ?? impersonationTarget.email}`, message: "The audited support session is active. Use the banner to return to your administrator account." });
    setImpersonationTarget(null); window.location.assign("/");
  }

  if (!isSuperAdmin) return <div className="empty-state">Platform management is available to SuperAdmin only.</div>;
  return <>
    <PageHeader title="Platform Management" subtitle="Tenant master accounts, lifecycle control and audited support impersonation" />
    <section className="metric-grid platform-metrics">
      <article className="metric-card"><span>Tenants</span><strong>{tenants.length}</strong><small>Organizations visible to platform administration</small></article>
      <article className="metric-card"><span>Users in context</span><strong>{users.length}</strong><small>{tenantId ? "Selected tenant" : "All accessible tenants"}</small></article>
      <article className="metric-card"><span>Active users</span><strong>{users.filter(x => x.isActive).length}</strong><small>Enabled identity accounts</small></article>
      <article className="metric-card"><span>Security</span><strong><ShieldCheck size={24}/></strong><small>Audited impersonation enabled</small></article>
    </section>
    <section className="surface admin-control-bar">
      <div><span className="eyebrow">Tenant context</span><select className="filter-select" value={tenantId} onChange={event => selectTenant(event.target.value)}><option value="">All tenants</option>{tenants.map(t => <option key={tenantIdOf(t)} value={tenantIdOf(t)}>{t.name} ({t.code})</option>)}</select></div>
      <div className="page-actions"><button className="secondary" disabled={!tenantId} onClick={() => void setTenantActive(false)}><UserX size={15}/> Disable tenant</button><button disabled={!tenantId} onClick={() => void setTenantActive(true)}><ShieldCheck size={15}/> Enable tenant</button></div>
    </section>
    <div className="admin-grid">
      <section className="surface form-surface"><div className="surface-head"><div><h3>Create school master administrator</h3><p>Creates a tenant administrator with a one-time temporary password.</p></div><KeyRound size={19}/></div>
        <div className="human-form"><div className="human-form-grid"><label className="human-field"><span>Email *</span><input type="email" value={form.email} onChange={e => setForm(v => ({...v,email:e.target.value}))}/></label><label className="human-field"><span>First name *</span><input value={form.firstName} onChange={e => setForm(v => ({...v,firstName:e.target.value}))}/></label><label className="human-field"><span>Last name *</span><input value={form.lastName} onChange={e => setForm(v => ({...v,lastName:e.target.value}))}/></label></div><button className="primary" disabled={busy || !tenantId} onClick={() => void createAdmin()}>{busy ? "Creating…" : "Create administrator"}</button></div>
      </section>
      <section className="surface data-surface"><div className="surface-head"><div><h3>Tenant users</h3><p>Manage and enter an audited support session.</p></div><label className="search-box"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users"/></label></div><div className="table-wrap"><table className="premium-table"><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Support</th></tr></thead><tbody>{visibleUsers.map(item => <tr key={item.id}><td><div className="entity-cell"><span className="entity-icon"><Building2 size={15}/></span><div><b>{item.displayName ?? `${item.firstName} ${item.lastName}`}</b><small>{item.email}</small></div></div></td><td>{item.roles.join(", ")}</td><td><span className={`status-pill ${item.isActive ? "success" : "danger"}`}>{item.isActive ? "Active" : "Disabled"}</span></td><td><button className="table-action" disabled={!item.isActive} onClick={() => setImpersonationTarget(item)}><UserRoundCog size={14}/> Login as user</button></td></tr>)}</tbody></table></div></section>
    </div>
    <Modal open={!!impersonationTarget} title="Start audited support session" onClose={() => setImpersonationTarget(null)}><div className="human-form"><div className="form-context"><UserRoundCog size={18}/><div><b>{impersonationTarget?.displayName ?? impersonationTarget?.email}</b><span>{impersonationTarget?.roles.join(", ")}</span></div></div><label className="human-field"><span>Reason *</span><textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is impersonation required?"/></label></div><div className="modal-actions"><button className="secondary" onClick={() => setImpersonationTarget(null)}>Cancel</button><button className="primary" onClick={() => void beginImpersonation()}>Start support session</button></div></Modal>
    <Modal open={!!created} title="Administrator account created" onClose={() => setCreated(null)}>{created && <div className="credential-card"><div className="credential-success"><ShieldCheck size={22}/><div><b>Account is ready</b><span>Share the temporary password securely. It is shown here once.</span></div></div><div className="credential-row"><span>Email</span><b>{created.email}</b></div><div className="credential-row"><span>Temporary password</span><code>{created.temporaryPassword}</code></div></div>}<div className="modal-actions"><button className="primary" onClick={() => setCreated(null)}>Done</button></div></Modal>
  </>;
}
