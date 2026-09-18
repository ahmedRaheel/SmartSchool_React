import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock3, Plus, Search, Trash2, X } from "lucide-react";
import { api } from "../../../core/api/ApiClient";
import { operationalApi } from "../../../core/api/operationalApi";
import { useAcademicYears, useCampuses } from "../../../core/api/queries";
import { toItems } from "../../../core/utils/dataHelpers";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

interface AssignmentOption {
  id: string;
  classSectionId: string;
  courseOfferingId: string;
  teacherEmployeeId: string;
  branchId: string;
  classSection: string;
  course: string;
  teacher: string;
}

const DAYS = [
  { value: 1, label: "Monday" }, { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" }, { value: 5, label: "Friday" }, { value: 6, label: "Saturday" }, { value: 7, label: "Sunday" },
];
const dayName = (value: number) => DAYS.find(item => item.value === value)?.label ?? `Day ${value}`;

export function TimetableOperationsPanel() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const [campusId, setCampusId] = useState(user?.branchId ?? "");
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [search, setSearch] = useState("");
  const [periodModal, setPeriodModal] = useState(false);
  const [timetableModal, setTimetableModal] = useState(false);
  const [entryModal, setEntryModal] = useState(false);
  const [periodForm, setPeriodForm] = useState({ periodNumber: "1", name: "Period 1", startTime: "08:00", endTime: "08:40", periodType: "SUBJECT" });
  const [timetableForm, setTimetableForm] = useState({ academicYearId: "", name: "", effectiveFrom: "", effectiveTo: "" });
  const [entryForm, setEntryForm] = useState({ dayOfWeek: "1", periodId: "", assignmentId: "", entryType: "SUBJECT" });

  const { data: campusData } = useCampuses();
  const campuses = toItems(campusData);
  const { data: academicYearData } = useAcademicYears(campusId || undefined);
  const academicYears = toItems(academicYearData);

  const dashboard = useQuery({
    queryKey: ["timetable-operations", tenantId, selectedTimetableId],
    queryFn: () => operationalApi.timetable.dashboard(tenantId, selectedTimetableId || undefined),
    enabled: Boolean(tenantId),
  });

  const assignmentOptions = useQuery({
    queryKey: ["timetable-assignment-options", tenantId, campusId],
    queryFn: async () => (await api.get<{ items: AssignmentOption[] }>("/api/learning/assignment-options", { params: { tenantId } })).data.items,
    enabled: Boolean(tenantId && campusId && entryModal),
  });

  const createPeriod = useMutation({
    mutationFn: () => operationalApi.timetable.createPeriod({
      tenantId,
      campusId,
      periodNumber: periodForm.periodNumber ? Number(periodForm.periodNumber) : null,
      name: periodForm.name.trim(),
      startTime: periodForm.startTime,
      endTime: periodForm.endTime,
      periodType: periodForm.periodType,
    }),
    onSuccess: async () => {
      setPeriodModal(false);
      await queryClient.invalidateQueries({ queryKey: ["timetable-operations", tenantId] });
    },
  });

  const createTimetable = useMutation({
    mutationFn: () => operationalApi.timetable.createTimetable({
      tenantId,
      campusId,
      academicYearId: timetableForm.academicYearId,
      termId: null,
      name: timetableForm.name.trim(),
      effectiveFrom: timetableForm.effectiveFrom || null,
      effectiveTo: timetableForm.effectiveTo || null,
    }),
    onSuccess: async (result: any) => {
      setTimetableModal(false);
      if (result?.timetableId) setSelectedTimetableId(result.timetableId);
      await queryClient.invalidateQueries({ queryKey: ["timetable-operations", tenantId] });
    },
  });

  const addEntry = useMutation({
    mutationFn: () => {
      const assignment = assignmentOptions.data?.find(item => item.id === entryForm.assignmentId);
      if (!assignment) throw new Error("Select a teaching allocation.");
      return operationalApi.timetable.addEntry(selectedTimetableId, {
        tenantId,
        timetableId: selectedTimetableId,
        dayOfWeek: Number(entryForm.dayOfWeek),
        periodId: entryForm.periodId,
        classSectionId: assignment.classSectionId,
        courseOfferingId: assignment.courseOfferingId,
        teacherCourseAssignmentId: assignment.id,
        roomId: null,
        entryType: entryForm.entryType,
      });
    },
    onSuccess: async () => {
      setEntryModal(false);
      setEntryForm({ dayOfWeek: "1", periodId: "", assignmentId: "", entryType: "SUBJECT" });
      await queryClient.invalidateQueries({ queryKey: ["timetable-operations", tenantId] });
    },
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId: string) => operationalApi.timetable.deleteEntry(tenantId, entryId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["timetable-operations", tenantId] }),
  });

  const periods = (dashboard.data?.periods ?? []).filter(item => !campusId || item.campusId === campusId);
  const timetables = (dashboard.data?.timetables ?? []).filter(item => !campusId || item.campusId === campusId);
  const entries = (dashboard.data?.entries ?? []).filter(item => !selectedTimetableId || item.timetableId === selectedTimetableId);
  const selectedTimetable = timetables.find(item => item.timetableId === selectedTimetableId);
  const optionsForCampus = (assignmentOptions.data ?? []).filter(item => item.branchId === campusId);
  const term = search.trim().toLowerCase();
  const filteredEntries = entries.filter(item => `${item.classSectionName ?? ""} ${item.courseName ?? ""} ${item.teacherName ?? ""} ${item.periodName}`.toLowerCase().includes(term));

  const entriesByDay = useMemo(() => DAYS.map(day => ({ day, entries: filteredEntries.filter(item => item.dayOfWeek === day.value).sort((a, b) => a.periodName.localeCompare(b.periodName)) })), [filteredEntries]);

  return (
    <div className="page-stack">
      <div className="metric-grid cols-3">
        <div className="metric-card"><span className="metric-icon" style={{ color: "var(--info)", background: "var(--info-bg)" }}><Clock3 size={18} /></span><div><small>Periods</small><strong>{periods.length}</strong><p>configured for campus</p></div></div>
        <div className="metric-card"><span className="metric-icon" style={{ color: "var(--indigo)", background: "var(--indigo-soft)" }}><CalendarDays size={18} /></span><div><small>Timetables</small><strong>{timetables.length}</strong><p>academic schedules</p></div></div>
        <div className="metric-card"><span className="metric-icon" style={{ color: "var(--success)", background: "var(--success-bg)" }}><CalendarDays size={18} /></span><div><small>Scheduled entries</small><strong>{entries.length}</strong><p>{selectedTimetable?.name ?? "select a timetable"}</p></div></div>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left"><h3>Timetable authoring</h3><p>Create reusable periods, a timetable header, then place teaching allocations into the weekly grid.</p></div>
          <div className="surface-head-actions" style={{ flexWrap: "wrap" }}>
            {!user?.branchId && <select className="filter-select" value={campusId} onChange={event => { setCampusId(event.target.value); setSelectedTimetableId(""); }}><option value="">Select campus</option>{campuses.map((campus: any) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select>}
            <select className="filter-select" value={selectedTimetableId} onChange={event => setSelectedTimetableId(event.target.value)}><option value="">All timetables</option>{timetables.map(item => <option key={item.timetableId} value={item.timetableId}>{item.name}</option>)}</select>
            <button className="secondary" disabled={!campusId} onClick={() => setPeriodModal(true)}><Plus size={13} /> Period</button>
            <button className="secondary" disabled={!campusId} onClick={() => setTimetableModal(true)}><Plus size={13} /> Timetable</button>
            <button className="primary" disabled={!selectedTimetableId || periods.length === 0} onClick={() => setEntryModal(true)}><Plus size={13} /> Add entry</button>
          </div>
        </div>

        <div className="data-toolbar"><label className="search-box"><Search size={14} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search class, course, teacher or period…" /></label></div>

        {!campusId ? <div className="empty-state"><CalendarDays size={34} /><b>Select a campus</b><p>Timetable periods and schedules are campus-scoped.</p></div>
          : dashboard.isLoading ? <div className="empty-state"><b>Loading timetable…</b></div>
          : filteredEntries.length === 0 ? <div className="empty-state"><CalendarDays size={34} /><b>No timetable entries yet</b><p>Create periods and a timetable, then add teaching allocations to the weekly schedule.</p></div>
          : <div style={{ padding: 16, display: "grid", gap: 12 }}>
              {entriesByDay.filter(group => group.entries.length > 0).map(group => (
                <div key={group.day.value} style={{ border: "1px solid var(--line)", borderRadius:"var(--r-lg)", overflow: "hidden" }}>
                  <div style={{ padding: "10px 14px", background: "var(--surface-2)", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}><b>{group.day.label}</b><span className="status-pill gray">{group.entries.length} entries</span></div>
                  <div className="table-wrap"><table className="premium-table"><thead><tr><th>Period</th><th>Class</th><th>Course</th><th>Teacher</th><th>Room</th><th>Type</th><th style={{ textAlign: "right" }}>Action</th></tr></thead><tbody>
                    {group.entries.map(item => <tr key={item.entryId}><td><b>{item.periodName}</b></td><td>{item.classSectionName ?? "—"}</td><td>{item.courseName ?? "—"}</td><td>{item.teacherName ?? "—"}</td><td>{item.roomName ?? "—"}</td><td><span className="status-pill info">{item.entryType}</span></td><td style={{ textAlign: "right" }}><button className="table-action danger" disabled={deleteEntry.isPending} onClick={() => deleteEntry.mutate(item.entryId)}><Trash2 size={13} /></button></td></tr>)}
                  </tbody></table></div>
                </div>
              ))}
            </div>}
      </div>

      {periodModal && <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setPeriodModal(false)}><div className="modal-card" style={{ width: "min(580px,96vw)" }}>
        <div className="modal-head"><div><h2>Create timetable period</h2><p>Reusable period definition for this campus.</p></div><button className="icon-button" onClick={() => setPeriodModal(false)}><X size={18} /></button></div>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field"><span>Period number</span><input type="number" min="1" value={periodForm.periodNumber} onChange={event => setPeriodForm(current => ({ ...current, periodNumber: event.target.value }))} /></label>
          <label className="human-field"><span>Name *</span><input value={periodForm.name} onChange={event => setPeriodForm(current => ({ ...current, name: event.target.value }))} /></label>
          <label className="human-field"><span>Start *</span><input type="time" value={periodForm.startTime} onChange={event => setPeriodForm(current => ({ ...current, startTime: event.target.value }))} /></label>
          <label className="human-field"><span>End *</span><input type="time" value={periodForm.endTime} onChange={event => setPeriodForm(current => ({ ...current, endTime: event.target.value }))} /></label>
          <label className="human-field field-wide"><span>Period type</span><select value={periodForm.periodType} onChange={event => setPeriodForm(current => ({ ...current, periodType: event.target.value }))}><option value="SUBJECT">Subject</option><option value="BREAK">Break</option><option value="ASSEMBLY">Assembly</option><option value="ACTIVITY">Activity</option></select></label>
        </div></div>
        <div className="modal-actions"><button className="secondary" onClick={() => setPeriodModal(false)}>Cancel</button><button className="primary" disabled={!periodForm.name.trim() || !periodForm.startTime || !periodForm.endTime || createPeriod.isPending} onClick={() => createPeriod.mutate()}>{createPeriod.isPending ? "Saving…" : "Create period"}</button></div>
      </div></div>}

      {timetableModal && <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setTimetableModal(false)}><div className="modal-card" style={{ width: "min(620px,96vw)" }}>
        <div className="modal-head"><div><h2>Create timetable</h2><p>Define the academic period this timetable applies to.</p></div><button className="icon-button" onClick={() => setTimetableModal(false)}><X size={18} /></button></div>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field field-wide"><span>Name *</span><input value={timetableForm.name} onChange={event => setTimetableForm(current => ({ ...current, name: event.target.value }))} placeholder="e.g. 2026 Term 1 Timetable" /></label>
          <label className="human-field field-wide"><span>Academic year *</span><select value={timetableForm.academicYearId} onChange={event => setTimetableForm(current => ({ ...current, academicYearId: event.target.value }))}><option value="">Select academic year</option>{academicYears.map((year: any) => <option key={year.id} value={year.id}>{year.name}</option>)}</select></label>
          <label className="human-field"><span>Effective from</span><input type="date" value={timetableForm.effectiveFrom} onChange={event => setTimetableForm(current => ({ ...current, effectiveFrom: event.target.value }))} /></label>
          <label className="human-field"><span>Effective to</span><input type="date" min={timetableForm.effectiveFrom || undefined} value={timetableForm.effectiveTo} onChange={event => setTimetableForm(current => ({ ...current, effectiveTo: event.target.value }))} /></label>
        </div></div>
        <div className="modal-actions"><button className="secondary" onClick={() => setTimetableModal(false)}>Cancel</button><button className="primary" disabled={!timetableForm.name.trim() || !timetableForm.academicYearId || createTimetable.isPending} onClick={() => createTimetable.mutate()}>{createTimetable.isPending ? "Saving…" : "Create timetable"}</button></div>
      </div></div>}

      {entryModal && <div className="modal-backdrop" onClick={event => event.target === event.currentTarget && setEntryModal(false)}><div className="modal-card" style={{ width: "min(680px,96vw)" }}>
        <div className="modal-head"><div><h2>Add timetable entry</h2><p>Teacher, class and course come from an approved teaching allocation.</p></div><button className="icon-button" onClick={() => setEntryModal(false)}><X size={18} /></button></div>
        <div className="human-form"><div className="human-form-grid">
          <label className="human-field"><span>Day *</span><select value={entryForm.dayOfWeek} onChange={event => setEntryForm(current => ({ ...current, dayOfWeek: event.target.value }))}>{DAYS.map(day => <option key={day.value} value={day.value}>{day.label}</option>)}</select></label>
          <label className="human-field"><span>Period *</span><select value={entryForm.periodId} onChange={event => setEntryForm(current => ({ ...current, periodId: event.target.value }))}><option value="">Select period</option>{periods.map(period => <option key={period.periodId} value={period.periodId}>{period.periodNumber ? `${period.periodNumber}. ` : ""}{period.name} · {period.startTime}-{period.endTime}</option>)}</select></label>
          <label className="human-field field-wide"><span>Teaching allocation *</span><select value={entryForm.assignmentId} onChange={event => setEntryForm(current => ({ ...current, assignmentId: event.target.value }))}><option value="">Select class · course · teacher</option>{optionsForCampus.map(option => <option key={option.id} value={option.id}>{option.classSection} · {option.course} · {option.teacher}</option>)}</select></label>
          <label className="human-field field-wide"><span>Entry type</span><select value={entryForm.entryType} onChange={event => setEntryForm(current => ({ ...current, entryType: event.target.value }))}><option value="SUBJECT">Subject</option><option value="LAB">Lab</option><option value="ACTIVITY">Activity</option></select></label>
        </div></div>
        <div className="modal-actions"><button className="secondary" onClick={() => setEntryModal(false)}>Cancel</button><button className="primary" disabled={!entryForm.periodId || !entryForm.assignmentId || addEntry.isPending} onClick={() => addEntry.mutate()}>{addEntry.isPending ? "Adding…" : "Add entry"}</button></div>
      </div></div>}
    </div>
  );
}
