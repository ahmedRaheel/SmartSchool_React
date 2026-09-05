/**
 * AcademicSystemTab — Manage academic systems (O/A Level, Matric, Cambridge, etc.)
 * Full CRUD: create · view · edit · delete · paginate
 */
import { useState, useMemo } from "react";
import { Plus, X, BookMarked, Search } from "lucide-react";
import { useAcademicSystems, useCreateAcademicSystem } from "../../../../core/api/queries";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { RowActions } from "../../../../components/ui/RowActions";
import { ViewDrawer } from "../../../../components/ui/ViewDrawer";
import { EditModal  } from "../../../../components/ui/EditModal";
import { Pagination } from "../../../../components/ui/Pagination";

const SYSTEM_TYPES = ["MATRIC","INTERMEDIATE","O_LEVEL","A_LEVEL","CAMBRIDGE","IB","MONTESSORI","OTHER"];
const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };

export function AcademicSystemTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const { data, isLoading, refetch } = useAcademicSystems();
  const create = useCreateAcademicSystem();

  const items: any[] = (data as any)?.items ?? (data as any) ?? [];

  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modal, setModal]       = useState(false);
  const [viewItem, setViewItem] = useState<any|null>(null);
  const [editItem, setEditItem] = useState<any|null>(null);
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [form, setForm]         = useState({ name:"", systemType:"MATRIC", description:"", country:"Pakistan", isDefault: false });
  const [error, setError]       = useState("");

  const merged = [...items, ...localItems.filter(li => !items.find((i:any) => i.id === li.id))];
  const filtered = useMemo(() => merged.filter(i =>
    `${i.name} ${parseMeta(i.metadataJson).systemType ?? ""}`.toLowerCase().includes(search.toLowerCase())
  ), [merged, search]);
  const paged = filtered.slice((page-1)*pageSize, page*pageSize);

  const sf = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(p => ({...p, [k]: e.target.value}));

  async function save() {
    if (!form.name) { setError("Name is required"); return; }
    try {
      const res = await create.mutateAsync({
        tenantId: tid, name: form.name,
        metadataJson: JSON.stringify({ systemType: form.systemType, description: form.description, country: form.country, isDefault: form.isDefault }),
      });
      setModal(false); setForm({ name:"", systemType:"MATRIC", description:"", country:"Pakistan", isDefault: false }); setError("");
      refetch();
    } catch(e:any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <div className="surface">
        <div className="data-toolbar">
          <label className="search-box">
            <Search size={14}/>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} placeholder="Search academic systems…"/>
          </label>
          <div className="data-toolbar-actions">
            <button className="primary" onClick={() => {setModal(true);setError("");}}>
              <Plus size={14}/> Add academic system
            </button>
          </div>
        </div>

        {isLoading ? (
          <div style={{padding:32,textAlign:"center",color:"var(--muted)"}}>Loading…</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>System name</th>
                  <th>Type</th>
                  <th>Country</th>
                  <th>Description</th>
                  <th>Default</th>
                  <th style={{textAlign:"right"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={6} style={{textAlign:"center",padding:40,color:"var(--muted)"}}>
                    {search ? `No results for "${search}"` : "No academic systems yet. Add one above."}
                  </td></tr>
                ) : paged.map((item:any) => {
                  const meta = parseMeta(item.metadataJson);
                  return (
                    <tr key={item.id}>
                      <td><b style={{fontSize:13}}>{item.name}</b></td>
                      <td><span className="status-pill info" style={{fontSize:10}}>{meta.systemType ?? "—"}</span></td>
                      <td style={{fontSize:12}}>{meta.country ?? "Pakistan"}</td>
                      <td style={{fontSize:12,color:"var(--muted)",maxWidth:220,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{meta.description ?? "—"}</td>
                      <td style={{textAlign:"center"}}>{meta.isDefault ? <span className="status-pill success" style={{fontSize:9}}>DEFAULT</span> : <span style={{color:"var(--muted-2)",fontSize:11}}>—</span>}</td>
                      <td style={{textAlign:"right"}}>
                        <RowActions
                          onView={() => setViewItem(item)}
                          onEdit={() => setEditItem(item)}
                          onDelete={() => setLocalItems(p => p.filter(x => x.id !== item.id))}
                          deleteLabel="academic system"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={ps=>{setPageSize(ps);setPage(1);}} label="systems"/>
      </div>

      {/* View Drawer */}
      {viewItem && (
        <ViewDrawer title="Academic System" item={viewItem} onClose={() => setViewItem(null)}
          onEdit={() => { setEditItem(viewItem); setViewItem(null); }}
          fields={[
            {key:"name",        label:"System name",  wide:true},
            {key:"systemType",  label:"Type"},
            {key:"country",     label:"Country"},
            {key:"isDefault",   label:"Default"},
            {key:"description", label:"Description",  wide:true},
          ]}
        />
      )}

      {/* Edit Modal */}
      {editItem && (
        <EditModal title="Academic System" item={editItem} onClose={() => setEditItem(null)}
          onSave={async data => {
            setLocalItems(p => p.map(x => x.id===editItem.id ? {...x,...data} : x));
          }}
          fields={[
            {key:"name",        label:"System name",  required:true, wide:true},
            {key:"systemType",  label:"Type", type:"select", options: SYSTEM_TYPES.map(t=>({value:t,label:t}))},
            {key:"country",     label:"Country"},
            {key:"description", label:"Description", type:"textarea", wide:true},
          ]}
        />
      )}

      {/* Create Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head">
              <div><h2 style={{fontSize:17}}>New academic system</h2><p style={{fontSize:11,color:"var(--muted)",marginTop:3}}>Define the examination board or curriculum framework</p></div>
              <button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button>
            </div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>System name *</span>
                <input value={form.name} onChange={sf("name")} placeholder="e.g. Federal Board Matric, Cambridge O-Level"/>
              </label>
              <label className="human-field"><span>Type</span>
                <select value={form.systemType} onChange={sf("systemType")}>
                  {SYSTEM_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Country</span>
                <input value={form.country} onChange={sf("country")} placeholder="Pakistan"/>
              </label>
              <label className="human-field field-wide"><span>Description</span>
                <input value={form.description} onChange={sf("description")} placeholder="Brief description…"/>
              </label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={create.isPending}>{create.isPending?"Saving…":"Create system"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
