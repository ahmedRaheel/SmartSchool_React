import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bus, Clock, RefreshCw, Send, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";

type Route = { id: string; name: string; driverName: string; vehicle: string; capacity: number | null; startTime: string | null; arrivalTime: string | null; dismissalTime: string | null };
type Student = { studentId: string; routeId: string; stopId: string; name: string; number: string; stop: string; sequence: number; pickupTime: string | null; dropoffTime: string | null; status: string };
type Notice = { id: string; routeId: string; delayMinutes: number; message: string; createdAt: string };
type Workspace = { routes: Route[]; students: Student[]; notices: Notice[] };
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function DriverPortalPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const [routeId, setRouteId] = useState("");
  const [serviceDate, setServiceDate] = useState(today);
  const [direction, setDirection] = useState("PICKUP");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("10");
  const [notice, setNotice] = useState("");
  const workspace = useQuery({ queryKey: ["driver-workspace", tenantId, serviceDate, direction], enabled: !!tenantId,
    refetchInterval: 30000, queryFn: async () => (await api.get<Workspace>("/api/transport/driver/workspace", { params: { tenantId, serviceDate, direction } })).data });
  useEffect(() => { const routes = workspace.data?.routes ?? []; setRouteId(current => routes.some(item => item.id === current) ? current : routes[0]?.id ?? ""); }, [workspace.data?.routes]);
  const route = workspace.data?.routes.find(item => item.id === routeId);
  const students = (workspace.data?.students ?? []).filter(item => item.routeId === routeId);
  const stops = Array.from(new Map(students.map(item => [item.stopId, item])).values()).sort((a, b) => a.sequence - b.sequence);
  const boarded = students.filter(item => item.status === "BOARDED").length;
  const completed = students.filter(item => item.status === "DROPPED_OFF").length;

  async function record(student: Student, status: string) {
    setPending(student.studentId); setError("");
    try { await api.put("/api/transport/driver/trip-status", { tenantId, routeId, studentId: student.studentId, serviceDate, direction, status }); await workspace.refetch(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setPending(""); }
  }
  async function saveNotice() {
    setPending("notice"); setError(""); setNotice("");
    try { await api.post("/api/transport/driver/notices", { tenantId, routeId, serviceDate, delayMinutes: Number(delayMinutes), message }); setMessage(""); setNotice("Notice saved to the route log and transport team view."); await workspace.refetch(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setPending(""); }
  }

  return <>
    <PageHeader title="Driver workspace" subtitle="Your assigned routes, daily passenger roster and service notices."
      action={<button className="secondary" disabled={workspace.isFetching} onClick={() => void workspace.refetch()}><RefreshCw size={15}/> Refresh</button>}/>
    {(error || workspace.error) && <p className="form-error" role="alert">{error || getErrorMessage(workspace.error)}</p>}
    {workspace.isLoading && <p>Loading your route assignments…</p>}
    {!workspace.isLoading && !workspace.error && !route && <section className="surface" style={{ padding: 24 }}><h3>No assigned routes</h3><p>Your transport administrator must assign your driver profile and vehicle to a route.</p></section>}
    {route && <>
      <section className="surface" style={{ padding: 20, marginBottom: 20 }}><div className="human-form-grid">
        <label className="human-field"><span>Route</span><select value={routeId} onChange={e => setRouteId(e.target.value)}>{workspace.data?.routes.map(item => <option key={item.id} value={item.id}>{item.name} · {item.vehicle}</option>)}</select></label>
        <label className="human-field"><span>Service date</span><input type="date" value={serviceDate} onChange={e => setServiceDate(e.target.value)}/></label>
        <label className="human-field"><span>Journey</span><select value={direction} onChange={e => setDirection(e.target.value)}><option value="PICKUP">Morning pickup</option><option value="DROPOFF">Afternoon return</option></select></label>
      </div><p>{route.driverName} · {route.vehicle} · {route.capacity ?? "—"} seats</p></section>
      <div className="stats-grid">
        <StatCard label="Passengers" value={String(students.length)} note={`${stops.length} assigned stops`} color="#2563eb" bg="#eff6ff"><Users size={20}/></StatCard>
        <StatCard label="On board" value={String(boarded)} note={`${completed} dropped off`} color="#059669" bg="#ecfdf5"><Bus size={20}/></StatCard>
        <StatCard label={direction === "PICKUP" ? "School arrival" : "School dismissal"} value={(direction === "PICKUP" ? route.arrivalTime : route.dismissalTime)?.slice(0, 5) ?? "—"} note={`Route start ${route.startTime?.slice(0, 5) ?? "—"}`} color="#d97706" bg="#fffbeb"><Clock size={20}/></StatCard>
      </div>
      {students.length === 0 && <section className="surface" style={{ padding: 20 }}>No students have been assigned to this route.</section>}
      {stops.map(stop => <section className="surface" key={stop.stopId} style={{ marginBottom: 16 }}><div className="surface-head"><h3>{stop.sequence}. {stop.stop}</h3><p>{(direction === "PICKUP" ? stop.pickupTime : stop.dropoffTime)?.slice(0, 5) ?? "Time not set"}</p></div>
        <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Number</th><th>Status</th><th>Record</th></tr></thead><tbody>{students.filter(item => item.stopId === stop.stopId).map(student => <tr key={student.studentId}>
          <td><b>{student.name}</b></td><td>{student.number || "—"}</td><td><span className={`status-pill ${student.status === "DROPPED_OFF" ? "success" : student.status === "ABSENT" ? "warning" : "info"}`}>{student.status.replaceAll("_", " ")}</span></td>
          <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{student.status === "WAITING" && <><button className="primary" disabled={!!pending} onClick={() => void record(student, "BOARDED")}>Boarded</button><button className="secondary" disabled={!!pending} onClick={() => void record(student, "ABSENT")}>Absent</button></>}
            {student.status === "BOARDED" && <button className="primary" disabled={!!pending} onClick={() => void record(student, "DROPPED_OFF")}>Dropped off</button>}
            {student.status !== "WAITING" && <button className="secondary" disabled={!!pending} onClick={() => void record(student, "WAITING")}>Reset</button>}</td>
        </tr>)}</tbody></table></div>
      </section>)}
      <section className="surface" style={{ padding: 20 }}><h3>Route notice</h3><p>Record a delay or service update for the transport team.</p><div className="human-form-grid">
        <label className="human-field"><span>Delay in minutes</span><input type="number" min={0} max={360} value={delayMinutes} onChange={e => setDelayMinutes(e.target.value)}/></label>
        <label className="human-field field-wide"><span>Message</span><textarea maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe the delay or service change."/></label>
      </div><button className="primary" disabled={!!pending || !message.trim()} onClick={() => void saveNotice()}><Send size={14}/> Save notice</button>{notice && <p role="status">{notice}</p>}
        {(workspace.data?.notices ?? []).filter(item => item.routeId === routeId).map(item => <div key={item.id} style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12 }}><b>{item.delayMinutes} min delay</b><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></div>)}
      </section>
    </>}
  </>;
}
