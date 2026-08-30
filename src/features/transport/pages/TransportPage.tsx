import { useState, useMemo } from "react";
import { Bus, Map, Plus, Search, Users, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useVehicles, useRoutes, useCreateVehicle, useCreateRoute } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }
type View = "vehicles"|"routes";

export function TransportPage() {
  const { user } = useAuth(); const tid = effectiveTenantId(user) ?? "";
  const [view, setView] = useState<View>("vehicles");
  const [q, setQ] = useState("");
  const [vehicleModal, setVM] = useState(false);
  const [routeModal, setRM] = useState(false);
  const [error, setError] = useState("");
  const [vForm, setVForm] = useState({ name:"", registrationNumber:"", make:"", model:"", capacity:"45", vehicleType:"BUS" });
  const [rForm, setRForm] = useState({ name:"", startPoint:"", endPoint:"", stops:"5" });

  const { data: vData, isLoading: vLoad } = useVehicles();
  const { data: rData, isLoading: rLoad } = useRoutes();
  const createVehicle = useCreateVehicle();
  const createRoute   = useCreateRoute();

  const vehicles = (vData as any)?.items ?? (vData as any) ?? [];
  const routes   = (rData as any)?.items ?? (rData as any) ?? [];

  const filteredV = useMemo(() => vehicles.filter((v:any) => `${v.name} ${v.code} ${parseMeta(v.metadataJson).registrationNumber}`.toLowerCase().includes(q.toLowerCase())), [vehicles, q]);
  const filteredR = useMemo(() => routes.filter((r:any) => `${r.name} ${r.code}`.toLowerCase().includes(q.toLowerCase())), [routes, q]);

  function vsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setVForm(p=>({...p,[k]:e.target.value})); }
  function rsf(k:string){ return (e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setRForm(p=>({...p,[k]:e.target.value})); }

  async function saveVehicle() {
    if (!vForm.name||!vForm.registrationNumber) { setError("Name and registration required"); return; }
    try {
      await createVehicle.mutateAsync({ tenantId:tid, name:vForm.name, metadataJson:JSON.stringify({ ...vForm, capacity:Number(vForm.capacity), status:"ACTIVE" }) });
      setVM(false); setVForm({ name:"", registrationNumber:"", make:"", model:"", capacity:"45", vehicleType:"BUS" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  async function saveRoute() {
    if (!rForm.name||!rForm.startPoint||!rForm.endPoint) { setError("Name, start point and end point required"); return; }
    try {
      await createRoute.mutateAsync({ tenantId:tid, name:rForm.name, metadataJson:JSON.stringify({ ...rForm, stops:Number(rForm.stops), studentCount:0, isActive:true }) });
      setRM(false); setRForm({ name:"", startPoint:"", endPoint:"", stops:"5" }); setError("");
    } catch(e:any) { setError(e?.message??"Failed"); }
  }

  return (
    <>
      <PageHeader title="Transport" subtitle="School bus fleet and route management"
        action={<div className="page-actions">
          {view==="vehicles" && <button className="primary" onClick={()=>{setVM(true);setError("");}}><Plus size={14}/> Add vehicle</button>}
          {view==="routes"   && <button className="primary" onClick={()=>{setRM(true);setError("");}}><Plus size={14}/> Add route</button>}
        </div>}/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Vehicles" value={String(vehicles.length)} note="" color="#2563EB" bg="#EFF6FF"><Bus size={20}/></StatCard>
        <StatCard label="Routes"   value={String(routes.length)}   note="" color="#0F2241" bg="#EEF2FF"><Map size={20}/></StatCard>
        <StatCard label="Students" value={String(routes.reduce((a:number,r:any)=>a+(parseMeta(r.metadataJson).studentCount??0),0))} note="On transport" color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Active"   value={String(vehicles.filter((v:any)=>parseMeta(v.metadataJson).status==="ACTIVE").length)} note="" color="#8B5CF6" bg="#F5F3FF"><Bus size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={view==="vehicles"?"active":""} onClick={()=>{setView("vehicles");setQ("");}}>🚌 Vehicles ({vehicles.length})</button>
        <button className={view==="routes"?"active":""}   onClick={()=>{setView("routes");setQ("");}}>🗺️ Routes ({routes.length})</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:280 }}><Search size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder={`Search ${view}…`}/></label>
        </div>
        {view === "vehicles" && (vLoad ? <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Vehicle</th><th>Reg #</th><th>Type</th><th>Make/Model</th><th>Capacity</th><th>Status</th></tr></thead>
              <tbody>
                {filteredV.length===0 ? <tr><td colSpan={6} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No vehicles yet.</td></tr>
                : filteredV.map((v:any)=>{
                  const meta=parseMeta(v.metadataJson);
                  return <tr key={v.id}><td><b>{v.name}</b></td><td><code style={{fontSize:11}}>{meta.registrationNumber??v.code}</code></td><td>{meta.vehicleType??"-"}</td><td>{meta.make} {meta.model}</td><td>{meta.capacity??0}</td><td><span className={`status-pill ${meta.status==="ACTIVE"?"success":meta.status==="MAINTENANCE"?"warning":"gray"}`}>{meta.status??"ACTIVE"}</span></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        ))}
        {view === "routes" && (rLoad ? <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Route</th><th>Code</th><th>Start point</th><th>End point</th><th>Stops</th><th>Students</th><th>Status</th></tr></thead>
              <tbody>
                {filteredR.length===0 ? <tr><td colSpan={7} style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>No routes yet.</td></tr>
                : filteredR.map((r:any)=>{
                  const meta=parseMeta(r.metadataJson);
                  return <tr key={r.id}><td><b>{r.name}</b></td><td><code style={{fontSize:11}}>{r.code}</code></td><td>{meta.startPoint??"-"}</td><td>{meta.endPoint??"-"}</td><td>{meta.stops??0}</td><td>{meta.studentCount??0}</td><td><span className={`status-pill ${meta.isActive?"success":"gray"}`}>{meta.isActive?"Active":"Inactive"}</span></td></tr>;
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {vehicleModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setVM(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add vehicle</h2><button className="icon-button" onClick={()=>setVM(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field"><span>Vehicle name *</span><input value={vForm.name} onChange={vsf("name")} placeholder="e.g. Bus 01"/></label>
              <label className="human-field"><span>Registration # *</span><input value={vForm.registrationNumber} onChange={vsf("registrationNumber")} placeholder="e.g. LSQ-441"/></label>
              <label className="human-field"><span>Type</span><select value={vForm.vehicleType} onChange={vsf("vehicleType")}><option value="BUS">Bus</option><option value="VAN">Van</option><option value="MINIBUS">Minibus</option></select></label>
              <label className="human-field"><span>Capacity</span><input type="number" value={vForm.capacity} onChange={vsf("capacity")}/></label>
              <label className="human-field"><span>Make</span><input value={vForm.make} onChange={vsf("make")} placeholder="e.g. Hino"/></label>
              <label className="human-field"><span>Model</span><input value={vForm.model} onChange={vsf("model")} placeholder="e.g. 2022"/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setVM(false)}>Cancel</button>
              <button className="primary" onClick={saveVehicle} disabled={createVehicle.isPending}>{createVehicle.isPending?"Adding…":"Add vehicle"}</button>
            </div>
          </div>
        </div>
      )}

      {routeModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setRM(false)}}>
          <div className="modal-card" style={{ width:"min(480px,96vw)" }}>
            <div className="modal-head"><h2>Add route</h2><button className="icon-button" onClick={()=>setRM(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Route name *</span><input value={rForm.name} onChange={rsf("name")} placeholder="e.g. Route A — North City"/></label>
              <label className="human-field"><span>Start point *</span><input value={rForm.startPoint} onChange={rsf("startPoint")} placeholder="e.g. Gulshan Chowk"/></label>
              <label className="human-field"><span>End point *</span><input value={rForm.endPoint} onChange={rsf("endPoint")} placeholder="e.g. School Gate"/></label>
              <label className="human-field"><span>Stops</span><input type="number" value={rForm.stops} onChange={rsf("stops")}/></label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setRM(false)}>Cancel</button>
              <button className="primary" onClick={saveRoute} disabled={createRoute.isPending}>{createRoute.isPending?"Adding…":"Add route"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
