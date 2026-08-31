import { useState } from "react";
import { Package, Plus, ShoppingCart, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useInventoryItems, useCreateInventoryItem, usePurchaseOrders } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(j?: string|null) { try { return JSON.parse(j??"{}"); } catch { return {}; } }

export function InventoryPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState<"items"|"orders">("items");
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", unit:"", reorderLevel:"10" });

  const { data: itemsData, isLoading } = useInventoryItems();
  const { data: ordersData }           = usePurchaseOrders();
  const createItem = useCreateInventoryItem();

  const items  = (itemsData  as any)?.items ?? (itemsData  as any) ?? [];
  const orders = (ordersData as any)?.items ?? (ordersData as any) ?? [];

  const lowStock = items.filter((i:any)=>{ const m=parseMeta(i.metadataJson); return m.qty <= m.reorderLevel; }).length;

  function sf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setForm(p=>({...p,[k]:e.target.value})); }

  async function save() {
    if (!form.name) { setError("Name required"); return; }
    try {
      await createItem.mutateAsync({ tenantId:tid, name:form.name, metadataJson:JSON.stringify({ qty:0, unit:form.unit, reorderLevel:Number(form.reorderLevel), lastOrderDate:null }) });
      setOpen(false); setForm({ name:"", unit:"", reorderLevel:"10" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Inventory" subtitle="School supplies and purchase orders"
        action={<div className="page-actions"><button className="primary" onClick={()=>{setOpen(true);setError("");}}><Plus size={14}/> Add item</button></div>}/>

      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Total items"  value={String(items.length)}  note=""            color="#2563EB" bg="#EFF6FF"><Package size={20}/></StatCard>
        <StatCard label="Low stock"    value={String(lowStock)}      note="Needs reorder" color={lowStock>0?"#EF4444":"#10B981"} bg={lowStock>0?"#FFF0F1":"#ECFDF5"}><Package size={20}/></StatCard>
        <StatCard label="PO raised"    value={String(orders.length)} note=""            color="#8B5CF6" bg="#F5F3FF"><ShoppingCart size={20}/></StatCard>
        <StatCard label="Total items"  value={String(items.reduce((a:number,i:any)=>a+(parseMeta(i.metadataJson).qty??0),0))} note="Units in stock" color="#D97706" bg="#FFFBEB"><Package size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{marginBottom:14}}>
        <button className={tab==="items"?"active":""} onClick={()=>setTab("items")}>📦 Inventory ({items.length})</button>
        <button className={tab==="orders"?"active":""} onClick={()=>setTab("orders")}>🛒 Purchase orders ({orders.length})</button>
      </div>

      <div className="surface">
        {isLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
          <div className="table-wrap">
            {tab === "items" && (
              <table className="premium-table">
                <thead><tr><th>Item</th><th>Code</th><th>Qty</th><th>Unit</th><th>Reorder at</th><th>Last order</th><th>Stock status</th></tr></thead>
                <tbody>
                  {items.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No inventory items.</td></tr>
                  : items.map((i:any)=>{
                    const meta=parseMeta(i.metadataJson);
                    const low = meta.qty <= meta.reorderLevel;
                    return <tr key={i.id}><td><b>{i.name}</b></td><td><code style={{fontSize:11}}>{i.code}</code></td><td><b>{meta.qty??0}</b></td><td>{meta.unit??"-"}</td><td>{meta.reorderLevel??"-"}</td><td style={{fontSize:11}}>{meta.lastOrderDate??"-"}</td><td><span className={`status-pill ${low?"danger":"success"}`}>{low?"Low stock":"OK"}</span></td></tr>;
                  })}
                </tbody>
              </table>
            )}
            {tab === "orders" && (
              <table className="premium-table">
                <thead><tr><th>Order</th><th>Code</th></tr></thead>
                <tbody>
                  {orders.length===0 ? <tr><td colSpan={2} style={{textAlign:"center",padding:32,color:"var(--muted)"}}>No purchase orders.</td></tr>
                  : orders.map((o:any)=><tr key={o.id}><td><b>{o.name}</b></td><td><code style={{fontSize:11}}>{o.code}</code></td></tr>)}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
          <div className="modal-card" style={{width:"min(420px,96vw)"}}>
            <div className="modal-head"><h2>Add inventory item</h2><button className="icon-button" onClick={()=>setOpen(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Item name *</span><input value={form.name} onChange={sf("name")} placeholder="e.g. A4 Paper (Ream)"/></label>
              <label className="human-field"><span>Unit</span><input value={form.unit} onChange={sf("unit")} placeholder="e.g. Ream, Box, Piece"/></label>
              <label className="human-field"><span>Reorder level</span><input type="number" value={form.reorderLevel} onChange={sf("reorderLevel")}/></label>
            </div>
            {error&&<div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setOpen(false)}>Cancel</button>
              <button className="primary" onClick={save} disabled={createItem.isPending}>{createItem.isPending?"Adding…":"Add item"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
