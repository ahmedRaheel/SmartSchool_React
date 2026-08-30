import { useState } from "react";
import { Bus, MapPin, Route, Search, User } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useVehicles } from "../../../core/api/queries";
import { transportApi } from "../../../core/api/smartschoolApi";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useQuery } from "@tanstack/react-query";

export function TransportPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [tab, setTab] = useState<"vehicles"|"drivers"|"routes">("vehicles");
  const [q, setQ]     = useState("");

  const { data: vehicles, isLoading: vLoading } = useVehicles();

  const { data: driversData, isLoading: dLoading } = useQuery({
    queryKey: ["drivers", tenantId],
    queryFn: () => transportApi.drivers(tenantId).then(r => r.data),
  });
  const { data: routesData, isLoading: rLoading } = useQuery({
    queryKey: ["routes", tenantId],
    queryFn: () => transportApi.routes(tenantId).then(r => r.data),
  });

  const vItems = (vehicles as any)?.items ?? (vehicles as any)?.value?.items ?? [];
  const dItems = (driversData as any)?.items ?? (driversData as any)?.value?.items ?? [];
  const rItems = (routesData  as any)?.items ?? (routesData  as any)?.value?.items ?? [];

  return (
    <>
      <PageHeader title="Transport Management" subtitle="Vehicles, drivers and route assignments" />

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Vehicles" value={vLoading ? "…" : String(vItems.length)} note="In fleet" color="#2563EB" bg="#EFF6FF"><Bus size={20}/></StatCard>
        <StatCard label="Drivers"  value={dLoading ? "…" : String(dItems.length)} note="Registered" color="#10B981" bg="#ECFDF5"><User size={20}/></StatCard>
        <StatCard label="Routes"   value={rLoading ? "…" : String(rItems.length)} note="Active" color="#D97706" bg="#FFFBEB"><Route size={20}/></StatCard>
        <StatCard label="AI Optimisation" value="Active" note="Route efficiency AI" color="#8B5CF6" bg="#F5F3FF"><MapPin size={20}/></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom:16 }}>
        {(["vehicles","drivers","routes"] as const).map(t => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t === "vehicles" ? "🚌 Vehicles" : t === "drivers" ? "👨‍✈️ Drivers" : "🗺️ Routes"}
          </button>
        ))}
      </div>

      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:280 }}>
            <Search size={14}/>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${tab}…`}/>
          </label>
        </div>

        {tab === "vehicles" && (
          vLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading vehicles…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Registration</th><th>Make / Model</th><th>Capacity</th><th>Type</th><th>Status</th></tr></thead>
                <tbody>
                  {vItems.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No vehicles registered yet.</td></tr>
                    : vItems.filter((v: any) => JSON.stringify(v).toLowerCase().includes(q.toLowerCase())).map((v: any) => (
                        <tr key={v.vehicleId ?? v.id}>
                          <td><code style={{ fontSize:11 }}>{v.registrationNumber ?? v.registration ?? "—"}</code></td>
                          <td><b>{v.make ?? ""} {v.model ?? ""}</b></td>
                          <td>{v.capacity ?? "—"}</td>
                          <td>{v.vehicleType ?? v.type ?? "—"}</td>
                          <td><span className={`status-pill ${v.status === "ACTIVE" ? "success" : "gray"}`}>{v.status ?? "—"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "drivers" && (
          dLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading drivers…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Driver</th><th>Driver No.</th><th>Phone</th><th>License</th><th>Status</th></tr></thead>
                <tbody>
                  {dItems.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No drivers registered yet.</td></tr>
                    : dItems.filter((d: any) => JSON.stringify(d).toLowerCase().includes(q.toLowerCase())).map((d: any) => (
                        <tr key={d.driverId ?? d.id}>
                          <td><div className="person-cell"><span className="row-avatar" style={{ background:"#EEF2FF", color:"#6366F1" }}>{(d.fullName ?? "Dr").slice(0,2).toUpperCase()}</span><b>{d.fullName ?? "—"}</b></div></td>
                          <td><code style={{ fontSize:11 }}>{d.driverNumber ?? "—"}</code></td>
                          <td>{d.phone ?? "—"}</td>
                          <td>{d.drivingLicenseNumber ?? "—"}</td>
                          <td><span className={`status-pill ${d.status === "ACTIVE" ? "success" : "gray"}`}>{d.status ?? "—"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === "routes" && (
          rLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--text-muted)" }}>Loading routes…</div> : (
            <div className="table-wrap">
              <table className="premium-table">
                <thead><tr><th>Route name</th><th>Route No.</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                <tbody>
                  {rItems.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign:"center", padding:30, color:"var(--text-muted)" }}>No routes configured yet.</td></tr>
                    : rItems.filter((r: any) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).map((r: any) => (
                        <tr key={r.routeId ?? r.id}>
                          <td><b>{r.name ?? r.routeName ?? "—"}</b></td>
                          <td><code style={{ fontSize:11 }}>{r.routeNumber ?? "—"}</code></td>
                          <td>{r.startPoint ?? "—"}</td>
                          <td>{r.endPoint ?? "—"}</td>
                          <td><span className={`status-pill ${r.isActive !== false ? "success" : "gray"}`}>{r.isActive !== false ? "Active" : "Inactive"}</span></td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}
