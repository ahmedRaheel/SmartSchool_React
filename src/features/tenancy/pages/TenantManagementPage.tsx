import { useEffect, useMemo, useState } from "react";
import { Building2, Eye, MoreHorizontal, Plus, Search, ShieldCheck, Trash2, UserRoundCog } from "lucide-react";
import { api } from "../../../core/api/ApiClient";
import { PageHeader } from "../../../components/ui/PageHeader";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";

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
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Tenant | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ code: "", name: "" });

  async function load() {
    try {
      const response = await api.get<any>("/api/tenancy/tenant", {
        params: { page: 1, pageSize: 250 },
      });
      setTenants(response.data?.items ?? response.data ?? []);
    } catch (error: any) {
      notify(error?.message ?? "Unable to load tenants.");
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
      await api.post("/api/tenancy/tenant", form);
      setCreateOpen(false);
      setForm({ code: "", name: "" });
      notify("Tenant created successfully.");
      await load();
    } catch (error: any) {
      notify(error?.message ?? "Tenant could not be created.");
    }
  }

  function impersonate(tenant: Tenant) {
    sessionStorage.setItem("selected_tenant_id", tenantIdOf(tenant));
    notify(`Tenant context changed to ${tenant.name}. Select a user to start audited impersonation.`);
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
                    <button className="table-action" onClick={() => impersonate(tenant)}><UserRoundCog size={14}/> Impersonate</button>
                    <button className="table-action danger" title="Delete tenant"><Trash2 size={14}/></button>
                    <button className="table-action" title="More actions"><MoreHorizontal size={14}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={createOpen} title="Add Tenant" onClose={() => setCreateOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <label className="human-field"><span>Tenant Code *</span><input value={form.code} onChange={(e) => setForm(v => ({...v, code: e.target.value}))} placeholder="e.g. BEACON" /></label>
            <label className="human-field"><span>Tenant Name *</span><input value={form.name} onChange={(e) => setForm(v => ({...v, name: e.target.value}))} placeholder="School organization name" /></label>
          </div>
        </div>
        <div className="modal-actions"><button className="secondary" onClick={() => setCreateOpen(false)}>Cancel</button><button className="primary" onClick={() => void createTenant()}>Create Tenant</button></div>
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
