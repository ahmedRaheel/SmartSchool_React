import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useDepartments, useCreateDepartment, useDeleteDepartment, useCampuses , useUpdateDepartment, useDepartmentById} from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { RowActions } from "../../../../components/ui/RowActions";
import { ViewDrawer } from "../../../../components/ui/ViewDrawer";
import { EditModal  } from "../../../../components/ui/EditModal";
import { Pagination } from "../../../../components/ui/Pagination";
import { PkEmailInput, PkPhoneInput } from "../../../../components/ui/PakistanFields";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };

export function DepartmentsTab() {
  const { user } = useAuth();
  const updDepartment = useUpdateDepartment();
  const tid = effectiveTenantId(user);
  const { data: departments, isLoading } = useDepartments();
  const { data: campuses }               = useCampuses();
  const create = useCreateDepartment();
  const remove = useDeleteDepartment();

  const items: any[]       = (departments as any)?.items ?? (departments as any) ?? [];
  const campusItems: any[] = (campuses    as any)?.items ?? (campuses    as any) ?? [];

  const [modal,    setModal]    = useState(false);
  const [viewItemId, setViewItemId] = useState<string|null>(null);
  const [editItemId, setEditItemId] = useState<string|null>(null);
  const viewItemOrEdit = viewItemId ?? editItemId;
  const { data: viewItemData } = useDepartmentById(viewItemOrEdit ?? undefined);
  const viewItemItem: any = viewItemData ?? null;

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form,     setForm]     = useState({ name:"", campusId:"", email:"", telephone:"" });
  const [error,    setError]    = useState("");

  const paged = items.slice((page-1)*pageSize, page*pageSize);

  async function save() {
    if (!form.name || !form.campusId) { setError("Campus and name are required"); return; }
    try {
      await create.mutateAsync({
        tenantId: tid, campusId: form.campusId,
        name: form.name, email: form.email||null, telephone: form.telephone||null,
      });
      setModal(false);
      setForm({ name:"", campusId:"", email:"", telephone:"" });
      setError("");
    } catch(e: any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Departments</h3><p>Academic and administrative departments per campus</p></div>
          <button className="primary" onClick={() => { setModal(true); setError(""); }}>
            <Plus size={14}/> Add department
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding:32, textAlign:"center", color:"var(--muted)" }}>Loading…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Code</th>
                  <th>Campus</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>
                    No departments yet. Add one above.
                  </td></tr>
                ) : paged.map((d: any) => {
                  const meta = parseMeta(d.metadataJson);
                  const campus = campusItems.find((c:any) => c.id === (d.campusId ?? meta.campusId));
                  return (
                    <tr key={d.id}>
                      <td><b style={{ fontSize:13 }}>{d.name}</b></td>
                      <td><code style={{ fontSize:11 }}>{d.code ?? "—"}</code></td>
                      <td style={{ fontSize:12, color:"var(--muted)" }}>{campus?.name ?? "—"}</td>
                      <td style={{ fontSize:12 }}>{meta.email ?? d.email ?? "—"}</td>
                      <td style={{ fontSize:12 }}>{meta.telephone ?? d.telephone ?? "—"}</td>
                      <td style={{ textAlign:"right" }}>
                        <RowActions
                          onView={() => setViewItemId(d.id)}
                          onEdit={() => setEditItemId(d.id)}
                          onDelete={() => remove.mutate(d.id)}
                          deleteLabel="department"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={items.length}
          onPage={setPage} onPageSize={ps => { setPageSize(ps); setPage(1); }} label="departments" />
      </div>

      {/* Create modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setModal(false); }}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head">
              <h2>Add department</h2>
              <button className="icon-button" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide">
                <span>Campus *</span>
                <select value={form.campusId} onChange={e => setForm(p=>({...p,campusId:e.target.value}))}>
                  <option value="">— Select campus —</option>
                  {campusItems.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="human-field field-wide">
                <span>Department name *</span>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Mathematics, Science, Administration"/>
              </label>
              <PkEmailInput label="Email" value={form.email}
                onChange={v => setForm(p=>({...p,email:v}))} placeholder="dept@school.edu.pk" />
              <PkPhoneInput label="Phone" value={form.telephone}
                onChange={v => setForm(p=>({...p,telephone:v}))} placeholder="042-12345678" />
            </div>
            {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Save department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View drawer */}
      {viewItemId && viewItemItem && (
        <ViewDrawer title="Department" item={viewItemItem}
          onClose={() => setViewItemId(null)}
          onEdit={() => { setEditItemId(viewItemId!); setViewItemId(null); }}
          fields={[
            { key:"name",      label:"Name",  wide:true },
            { key:"code",      label:"Code" },
            { key:"email",     label:"Email" },
            { key:"telephone", label:"Phone" },
          ]}
        />
      )}

      {/* Edit modal */}
      {editItemId && viewItemItem && (
        <EditModal title="Department" item={viewItemItem}
          onClose={() => setEditItemId(null)}
          onSave={async () => setEditItemId(null)}
          fields={[
            { key:"name",      label:"Name",  required:true, wide:true },
            { key:"email",     label:"Email", type:"pk-email" },
            { key:"telephone", label:"Phone", type:"pk-phone" },
          ]}
        />
      )}
    </>
  );
}
