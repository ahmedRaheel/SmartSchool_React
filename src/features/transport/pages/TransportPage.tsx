import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, X } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { api } from "../../../core/api/ApiClient";
import { getErrorMessage } from "../../../core/api/errorMessage";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { useAuth } from "../../auth/auth";
import { DriverPortalPage } from "./DriverPortalPage";

type Lookup = { id: string; name: string; campusId: string | null };
type Vehicle = Lookup & { registrationNo: string; capacity: number | null };
type Route = Lookup & { vehicleId: string | null; driverId: string | null; startTime: string | null; arrivalTime: string | null; dismissalTime: string | null; studentCount: number };
type Stop = { id: string; routeId: string; name: string; sequence: number; pickupTime: string; dropoffTime: string };
type Assignment = { id: string; studentId: string; studentName: string; routeId: string; stopId: string };
type Notice = { id: string; routeId: string; serviceDate: string; delayMinutes: number; message: string; createdAt: string };
type Operations = { campuses: Lookup[]; drivers: Lookup[]; students: Lookup[]; driverEmployees: Lookup[]; vehicles: Vehicle[]; routes: Route[]; stops: Stop[]; assignments: Assignment[]; notices: Notice[] };
type StopDraft = { id?: string; name: string; pickupTime: string; dropoffTime: string };
const emptyRoute = { id: "", name: "", campusId: "", vehicleId: "", driverId: "", startTime: "07:00", arrivalTime: "08:00", dismissalTime: "14:00" };

export function TransportPage() {
  const permissions = usePermissions();
  if (!permissions.can("transport.fleet.manage") && !permissions.can("transport.routes.manage")) return <DriverPortalPage/>;
  return <TransportOperations/>;
}

function TransportOperations() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const [tab, setTab] = useState("routes");
  const [modal, setModal] = useState<"route" | "vehicle" | "driver" | "assignment" | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [routeForm, setRouteForm] = useState(emptyRoute);
  const [stops, setStops] = useState<StopDraft[]>([]);
  const [vehicleForm, setVehicleForm] = useState({ campusId: "", name: "", registrationNo: "", capacity: "30" });
  const [driverForm, setDriverForm] = useState({ employeeId: "", dateOfBirth: "", licenseNumber: "", licenseCategory: "", licenseExpiry: "" });
  const [assignmentForm, setAssignmentForm] = useState({ studentId: "", routeId: "", stopId: "" });
  const operations = useQuery({ queryKey: ["transport-operations", tenantId], enabled: !!tenantId,
    queryFn: async () => (await api.get<Operations>("/api/transport/operations", { params: { tenantId } })).data });
  const data = operations.data;
  const lookup = (items: Lookup[] | undefined, id: string | null) => items?.find(item => item.id === id)?.name ?? "—";
  function openRoute(route?: Route) {
    setError(""); setModal("route");
    setRouteForm(route ? { id: route.id, name: route.name, campusId: route.campusId ?? "", vehicleId: route.vehicleId ?? "", driverId: route.driverId ?? "", startTime: route.startTime?.slice(0, 5) ?? "07:00", arrivalTime: route.arrivalTime?.slice(0, 5) ?? "08:00", dismissalTime: route.dismissalTime?.slice(0, 5) ?? "14:00" } : emptyRoute);
    setStops(route ? (data?.stops ?? []).filter(item => item.routeId === route.id).sort((a, b) => a.sequence - b.sequence).map(item => ({ id: item.id, name: item.name, pickupTime: item.pickupTime?.slice(0, 5) ?? "07:00", dropoffTime: item.dropoffTime?.slice(0, 5) ?? "14:00" })) : [{ name: "", pickupTime: "07:15", dropoffTime: "14:15" }]);
  }
  async function save() {
    setSaving(true); setError("");
    try {
      if (modal === "route") await api.post("/api/transport/operations/routes", { ...routeForm, id: routeForm.id || null, tenantId, stops });
      if (modal === "vehicle") await api.post("/api/transport/vehicle", { ...vehicleForm, tenantId, capacity: Number(vehicleForm.capacity) });
      if (modal === "driver") await api.post("/api/transport/operations/drivers", { ...driverForm, tenantId });
      if (modal === "assignment") await api.post("/api/transport/operations/assignments", { ...assignmentForm, tenantId });
      setModal(null); await operations.refetch();
    } catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  async function removeAssignment(id: string) {
    setSaving(true); setError("");
    try { await api.delete(`/api/transport/student-transport/${id}`, { params: { tenantId } }); await operations.refetch(); }
    catch (e) { setError(getErrorMessage(e)); } finally { setSaving(false); }
  }
  const choose = (label: string, value: string, change: (value: string) => void, items: Lookup[]) => <label className="human-field"><span>{label}</span><select value={value} onChange={e => change(e.target.value)}><option value="">Select</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
  const selectedRoute = data?.routes.find(item => item.id === assignmentForm.routeId);

  return <>
    <PageHeader title="School transport" subtitle="Manage drivers, vehicles, routes, stops and student transport assignments."
      action={<button className="primary" onClick={() => openRoute()}><Plus size={16}/> Add route</button>}/>
    {(error || operations.error) && <p className="form-error" role="alert">{error || getErrorMessage(operations.error)}</p>}
    <div className="tabs">{["routes", "fleet", "students", "notices"].map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>)}</div>
    {operations.isLoading && <p>Loading transport data…</p>}
    {data && tab === "routes" && <section className="surface"><div className="surface-head"><h3>Routes ({data.routes.length})</h3><p>Stops, vehicles and driver allocations</p></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Route</th><th>Campus</th><th>Driver</th><th>Vehicle</th><th>Students</th><th>Stops</th><th>Action</th></tr></thead><tbody>
      {data.routes.length === 0 && <tr><td colSpan={7}>Add a vehicle and driver profile, then create a route.</td></tr>}{data.routes.map(route => <tr key={route.id}><td><b>{route.name}</b></td><td>{lookup(data.campuses, route.campusId)}</td><td>{lookup(data.drivers, route.driverId)}</td><td>{data.vehicles.find(item => item.id === route.vehicleId)?.registrationNo ?? "—"}</td><td>{route.studentCount}</td><td>{data.stops.filter(item => item.routeId === route.id).length}</td><td><button className="secondary" onClick={() => openRoute(route)}>Edit route</button></td></tr>)}
    </tbody></table></div></section>}
    {data && tab === "fleet" && <>
      <section className="surface"><div className="surface-head"><h3>Vehicles</h3><button className="secondary" onClick={() => { setVehicleForm({ campusId: "", name: "", registrationNo: "", capacity: "30" }); setError(""); setModal("vehicle"); }}>Add vehicle</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Name</th><th>Registration</th><th>Campus</th><th>Seats</th></tr></thead><tbody>{data.vehicles.map(vehicle => <tr key={vehicle.id}><td>{vehicle.name}</td><td>{vehicle.registrationNo}</td><td>{lookup(data.campuses, vehicle.campusId)}</td><td>{vehicle.capacity}</td></tr>)}</tbody></table></div></section>
      <section className="surface" style={{ marginTop: 16 }}><div className="surface-head"><h3>Driver profiles</h3><button className="secondary" onClick={() => { setDriverForm({ employeeId: "", dateOfBirth: "", licenseNumber: "", licenseCategory: "", licenseExpiry: "" }); setError(""); setModal("driver"); }}>Register driver</button></div><p style={{ padding: "0 20px" }}>Create and approve the driver's employee record in HR before registering the licence here.</p><div className="table-wrap"><table className="data-table"><thead><tr><th>Driver</th><th>Campus</th><th>Assigned routes</th></tr></thead><tbody>{data.drivers.map(driver => <tr key={driver.id}><td>{driver.name}</td><td>{lookup(data.campuses, driver.campusId)}</td><td>{data.routes.filter(route => route.driverId === driver.id).map(route => route.name).join(", ") || "None"}</td></tr>)}</tbody></table></div></section>
    </>}
    {data && tab === "students" && <section className="surface"><div className="surface-head"><h3>Student assignments</h3><button className="secondary" onClick={() => { setAssignmentForm({ studentId: "", routeId: "", stopId: "" }); setError(""); setModal("assignment"); }}>Assign student</button></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Route</th><th>Stop</th><th>Action</th></tr></thead><tbody>{data.assignments.map(assignment => <tr key={assignment.id}><td>{assignment.studentName}</td><td>{lookup(data.routes, assignment.routeId)}</td><td>{data.stops.find(item => item.id === assignment.stopId)?.name ?? "—"}</td><td><button className="secondary" onClick={() => { setAssignmentForm({ studentId: assignment.studentId, routeId: assignment.routeId, stopId: assignment.stopId }); setError(""); setModal("assignment"); }}>Move</button> <button className="icon-button" aria-label={`Remove transport for ${assignment.studentName}`} disabled={saving} onClick={() => void removeAssignment(assignment.id)}><Trash2 size={15}/></button></td></tr>)}</tbody></table></div></section>}
    {data && tab === "notices" && <section className="surface" style={{ padding: 20 }}><h3>Service notices · last seven days</h3>{!data.notices.length && <p>No service notices.</p>}{data.notices.map(item => <div key={item.id} style={{ borderTop: "1px solid var(--line)", padding: "14px 0" }}><b>{lookup(data.routes, item.routeId)} · {item.delayMinutes} min delay</b><p>{item.message}</p><small>{item.serviceDate} · recorded {new Date(item.createdAt).toLocaleString()}</small></div>)}</section>}
    {modal && data && <div className="modal-backdrop"><section className="modal-card" style={{ width: "min(820px,96vw)" }} role="dialog" aria-modal="true" aria-label={`Transport ${modal}`}><div className="modal-head"><h2>{modal === "assignment" ? "Assign student" : modal === "route" ? "Route and stops" : modal === "driver" ? "Register driver" : "Add vehicle"}</h2><button className="icon-button" onClick={() => setModal(null)}><X size={18}/></button></div><div className="human-form">
      {modal === "route" && <><div className="human-form-grid">
        <label className="human-field field-wide"><span>Route name *</span><input value={routeForm.name} onChange={e => setRouteForm({ ...routeForm, name: e.target.value })}/></label>
        {choose("Campus *", routeForm.campusId, value => setRouteForm({ ...routeForm, campusId: value, vehicleId: "", driverId: "" }), data.campuses)}
        {choose("Vehicle *", routeForm.vehicleId, value => setRouteForm({ ...routeForm, vehicleId: value }), data.vehicles.filter(item => item.campusId === routeForm.campusId).map(item => ({ ...item, name: `${item.registrationNo} · ${item.capacity} seats` })))}
        {choose("Driver *", routeForm.driverId, value => setRouteForm({ ...routeForm, driverId: value }), data.drivers.filter(item => item.campusId === routeForm.campusId))}
        {([['startTime', 'Pickup start'], ['arrivalTime', 'School arrival'], ['dismissalTime', 'School dismissal']] as const).map(([field, label]) => <label className="human-field" key={field}><span>{label}</span><input type="time" value={routeForm[field]} onChange={e => setRouteForm({ ...routeForm, [field]: e.target.value })}/></label>)}
      </div><h3>Stops in pickup order</h3>{stops.map((stop, index) => <div className="human-form-grid" key={stop.id ?? index} style={{ marginBottom: 12 }}><label className="human-field"><span>{index + 1}. Stop name</span><input value={stop.name} onChange={e => setStops(stops.map((item, i) => i === index ? { ...item, name: e.target.value } : item))}/></label>{([['pickupTime', 'Pickup time'], ['dropoffTime', 'Return time']] as const).map(([field, label]) => <label className="human-field" key={field}><span>{label}</span><input type="time" value={stop[field]} onChange={e => setStops(stops.map((item, i) => i === index ? { ...item, [field]: e.target.value } : item))}/></label>)}<button className="secondary" onClick={() => setStops(stops.filter((_, i) => i !== index))}>Remove stop</button></div>)}<button className="secondary" onClick={() => setStops([...stops, { name: "", pickupTime: routeForm.startTime, dropoffTime: routeForm.dismissalTime }])}>Add stop</button></>}
      {modal === "vehicle" && <div className="human-form-grid">{choose("Campus *", vehicleForm.campusId, value => setVehicleForm({ ...vehicleForm, campusId: value }), data.campuses)}{([['name', 'Vehicle name'], ['registrationNo', 'Registration number'], ['capacity', 'Passenger seats']] as const).map(([field, label]) => <label className="human-field" key={field}><span>{label} *</span><input type={field === "capacity" ? "number" : "text"} min={1} max={100} value={vehicleForm[field]} onChange={e => setVehicleForm({ ...vehicleForm, [field]: e.target.value })}/></label>)}</div>}
      {modal === "driver" && <div className="human-form-grid">{choose("Approved driver employee *", driverForm.employeeId, value => setDriverForm({ ...driverForm, employeeId: value }), data.driverEmployees)}{([['dateOfBirth', 'Date of birth', 'date'], ['licenseNumber', 'Licence number', 'text'], ['licenseCategory', 'Licence category', 'text'], ['licenseExpiry', 'Licence expiry', 'date']] as const).map(([field, label, type]) => <label className="human-field" key={field}><span>{label} *</span><input type={type} value={driverForm[field]} onChange={e => setDriverForm({ ...driverForm, [field]: e.target.value })}/></label>)}</div>}
      {modal === "assignment" && <div className="human-form-grid">{choose("Route *", assignmentForm.routeId, value => setAssignmentForm({ studentId: "", routeId: value, stopId: "" }), data.routes)}{choose("Student *", assignmentForm.studentId, value => setAssignmentForm({ ...assignmentForm, studentId: value }), data.students.filter(item => item.campusId === selectedRoute?.campusId))}{choose("Stop *", assignmentForm.stopId, value => setAssignmentForm({ ...assignmentForm, stopId: value }), data.stops.filter(item => item.routeId === assignmentForm.routeId).map(item => ({ ...item, campusId: null })))}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div><div className="modal-actions"><button className="secondary" onClick={() => setModal(null)}>Cancel</button><button className="primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save"}</button></div></section></div>}
  </>;
}
