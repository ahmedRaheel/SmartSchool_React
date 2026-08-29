import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, MoreHorizontal, Plus, Search, ShieldCheck, Trash2, UserRoundCog } from "lucide-react";
import { api } from "../../../core/api/ApiClient";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { useAuth } from "../../auth/auth";
import { env } from "../../../config/env";

type Tenant = {
  id: string;
  tenantId?: string;
  code: string;
  name: string;
  isActive?: boolean;
  status?: string;
};

const tenantIdOf = (tenant: Tenant) => tenant.id || tenant.tenantId || "";

export function TenantManagementPage() {
  const { notify } = useUi();
  const { impersonate: startImpersonation } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [form, setForm] = useState({
    name: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhoneNumber: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
  });
  const [createdAccount, setCreatedAccount] = useState<any>(null);

  async function load() {
    try {
      const response = await api.get<any>("/api/tenancy/tenant", {
        params: { page: 1, pageSize: 250 },
      });
      setTenants(response.data?.items ?? response.data ?? []);
    } catch (error: any) {
      notify({kind:"error",title:"Unable to load tenants",message:error?.message ?? "Tenant request failed."});
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(
    () => tenants.filter((tenant) =>
      `${tenant.name} ${tenant.code}`.toLowerCase().includes(query.toLowerCase())),
    [tenants, query],
  );

  const active = tenants.filter((tenant) => tenant.isActive !== false).length;
  const disabled = tenants.length - active;

  async function createTenant() {
    try {
      const response = await api.post<any>("/api/tenancy/tenant", form);
      setCreateOpen(false);
      setForm({
            name: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminPhoneNumber: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        contactAddress: "",
      });
      setCreatedAccount(response.data?.adminAccount ?? null);
      notify({kind:"success",title:"Tenant created",message:"Tenant and master administrator created successfully."});
      await load();
    } catch (error: any) {
      notify({kind:"error",title:"Tenant creation failed",message:error?.message ?? "Tenant could not be created."});
    }
  }

  async function impersonate(tenant: Tenant): Promise<void> {
    const tenantId = tenantIdOf(tenant);
    sessionStorage.setItem("selected_tenant_id", tenantId);

    try {
      const token = localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token") ?? "";
      const baseUrl = import.meta.env.DEV ? "/identity" : env.identityBaseUrl;
      const response = await fetch(`${baseUrl}/api/identity/users?page=1&pageSize=100&tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`Unable to load tenant users (${response.status}).`);

      const payload = await response.json();
      const users = payload?.items ?? payload?.value?.items ?? [];
      const administrator = users.find((item: any) =>
        item.isActive !== false && item.roles?.some((role: string) => ["SchoolAdmin", "TenantAdmin", "Admin"].includes(role)));

      if (!administrator) {
        window.location.assign(`/platform?tenantId=${tenantId}`);
        return;
      }

      const result = await startImpersonation(administrator.id, `Tenant support session for ${tenant.name}`);
      if (!result.success) throw new Error(result.message ?? "Identity rejected the impersonation request.");
      window.location.assign("/");
    } catch (error) {
      notify({ kind: "error", title: "Impersonation failed", message: error instanceof Error ? error.message : "Unable to start support session." });
    }
  }

  return (
    <>
      <PageHeader
        title="Tenants"
        subtitle="Manage every organization using the SmartSchool platform"
        action={<button className="primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Add Tenant</button>}
      />

      <div className="metric-grid platform-metrics">
        <article className="metric-card"><span>Total tenants</span><strong>{tenants.length}</strong><small>Organizations on platform</small></article>
        <article className="metric-card"><span>Active</span><strong>{active}</strong><small>Enabled organizations</small></article>
        <article className="metric-card"><span>Disabled</span><strong>{disabled}</strong><small>Access currently suspended</small></article>
        <article className="metric-card"><span>Platform control</span><strong><ShieldCheck size={24}/></strong><small>SuperAdmin governed</small></article>
      </div>

      <section className="surface data-surface">
        <div className="surface-head">
          <div><h3>Tenant directory</h3><p>View, administer or enter a tenant support context.</p></div>
          <label className="search-box"><Search size={16}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tenants..." /></label>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Tenant</th><th>Code</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr key={tenantIdOf(tenant)}>
                  <td><div className="entity-cell"><span className="entity-icon"><Building2 size={16}/></span><div><b>{tenant.name}</b><small>{tenantIdOf(tenant)}</small></div></div></td>
                  <td>{tenant.code}</td>
                  <td><span className={`status-pill ${tenant.isActive === false ? "danger" : "success"}`}>{tenant.isActive === false ? "Disabled" : "Active"}</span></td>
                  <td className="row-actions">
                    <button className="table-action" onClick={() => setSelected(tenant)}><Eye size={14}/> View</button>
                    <button className="table-action" onClick={() => void impersonate(tenant)}><UserRoundCog size={14}/> Impersonate</button>
                    <button className="table-action danger" title="Delete tenant"><Trash2 size={14}/></button>
                    <button className="table-action" title="More actions"><MoreHorizontal size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={createOpen} title="Create Tenant · Multi-step onboarding" onClose={() => { setCreateOpen(false); setCreateStep(0); }}>
        <div className="wizard-progress tenant-wizard-progress">
          {["Organization", "Administrator", "Contact", "Review"].map((label, index) => <div className={`wizard-step ${index === createStep ? "active" : ""} ${index < createStep ? "done" : ""}`} key={label}><span>{index + 1}</span><b>{label}</b></div>)}
        </div>
        <div className="human-form tenant-create-wizard">
          {createStep === 0 && <><div className="form-section-title"><b>Organization</b><span>Create the tenant aggregate root. The tenant code is generated by the backend.</span></div><div className="human-form-grid"><label className="human-field"><span>Tenant name *</span><input value={form.name} onChange={(e) => setForm(v => ({...v, name: e.target.value}))} placeholder="School organization name" /></label></div></>}
          {createStep === 1 && <><div className="form-section-title"><b>Master administrator</b><span>The administrator account is provisioned only with the tenant transaction.</span></div><div className="human-form-grid"><label className="human-field"><span>First name *</span><input value={form.adminFirstName} onChange={(e) => setForm(v => ({...v, adminFirstName: e.target.value}))}/></label><label className="human-field"><span>Last name *</span><input value={form.adminLastName} onChange={(e) => setForm(v => ({...v, adminLastName: e.target.value}))}/></label><label className="human-field"><span>Email / login *</span><input type="email" value={form.adminEmail} onChange={(e) => setForm(v => ({...v, adminEmail: e.target.value}))}/></label><label className="human-field"><span>Phone</span><input value={form.adminPhoneNumber} onChange={(e) => setForm(v => ({...v, adminPhoneNumber: e.target.value}))}/></label></div></>}
          {createStep === 2 && <><div className="form-section-title"><b>Tenant contact</b><span>Business contact is stored separately from the tenant root.</span></div><div className="human-form-grid"><label className="human-field"><span>Contact name *</span><input value={form.contactName} onChange={(e) => setForm(v => ({...v, contactName: e.target.value}))}/></label><label className="human-field"><span>Contact email *</span><input type="email" value={form.contactEmail} onChange={(e) => setForm(v => ({...v, contactEmail: e.target.value}))}/></label><label className="human-field"><span>Contact phone *</span><input value={form.contactPhone} onChange={(e) => setForm(v => ({...v, contactPhone: e.target.value}))}/></label><label className="human-field field-wide"><span>Address *</span><textarea value={form.contactAddress} onChange={(e) => setForm(v => ({...v, contactAddress: e.target.value}))}/></label></div></>}
          {createStep === 3 && <><div className="form-section-title"><b>Review & create</b><span>Confirm the organization, administrator and business contact before creation.</span></div><div className="review-grid"><div className="review-item"><span>Tenant</span><b>{form.name || "—"}</b></div><div className="review-item"><span>Administrator</span><b>{`${form.adminFirstName} ${form.adminLastName}`.trim() || "—"}</b></div><div className="review-item"><span>Login</span><b>{form.adminEmail || "—"}</b></div><div className="review-item"><span>Business contact</span><b>{form.contactName || "—"}</b></div></div></>}
        </div>
        <div className="modal-actions"><button className="secondary" onClick={() => createStep === 0 ? setCreateOpen(false) : setCreateStep(createStep - 1)}>{createStep === 0 ? "Cancel" : "Back"}</button>{createStep < 3 ? <button className="primary" onClick={() => { if (createStep === 0 && !form.name.trim()) { notify({kind:"error",title:"Tenant name required",message:"Enter the organization name."}); return; } if (createStep === 1 && (!form.adminFirstName || !form.adminLastName || !form.adminEmail)) { notify({kind:"error",title:"Administrator required",message:"Complete administrator name and login email."}); return; } if (createStep === 2 && (!form.contactName || !form.contactEmail || !form.contactPhone || !form.contactAddress)) { notify({kind:"error",title:"Contact required",message:"Complete the tenant business contact."}); return; } setCreateStep(createStep + 1); }}>Continue</button> : <button className="primary" onClick={() => void createTenant()}>Create tenant</button>}</div>
      </Modal>

      <Modal open={!!createdAccount} title="Tenant Administrator Created" onClose={() => setCreatedAccount(null)}>
        {createdAccount && <div className="credential-card">
          <div className="credential-success"><ShieldCheck size={22}/><div><b>Account is ready to sign in</b><span>Share these temporary credentials securely. The password is shown only once.</span></div></div>
          <div className="credential-row"><span>Email</span><b>{createdAccount.email}</b></div>
          <div className="credential-row"><span>Temporary password</span><code>{createdAccount.temporaryPassword}</code></div>
          <div className="credential-note">Password change is required on first login.</div>
        </div>}
        <div className="modal-actions"><button className="primary" onClick={() => setCreatedAccount(null)}>Done</button></div>
      </Modal>

      <Modal open={!!selected} title={selected?.name ?? "Tenant"} onClose={() => setSelected(null)}>
        {selected && <div className="detail-grid">
          <div><span>Name</span><b>{selected.name}</b></div>
          <div><span>Code</span><b>{selected.code}</b></div>
          <div><span>Status</span><b>{selected.isActive === false ? "Disabled" : "Active"}</b></div>
          <div><span>Tenant ID</span><b>{tenantIdOf(selected)}</b></div>
        </div>}
      </Modal>
    </>
  );
}
