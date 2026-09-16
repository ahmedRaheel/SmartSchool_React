import { useMemo, useState } from "react";
import { Plus, Star, Trophy, Users } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { RowActions } from "../../../components/ui/RowActions";
import { StatCard } from "../../../components/ui/StatCard";
import { toItems } from "../../../core/utils/dataHelpers";
import {
  useActivities,
  useAwards,
  useCreateActivity,
  useCreateAward,
  useCreateStudentActivity,
  useDeleteActivity,
  useDeleteAward,
  useDeleteStudentActivity,
  useStudentActivities,
  useStudents,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const ACTIVITY_TYPES = ["SPORTS", "CULTURAL", "ACADEMIC", "SCIENCE_FAIR", "DEBATE", "ART", "COMMUNITY", "FIELD_TRIP", "CEREMONY", "OTHER"];
const AWARD_TYPES = ["ACADEMIC", "SPORTS", "CULTURAL", "ATTENDANCE", "LEADERSHIP", "COMMUNITY", "SPECIAL"];

function canManage(role?: string) {
  return ["superadmin", "superowner", "tenant", "tenantadmin", "owner", "admin", "adminofficer", "principal", "teacher"]
    .includes((role ?? "").toLowerCase());
}

export function ActivitiesPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const manage = canManage(user?.role);
  const [tab, setTab] = useState<"activities" | "participants" | "awards">("activities");
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [error, setError] = useState("");

  const { data: activityData, isLoading } = useActivities(true);
  const { data: awardData } = useAwards(true);
  const { data: participationData } = useStudentActivities(selectedActivityId || undefined, true);
  const { data: studentData } = useStudents(1, manage);
  const createActivity = useCreateActivity();
  const createParticipation = useCreateStudentActivity();
  const createAward = useCreateAward();
  const deleteActivity = useDeleteActivity();
  const deleteParticipation = useDeleteStudentActivity();
  const deleteAward = useDeleteAward();

  const activities = toItems(activityData);
  const awards = toItems(awardData);
  const participations = toItems(participationData);
  const students = toItems(studentData);

  const [activityForm, setActivityForm] = useState({
    name: "",
    category: "SPORTS",
    activityDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    description: "",
    maxParticipants: "",
    status: "UPCOMING",
  });
  const [participantForm, setParticipantForm] = useState({ activityId: "", studentId: "", roleName: "", joinedAt: new Date().toISOString().slice(0, 10) });
  const [awardForm, setAwardForm] = useState({ studentId: "", awardTypeCode: "ACADEMIC", title: "", description: "", awardDate: new Date().toISOString().slice(0, 10) });

  const upcoming = useMemo(() => activities.filter((item: any) => item.status === "UPCOMING").length, [activities]);
  const completed = useMemo(() => activities.filter((item: any) => item.status === "COMPLETED").length, [activities]);

  async function saveActivity() {
    if (!activityForm.name.trim() || !activityForm.activityDate) {
      setError("Activity name and date are required.");
      return;
    }

    setError("");
    await createActivity.mutateAsync({
      tenantId,
      name: activityForm.name.trim(),
      category: activityForm.category,
      activityDate: activityForm.activityDate,
      startTime: activityForm.startTime || null,
      endTime: activityForm.endTime || null,
      venue: activityForm.venue || null,
      description: activityForm.description || null,
      maxParticipants: activityForm.maxParticipants ? Number(activityForm.maxParticipants) : null,
      status: activityForm.status,
    });
    setActivityForm({ name: "", category: "SPORTS", activityDate: "", startTime: "", endTime: "", venue: "", description: "", maxParticipants: "", status: "UPCOMING" });
    setShowActivityForm(false);
  }

  async function saveParticipant() {
    if (!participantForm.activityId || !participantForm.studentId || !participantForm.joinedAt) {
      setError("Activity, student and joined date are required.");
      return;
    }

    setError("");
    await createParticipation.mutateAsync({ tenantId, ...participantForm, roleName: participantForm.roleName || null });
    setSelectedActivityId(participantForm.activityId);
    setParticipantForm({ activityId: "", studentId: "", roleName: "", joinedAt: new Date().toISOString().slice(0, 10) });
    setShowParticipantForm(false);
  }

  async function saveAward() {
    if (!awardForm.studentId || !awardForm.title.trim() || !awardForm.awardDate) {
      setError("Student, award title and date are required.");
      return;
    }

    setError("");
    await createAward.mutateAsync({ tenantId, ...awardForm, title: awardForm.title.trim(), description: awardForm.description || null, approvedBy: user?.employeeId ?? null });
    setAwardForm({ studentId: "", awardTypeCode: "ACADEMIC", title: "", description: "", awardDate: new Date().toISOString().slice(0, 10) });
    setShowAwardForm(false);
  }

  return (
    <>
      <PageHeader
        title="Activities & Awards"
        subtitle="Events, student participation and recognition"
        action={manage ? (
          <div className="page-actions">
            {tab === "activities" && <button className="primary" onClick={() => setShowActivityForm(true)}><Plus size={14} /> Add activity</button>}
            {tab === "participants" && <button className="primary" onClick={() => setShowParticipantForm(true)}><Users size={14} /> Add participant</button>}
            {tab === "awards" && <button className="primary" onClick={() => setShowAwardForm(true)}><Star size={14} /> Give award</button>}
          </div>
        ) : undefined}
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Activities" value={String(activities.length)} note="" color="#2563EB" bg="#EFF6FF"><Users size={20} /></StatCard>
        <StatCard label="Upcoming" value={String(upcoming)} note="" color="#D97706" bg="#FFFBEB"><Users size={20} /></StatCard>
        <StatCard label="Completed" value={String(completed)} note="" color="#10B981" bg="#ECFDF5"><Users size={20} /></StatCard>
        <StatCard label="Awards" value={String(awards.length)} note="" color="#8B5CF6" bg="#F5F3FF"><Trophy size={20} /></StatCard>
      </section>

      <div className="section-tabs" style={{ marginBottom: 14 }}>
        <button className={tab === "activities" ? "active" : ""} onClick={() => setTab("activities")}>Activities</button>
        <button className={tab === "participants" ? "active" : ""} onClick={() => setTab("participants")}>Participation</button>
        <button className={tab === "awards" ? "active" : ""} onClick={() => setTab("awards")}>Awards</button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 12 }}>{error}</div>}

      {tab === "activities" && (
        <div className="surface">
          {showActivityForm && manage && (
            <div className="form-grid" style={{ padding: 16 }}>
              <label>Name<input value={activityForm.name} onChange={e => setActivityForm(p => ({ ...p, name: e.target.value }))} /></label>
              <label>Category<select value={activityForm.category} onChange={e => setActivityForm(p => ({ ...p, category: e.target.value }))}>{ACTIVITY_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Date<input type="date" value={activityForm.activityDate} onChange={e => setActivityForm(p => ({ ...p, activityDate: e.target.value }))} /></label>
              <label>Start<input type="time" value={activityForm.startTime} onChange={e => setActivityForm(p => ({ ...p, startTime: e.target.value }))} /></label>
              <label>End<input type="time" value={activityForm.endTime} onChange={e => setActivityForm(p => ({ ...p, endTime: e.target.value }))} /></label>
              <label>Venue<input value={activityForm.venue} onChange={e => setActivityForm(p => ({ ...p, venue: e.target.value }))} /></label>
              <label>Capacity<input type="number" min="1" value={activityForm.maxParticipants} onChange={e => setActivityForm(p => ({ ...p, maxParticipants: e.target.value }))} /></label>
              <label>Status<select value={activityForm.status} onChange={e => setActivityForm(p => ({ ...p, status: e.target.value }))}><option>UPCOMING</option><option>ONGOING</option><option>COMPLETED</option><option>CANCELLED</option></select></label>
              <label style={{ gridColumn: "1 / -1" }}>Description<textarea value={activityForm.description} onChange={e => setActivityForm(p => ({ ...p, description: e.target.value }))} /></label>
              <div className="page-actions" style={{ gridColumn: "1 / -1" }}><button className="primary" onClick={saveActivity}>Save</button><button onClick={() => setShowActivityForm(false)}>Cancel</button></div>
            </div>
          )}
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Activity</th><th>Category</th><th>Date / Time</th><th>Venue</th><th>Participants</th><th>Status</th>{manage && <th />}</tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7}>Loading…</td></tr> : activities.length === 0 ? <tr><td colSpan={7}>No activities found.</td></tr> : activities.map((a: any) => (
                  <tr key={a.id}>
                    <td><b>{a.name}</b><div className="muted">{a.code}</div></td>
                    <td>{a.category}</td>
                    <td>{a.activityDate}{a.startTime ? ` · ${a.startTime}${a.endTime ? `–${a.endTime}` : ""}` : ""}</td>
                    <td>{a.venue || "—"}</td>
                    <td>{a.participantCount ?? 0}{a.maxParticipants ? ` / ${a.maxParticipants}` : ""}</td>
                    <td><span className="status-pill info">{a.status}</span></td>
                    {manage && <td><RowActions onDelete={() => deleteActivity.mutate(a.id)} deleteLabel="activity" /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "participants" && (
        <div className="surface">
          <div style={{ padding: 16 }}>
            <label>Filter by activity <select value={selectedActivityId} onChange={e => setSelectedActivityId(e.target.value)}><option value="">All activities</option>{activities.map((a: any) => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label>
          </div>
          {showParticipantForm && manage && (
            <div className="form-grid" style={{ padding: 16 }}>
              <label>Activity<select value={participantForm.activityId} onChange={e => setParticipantForm(p => ({ ...p, activityId: e.target.value }))}><option value="">Select</option>{activities.map((a: any) => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label>
              <label>Student<select value={participantForm.studentId} onChange={e => setParticipantForm(p => ({ ...p, studentId: e.target.value }))}><option value="">Select</option>{students.map((s: any) => <option value={s.id} key={s.id}>{s.studentNumber ?? s.code ?? ""} {s.firstName} {s.lastName}</option>)}</select></label>
              <label>Role<input value={participantForm.roleName} onChange={e => setParticipantForm(p => ({ ...p, roleName: e.target.value }))} placeholder="Captain, member, volunteer…" /></label>
              <label>Joined<input type="date" value={participantForm.joinedAt} onChange={e => setParticipantForm(p => ({ ...p, joinedAt: e.target.value }))} /></label>
              <div className="page-actions"><button className="primary" onClick={saveParticipant}>Add</button><button onClick={() => setShowParticipantForm(false)}>Cancel</button></div>
            </div>
          )}
          <div className="table-wrap"><table className="premium-table"><thead><tr><th>Activity</th><th>Student</th><th>Role</th><th>Joined</th><th>Left</th>{manage && <th />}</tr></thead><tbody>
            {participations.length === 0 ? <tr><td colSpan={6}>No participation records.</td></tr> : participations.map((p: any) => <tr key={p.id}><td>{p.activityName}</td><td>{p.studentNumber} · {p.studentName}</td><td>{p.roleName || "Participant"}</td><td>{p.joinedAt}</td><td>{p.leftAt || "Active"}</td>{manage && <td><RowActions onDelete={() => deleteParticipation.mutate(p.id)} deleteLabel="participation" /></td>}</tr>)}
          </tbody></table></div>
        </div>
      )}

      {tab === "awards" && (
        <div className="surface">
          {showAwardForm && manage && (
            <div className="form-grid" style={{ padding: 16 }}>
              <label>Student<select value={awardForm.studentId} onChange={e => setAwardForm(p => ({ ...p, studentId: e.target.value }))}><option value="">Select</option>{students.map((s: any) => <option value={s.id} key={s.id}>{s.studentNumber ?? s.code ?? ""} {s.firstName} {s.lastName}</option>)}</select></label>
              <label>Type<select value={awardForm.awardTypeCode} onChange={e => setAwardForm(p => ({ ...p, awardTypeCode: e.target.value }))}>{AWARD_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Title<input value={awardForm.title} onChange={e => setAwardForm(p => ({ ...p, title: e.target.value }))} /></label>
              <label>Date<input type="date" value={awardForm.awardDate} onChange={e => setAwardForm(p => ({ ...p, awardDate: e.target.value }))} /></label>
              <label style={{ gridColumn: "1 / -1" }}>Description<textarea value={awardForm.description} onChange={e => setAwardForm(p => ({ ...p, description: e.target.value }))} /></label>
              <div className="page-actions"><button className="primary" onClick={saveAward}>Save award</button><button onClick={() => setShowAwardForm(false)}>Cancel</button></div>
            </div>
          )}
          <div className="table-wrap"><table className="premium-table"><thead><tr><th>Award</th><th>Student</th><th>Type</th><th>Date</th><th>Approved by</th>{manage && <th />}</tr></thead><tbody>
            {awards.length === 0 ? <tr><td colSpan={6}>No awards recorded.</td></tr> : awards.map((w: any) => <tr key={w.id}><td><b>{w.title}</b><div className="muted">{w.description}</div></td><td>{w.studentNumber} · {w.studentName}</td><td>{w.awardTypeCode}</td><td>{w.awardDate}</td><td>{w.approvedByName || "—"}</td>{manage && <td><RowActions onDelete={() => deleteAward.mutate(w.id)} deleteLabel="award" /></td>}</tr>)}
          </tbody></table></div>
        </div>
      )}
    </>
  );
}
