import { useState, useMemo } from "react";
import { EditModal } from "../../../components/ui/EditModal";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { RowActions } from "../../../components/ui/RowActions";
import { Pagination } from "../../../components/ui/Pagination";
import { Package, Plus, X, Search, ShoppingCart, AlertTriangle } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useItems, useCreateItem, usePurchaseOrders, useCreatePurchaseOrder } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => n !== undefined ? `PKR ${Number(n).toLocaleString()}` : "—";
const CATS = ["Stationery","Furniture","Electronics","Sports Equipment","Lab Equipment","Cleaning","Canteen","Other"];
const UNITS = ["Piece","Box","Pack","Ream","Set","Dozen","Kg","Litre","Metre"];
const PO_STATUS: Record<string,string> = { DRAFT:"gray", PENDING:"info", APPROVED:"warning", RECEIVED:"success", CANCELLED:"danger" };

export function InventoryPage() {
  const [localItems, setLocalItems] = useState<any[]>([]);
  const { user } = useAuth();
  const [viewItem, setViewItem] = useState<any|null>(null);
  const [editItem, setEditItem] = useState<any|null>(null); const tid = effectiveTenantId(user) ?? "";
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab] = useState<"items"|"orders">("items");
  const [search, setSearch] = useState("");
  const [itemModal, setItemModal] = useState(false);
  const [poModal,   setPoModal]   = useState(false);
  const [error, setError] = useState("");

  const { data, isLoading } = useItems();
  const { data: poData }    = usePurchaseOrders();
  const createItem = useCreateItem();
  const createPO   = useCreatePurchaseOrder();

  const items  = (data as any)?.items   ?? (data as any) ?? [];
  const orders = (poData as any)?.items ?? (poData as any) ?? [];

  const [iForm, setIForm] = useState({ name:"", code:"", category:"Stationery", unit:"Piece", quantity:"0", reorderLevel:"5", unitCost:"" });
  const [pForm, setPForm] = useState({ orderNumber:"", supplier:"", expectedDate:"", notes:"", itemId:"", quantity:"", unitCost:"" });
  const iff = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setIForm(p=>({...p,[k]:e.target.value}));
  const pff = (k:string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setPForm(p=>({...p,[k]:e.target.value}));

  const filtered = useMemo(() => items.filter((i:any) => {
    const m = parseMeta(i.metadataJson);
    return `${i.name} ${i.code??""} ${m.category??""}`.toLowerCase().includes(search.toLowerCase());
  }), [items, search]);

  const lowStock   = items.filter((i:any) => { const m=parseMeta(i.metadataJson); return (m.quantity??0) <= (m.reorderLevel??5); }).length;
  const totalValue = items.reduce((a:number,i:any) => { const m=parseMeta(i.metadataJson); return a + (m.quantity??0)*(m.unitCost??0); }, 0);

  async function saveItem() {
    if (!iForm.name) { setError("Name required"); return; }
    try {
      await createItem.mutateAsync({ tenantId:tid, name:iForm.name, code:iForm.code||undefined, metadataJson:JSON.stringify({ category:iForm.category, unit:iForm.unit, quantity:Number(iForm.quantity), reorderLevel:Number(iForm.reorderLevel), unitCost:Number(iForm.unitCost)||0 }) });
      setItemModal(false); setIForm({ name:"", code:"", category:"Stationery", unit:"Piece", quantity:"0", reorderLevel:"5", unitCost:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function savePO() {
    if (!pForm.supplier || !pForm.expectedDate) { setError("Supplier and expected date required"); return; }
    const item = items.find((i:any) => i.id === pForm.itemId);
    const lineTotal = Number(pForm.quantity||0) * Number(pForm.unitCost||0);
    try {
      await createPO.mutateAsync({ tenantId:tid, name:`PO — ${pForm.supplier} — ${new Date().toLocaleDateString()}`, metadataJson:JSON.stringify({ orderNumber:pForm.orderNumber||`PO-${Date.now().toString().slice(-6)}`, supplier:pForm.supplier, expectedDate:pForm.expectedDate, notes:pForm.notes, status:"PENDING", totalAmount:lineTotal, items:[{ itemId:pForm.itemId, itemName:item?.name, quantity:Number(pForm.quantity), unitCost:Number(pForm.unitCost) }] }) });
      setPoModal(false); setPForm({ orderNumber:"", supplier:"", expectedDate:"", notes:"", itemId:"", quantity:"", unitCost:"" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock management, purchase orders and asset tracking"
        action={<div className="page-actions">
          {tab==="items"  && <button className="primary" onClick={()=>{setItemModal(true);setError("");}}><Plus size={14}/> Add item</button>}
          {tab==="orders" && <button className="primary" onClick={()=>{setPoModal(true);setError("");}}><ShoppingCart size={14}/> New PO</button>}
        </div>}
      />
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total items"   value={String(items.length)}   note=""               color="#2563EB" bg="#EFF6FF"><Package size={20}/></StatCard>
        <StatCard label="Low stock"     value={String(lowStock)}        note="need reorder"  color={lowStock>0?"#EF4444":"#10B981"} bg={lowStock>0?"#FFF0F1":"#ECFDF5"}><AlertTriangle size={20}/></StatCard>
        <StatCard label="Stock value"   value={pkr(totalValue)}         note="at cost"       color="#10B981" bg="#ECFDF5"><Package size={20}/></StatCard>
        <StatCard label="Purchase orders" value={String(orders.length)} note=""              color="#8B5CF6" bg="#F5F3FF"><ShoppingCart size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="items"?"active":""} onClick={()=>setTab("items")}>📦 Stock ({items.length})</button>
        <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>🛒 Purchase orders ({orders.length})</button>
      </div>

      {tab==="items" && (
        <div className="surface">
          <div className="surface-head">
            <label className="search-box" style={{maxWidth:280}}><Search size={14}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…"/></label>
          </div>
          {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Item</th><th>Code</th><th>Category</th><th>Unit</th><th>Qty on hand</th><th>Reorder at</th><th>Unit cost</th><th>Status</th><th style={{ textAlign:"right" }}>Actions</th>
                  </tr></thead>
                <tbody>
                  {filtered.length===0 ? <tr><td colSpan={8} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No items in inventory.</td></tr>
                  : filtered.map((it:any) => { const m=parseMeta(it.metadataJson); const low=(m.quantity??0)<=(m.reorderLevel??5); return (
                    <tr key={it.id} style={{background:low?"#FFF0F1":""}}>
                      <td><b style={{fontSize:12}}>{it.name}</b></td>
                      <td><code style={{fontSize:10}}>{it.code??"—"}</code></td>
                      <td style={{fontSize:11}}>{m.category??"—"}</td>
                      <td style={{fontSize:11}}>{m.unit??"—"}</td>
                      <td><b style={{color:low?"#EF4444":"var(--text)"}}>{m.quantity??0}</b></td>
                      <td style={{fontSize:11,color:"var(--muted)"}}>{m.reorderLevel??5}</td>
                      <td style={{fontSize:11}}>{pkr(m.unitCost)}</td>
                      <td>{low?<span className="status-pill danger">Low stock</span>:<span className="status-pill success">OK</span>}</td>
                            <td style={{ textAlign: "right" }}>
                              <RowActions
                                onView={() => setViewItem(it)}
                                onEdit={() => setEditItem(it)}
                                onDelete={() => { setLocalItems((p:any)=>p.filter((x:any)=>x.id!==it.id)) }}
                                deleteLabel="item"
                              />
                            </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize} />
        </div>
      )}

      {tab==="orders" && (
        <div className="surface">
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>PO number</th><th>Supplier</th><th>Expected</th><th>Total (PKR)</th><th>Status</th></tr></thead>
              <tbody>
                {orders.length===0 ? <tr><td colSpan={5} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No purchase orders yet.</td></tr>
                : orders.map((o:any)=>{ const m=parseMeta(o.metadataJson); return (
                  <tr key={o.id}>
                    <td><code style={{fontSize:11}}>{m.orderNumber??o.name}</code></td>
                    <td style={{fontSize:11}}>{m.supplier??"—"}</td>
                    <td style={{fontSize:11}}>{m.expectedDate??"—"}</td>
                    <td><b>{pkr(m.totalAmount)}</b></td>
                    <td><span className={`status-pill ${PO_STATUS[m.status??"PENDING"]??"info"}`}>{m.status??"PENDING"}</span></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {itemModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setItemModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head"><h2>Add inventory item</h2><button className="icon-button" onClick={()=>setItemModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Item name *</span><input value={iForm.name} onChange={iff("name")} placeholder="e.g. A4 Paper Ream"/></label>
              <label className="human-field"><span>Code / SKU</span><input value={iForm.code} onChange={iff("code")} placeholder="STAT-001"/></label>
              <label className="human-field"><span>Category</span><select value={iForm.category} onChange={iff("category")}>{CATS.map(c=><option key={c}>{c}</option>)}</select></label>
              <label className="human-field"><span>Unit</span><select value={iForm.unit} onChange={iff("unit")}>{UNITS.map(u=><option key={u}>{u}</option>)}</select></label>
              <label className="human-field"><span>Opening qty</span><input type="number" value={iForm.quantity} onChange={iff("quantity")}/></label>
              <label className="human-field"><span>Reorder level</span><input type="number" value={iForm.reorderLevel} onChange={iff("reorderLevel")}/></label>
              <label className="human-field"><span>Unit cost (PKR)</span><input type="number" value={iForm.unitCost} onChange={iff("unitCost")} placeholder="0"/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setItemModal(false)}>Cancel</button>
              <button className="primary" onClick={saveItem} disabled={createItem.isPending}>{createItem.isPending?"Saving…":"Add item"}</button>
            </div>
          </div>
        </div>
      )}

      {poModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setPoModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head"><h2>New purchase order</h2><button className="icon-button" onClick={()=>setPoModal(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field"><span>PO number</span><input value={pForm.orderNumber} onChange={pff("orderNumber")} placeholder="Auto-generated"/></label>
              <label className="human-field"><span>Supplier *</span><input value={pForm.supplier} onChange={pff("supplier")} placeholder="Supplier name"/></label>
              <label className="human-field"><span>Expected delivery *</span><input type="date" value={pForm.expectedDate} onChange={pff("expectedDate")}/></label>
              <label className="human-field"><span>Item</span>
                <select value={pForm.itemId} onChange={pff("itemId")}>
                  <option value="">— Select item —</option>
                  {items.map((i:any)=><option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Quantity</span><input type="number" value={pForm.quantity} onChange={pff("quantity")}/></label>
              <label className="human-field"><span>Unit cost (PKR)</span><input type="number" value={pForm.unitCost} onChange={pff("unitCost")}/></label>
              <label className="human-field field-wide"><span>Notes</span><input value={pForm.notes} onChange={pff("notes")}/></label>
            </div>
            {pForm.quantity&&pForm.unitCost&&<div style={{padding:"10px 14px",background:"#ECFDF5",borderRadius:8,fontSize:12,fontWeight:700,color:"#059669"}}>Total: {pkr(Number(pForm.quantity)*Number(pForm.unitCost))}</div>}
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setPoModal(false)}>Cancel</button>
              <button className="primary" onClick={savePO} disabled={createPO.isPending}>{createPO.isPending?"Saving…":"Create PO"}</button>
            </div>
          </div>
        </div>
      )}

      {viewItem && (
        <ViewDrawer
          title="Inventory item"
          item={viewItem}
          onClose={() => setViewItem(null)}
          fields={[
            { key: "name", label: "Item name", wide: true },
            { key: "category", label: "Category" },
            { key: "quantity", label: "Quantity" },
            { key: "unitPrice", label: "Unit price" },
            { key: "supplier", label: "Supplier" },
          ]}
        />
      )}
    </>
  );
}
