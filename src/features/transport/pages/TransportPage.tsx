import { useState } from "react";
import { EditModal } from "../../../components/ui/EditModal";
import { ViewDrawer } from "../../../components/ui/ViewDrawer";
import { RowActions } from "../../../components/ui/RowActions";
import { Pagination } from "../../../components/ui/Pagination";
import { Plus, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import { useVehicles, useRoutes, useCreateVehicle, useCreateRoute } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { Bus, Route, Users, AlertTriangle } from "lucide-react";

function parseMeta(j?: string|null) { try { return JSON.parse(j ?? "{}"); } catch { return {}; } }

export function TransportPage() {
  const { user } = useAuth();
  const [localVehicles, setLocalVehicles] = useState<any[]>([]);
  const [viewVehicle, setViewVehicle] = useState<any|null>(null);
  const [editVehicle, setEditVehicle] = useState<any|null>(null);
  const tid = effectiveTenantId(user) ?? "";
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [tab, setTab]  = useState<"vehicles"|"routes">("vehicles");
  const [driverModal, setDriverModal] = useState<string|null>(null); // driverId for doc upload
  const [addVehicle, setAddVehicle] = useState(false);
  const [form, setForm] = useState({ regNo:"", make:"", model:"", capacity:"45", type:"BUS" });
  const [error, setError] = useState("");

  const { data: vehiclesData, isLoading: vLoading } = useVehicles();
  const { data: routesData, isLoading: rLoading }   = useRoutes();
  const createVehicle = useCreateVehicle();
  const createRoute   = useCreateRoute();

  const vehicles = (vehiclesData as any)?.items ?? (vehiclesData as any) ?? [];
  const routes   = (routesData as any)?.items   ?? (routesData as any) ?? [];

  function sf(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  async function saveVehicle() {
    if (!form.regNo) { setError("Registration number required"); return; }
    await createVehicle.mutateAsync({
      tenantId: tid, name: `${form.make} ${form.model} (${form.regNo})`,
      metadataJson: JSON.stringify({ regNo:form.regNo, make:form.make, model:form.model, capacity:Number(form.capacity), type:form.type, status:"ACTIVE" }),
    });
    setAddVehicle(false); setForm({ regNo:"", make:"", model:"", capacity:"45", type:"BUS" }); setError("");
  }

  const active = vehicles.filter((v: any) => parseMeta(v.metadataJson).status === "ACTIVE").length;
  const maintenance = vehicles.filter((v: any) => parseMeta(v.metadataJson).status === "MAINTENANCE").length;

  return (
    <>
      <PageHeader title="Transport" subtitle="Fleet, routes and driver document compliance"
        action={<div className="page-actions">
          {tab === "vehicles" && <button className="primary" onClick={() => setAddVehicle(true)}><Plus size={14}/> Add vehicle</button>}
        </div>}
      />
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Total vehicles" value={String(vehicles.length)} note="" color="#2563EB" bg="#EFF6FF"><Bus size={20}/></StatCard>
        <StatCard label="Active"         value={String(active)}          note="" color="#10B981" bg="#ECFDF5"><Bus size={20}/></StatCard>
        <StatCard label="In maintenance" value={String(maintenance)}     note="" color="#D97706" bg="#FFFBEB"><AlertTriangle size={20}/></StatCard>
        <StatCard label="Routes"         value={String(routes.length)}   note="" color="#8B5CF6" bg="#F5F3FF"><Route size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:14 }}>
        <button className={tab==="vehicles"?"active":""} onClick={()=>setTab("vehicles")}>🚌 Fleet ({vehicles.length})</button>
        <button className={tab==="routes"?"active":""} onClick={()=>setTab("routes")}>🗺 Routes ({routes.length})</button>
      </div>

      {tab === "vehicles" && (
        <div className="surface">
          <div className="surface-head"><h3>Fleet management</h3><p>Drivers must have valid licence + police clearance + medical certificate on file</p></div>
          {vLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Vehicle</th><th>Reg #</th><th>Make / Model</th><th>Capacity</th><th>Driver</th><th>Route</th><th>Status</th><th>Driver docs</th><th style={{ textAlign:"right" }}>Actions</th>
                  </tr></thead>
                <tbody>
                  {vehicles.map((v: any) => {
                    const meta = parseMeta(v.metadataJson);
                    const isActive = meta.status === "ACTIVE";
                    return (
                      <tr key={v.id}>
                        <td><b style={{fontSize:12}}>{v.name}</b></td>
                        <td><code style={{fontSize:11}}>{meta.regNo ?? "—"}</code></td>
                        <td style={{fontSize:11}}>{meta.make} {meta.model}</td>
                        <td>{meta.capacity ?? "—"}</td>
                        <td style={{fontSize:11}}>{meta.driver || "—"}</td>
                        <td style={{fontSize:11}}>{meta.route || "—"}</td>
                        <td><span className={`status-pill ${isActive?"success":"warning"}`}>{meta.status ?? "ACTIVE"}</span></td>
                        <td>
                          {meta.driver && (
                            <button className="table-action" style={{fontSize:10}} onClick={() => setDriverModal(v.id)}>
                              📋 View docs
                            </button>
                          )}
                        </td>
                            <td style={{ textAlign: "right" }}>
                              <RowActions
                                onView={() => setViewVehicle(v)}
                                onEdit={() => setEditVehicle(v)}
                                onDelete={() => { setLocalVehicles((p:any)=>p.filter((x:any)=>x.id!==v.id)) }}
                                deleteLabel="vehicle"
                              />
                            </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "routes" && (
        <div className="surface">
          <div className="surface-head"><h3>Routes</h3></div>
          {rLoading ? <div style={{padding:40,textAlign:"center",color:"var(--muted)"}}>Loading…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Route</th><th>Code</th><th>From</th><th>To</th><th>Stops</th><th>Students</th><th>Status</th></tr></thead>
                <tbody>
                  {routes.map((r: any) => {
                    const meta = parseMeta(r.metadataJson);
                    return (
                      <tr key={r.id}>
                        <td><b>{r.name}</b></td>
                        <td><code style={{fontSize:11}}>{r.code}</code></td>
                        <td>{meta.from ?? "—"}</td>
                        <td>{meta.to ?? "—"}</td>
                        <td>{meta.stops ?? "—"}</td>
                        <td>{meta.students ?? "—"}</td>
                        <td><span className={`status-pill ${meta.isActive?"success":"gray"}`}>{meta.isActive?"Active":"Inactive"}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Driver document compliance modal */}
      {driverModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setDriverModal(null)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Driver documents</h2><button className="icon-button" onClick={()=>setDriverModal(null)}><X size={18}/></button></div>
            <div style={{padding:"16px 20px"}}>
              <DocumentUploader
                actorType="DRIVER"
                entityId={driverModal}
                tenantId={tid}
                title="Required driver documents"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add vehicle modal */}
      {addVehicle && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setAddVehicle(false)}}>
          <div className="modal-card" style={{width:"min(460px,96vw)"}}>
            <div className="modal-head"><h2>Add vehicle</h2><button className="icon-button" onClick={()=>setAddVehicle(false)}><X size={18}/></button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Registration number *</span><input value={form.regNo} onChange={sf("regNo")} placeholder="e.g. LSQ-441"/></label>
              <label className="human-field"><span>Make</span><input value={form.make} onChange={sf("make")} placeholder="e.g. Hino"/></label>
              <label className="human-field"><span>Model / Year</span><input value={form.model} onChange={sf("model")} placeholder="e.g. 2023"/></label>
              <label className="human-field"><span>Capacity</span><input type="number" value={form.capacity} onChange={sf("capacity")}/></label>
              <label className="human-field"><span>Type</span>
                <select value={form.type} onChange={sf("type")}>
                  <option>BUS</option><option>VAN</option><option>MINI_BUS</option>
                </select>
              </label>
            </div>
            {error && <div style={{color:"var(--danger)",fontSize:12}}>{error}</div>}
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setAddVehicle(false)}>Cancel</button>
              <button className="primary" onClick={saveVehicle} disabled={createVehicle.isPending}>{createVehicle.isPending?"Adding…":"Add vehicle"}</button>
            </div>
          </div>
        </div>
      )}

      {viewVehicle && (
        <ViewDrawer
          title="Vehicle"
          item={viewVehicle}
          onClose={() => setViewVehicle(null)}
          fields={[
            { key: "name", label: "Registration #", wide: true },
            { key: "vehicleType", label: "Type" },
            { key: "seatingCapacity", label: "Capacity" },
            { key: "status", label: "Status" },
          ]}
        />
      )}
    </>
  );
}
