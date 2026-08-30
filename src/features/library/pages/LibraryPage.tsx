import { useState, useMemo } from "react";
import { BookOpen, Plus, Search, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useBooks, useCreateBook } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const CATEGORIES = ["Textbook","Literature","History","Science","Technology","Reference","Fiction","Non-fiction"];

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function LibraryPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", author:"", isbn:"", category:"Textbook", totalCopies:"1" });
  const { data, isLoading } = useBooks();
  const createBook = useCreateBook();

  const items  = (data as any)?.items ?? (data as any) ?? [];
  const total  = (data as any)?.totalCount ?? items.length;

  const filtered = useMemo(() =>
    items.filter((b:any) => {
      const meta = parseMeta(b.metadataJson);
      return `${b.name} ${meta.author} ${meta.isbn} ${meta.category}`.toLowerCase().includes(q.toLowerCase());
    }),
    [items, q]);

  const totalCopies   = items.reduce((a:number,b:any) => a + (parseMeta(b.metadataJson).totalCopies ?? 0), 0);
  const available     = items.reduce((a:number,b:any) => a + (parseMeta(b.metadataJson).availableCopies ?? 0), 0);

  function sf(k:string) { return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name) { setError("Book title required"); return; }
    try {
      await createBook.mutateAsync({ tenantId:tid, name:form.name, metadataJson: JSON.stringify({ author:form.author, isbn:form.isbn, category:form.category, totalCopies:Number(form.totalCopies), availableCopies:Number(form.totalCopies) }) });
      setOpen(false); setForm({ name:"", author:"", isbn:"", category:"Textbook", totalCopies:"1" }); setError("");
    } catch(e:any) { setError(e?.message ?? "Failed"); }
  }

  return (
    <>
      <PageHeader title="Library" subtitle={`${total} books in catalogue`}
        action={<div className="page-actions"><button className="primary" onClick={() => { setOpen(true); setError(""); }}><Plus size={14}/> Add book</button></div>}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total books"    value={String(total)}       note=""             color="#2563EB" bg="#EFF6FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Total copies"   value={String(totalCopies)} note=""             color="#0F2241" bg="#EEF2FF"><BookOpen size={20}/></StatCard>
        <StatCard label="Available"      value={String(available)}   note="Ready to issue" color="#10B981" bg="#ECFDF5"><BookOpen size={20}/></StatCard>
        <StatCard label="Issued"         value={String(totalCopies - available)} note="" color="#D97706" bg="#FFFBEB"><BookOpen size={20}/></StatCard>
      </section>
      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:280 }}><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search books…"/></label>
        </div>
        {isLoading ? <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading catalogue…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Title</th><th>Code</th><th>Author</th><th>Category</th><th>Total</th><th>Available</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No books found.</td></tr>
                : filtered.map((b:any) => {
                  const meta = parseMeta(b.metadataJson);
                  const avail = meta.availableCopies ?? 0;
                  return (
                    <tr key={b.id}>
                      <td><b>{b.name}</b>{meta.isbn && <div style={{ fontSize:10, color:"var(--muted)" }}>ISBN: {meta.isbn}</div>}</td>
                      <td><code style={{ fontSize:11 }}>{b.code}</code></td>
                      <td>{meta.author ?? "—"}</td>
                      <td>{meta.category ?? "—"}</td>
                      <td>{meta.totalCopies ?? 0}</td>
                      <td><span className={`status-pill ${avail>0?"success":"danger"}`}>{avail > 0 ? `${avail} available` : "All issued"}</span></td>
                      <td><div className="row-actions">{avail > 0 && <button className="table-action" style={{ fontSize:10 }}>Issue</button>}<button className="table-action" style={{ fontSize:10 }}>View</button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} books shown</span></div>
      </div>
      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add book</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Title *</span><input value={form.name} onChange={sf("name")}/></label>
              <label className="human-field"><span>Author</span><input value={form.author} onChange={sf("author")}/></label>
              <label className="human-field"><span>ISBN</span><input value={form.isbn} onChange={sf("isbn")}/></label>
              <label className="human-field"><span>Category</span><select value={form.category} onChange={sf("category")}>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
              <label className="human-field"><span>Copies</span><input type="number" min="1" value={form.totalCopies} onChange={sf("totalCopies")}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createBook.isPending}>{createBook.isPending?"Adding…":"Add book"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
