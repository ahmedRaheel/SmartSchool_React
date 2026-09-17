import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarCheck, Check, Clock, History, Save, Search, X as XIcon } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useClassSections } from "../../../core/api/queries";
import { operationalApi, type AttendanceStatus } from "../../../core/api/operationalApi";
import { toItems } from "../../../core/utils/dataHelpers";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const STATUS_CYCLE: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "LEAVE"];
const STATUS_META: Record<AttendanceStatus, { label: string; className: string; short: string }> = {
  PRESENT: { label: "Present", className: "success", short: "P" },
  ABSENT: { label: "Absent", className: "danger", short: "A" },
  LATE: { label: "Late", className: "warning", short: "L" },
  EXCUSED: { label: "Excused", className: "purple", short: "E" },
  LEAVE: { label: "Leave", className: "info", short: "LV" },
};

function localDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-PK", { dateStyle: "medium" });
}

export function AttendancePage() {
  const { user } = useAuth();
  const permissions = usePermissions();
  const tenantId = effectiveTenantId(user) ?? "";
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const canManage = permissions.can("attendance.mark") || permissions.can("attendance.view.class") || permissions.can("attendance.view.all");
  const canMark = permissions.can("attendance.mark");
  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [classSectionId, setClassSectionId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(today);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});

  const { data: sectionData } = useClassSections();
  const sections = toItems(sectionData);

  const roster = useQuery({
    queryKey: ["attendance-roster", tenantId, classSectionId, attendanceDate],
    queryFn: () => operationalApi.attendance.roster(tenantId, classSectionId, attendanceDate),
    enabled: canManage && Boolean(tenantId && classSectionId && attendanceDate),
  });

  useEffect(() => {
    if (!roster.data) return;
    const next: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    for (const student of roster.data.students) {
      next[student.studentId] = {
        status: student.status ?? "PRESENT",
        remarks: student.remarks ?? "",
      };
    }
    setRows(next);
  }, [roster.data]);

  const history = useQuery({
    queryKey: ["attendance-history", tenantId, classSectionId],
    queryFn: () => operationalApi.attendance.history(tenantId, {
      classSectionId: classSectionId || undefined,
      fromDate: undefined,
      toDate: undefined,
    }),
    enabled: canManage && tab === "history" && Boolean(tenantId),
  });

  const saveAttendance = useMutation({
    mutationFn: () => operationalApi.attendance.mark({
      tenantId,
      classSectionId,
      attendanceDate,
      students: (roster.data?.students ?? []).map(student => ({
        studentId: student.studentId,
        status: rows[student.studentId]?.status ?? "PRESENT",
        remarks: rows[student.studentId]?.remarks.trim() || null,
      })),
    }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance-roster", tenantId, classSectionId, attendanceDate] }),
        queryClient.invalidateQueries({ queryKey: ["attendance-history", tenantId] }),
      ]);
    },
  });

  const visibleStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    const source = roster.data?.students ?? [];
    if (!term) return source;
    return source.filter(student => `${student.studentNumber} ${student.studentName}`.toLowerCase().includes(term));
  }, [roster.data, search]);

  const counts = useMemo(() => {
    const values = roster.data?.students.map(student => rows[student.studentId]?.status ?? "PRESENT") ?? [];
    return {
      total: values.length,
      present: values.filter(status => status === "PRESENT").length,
      absent: values.filter(status => status === "ABSENT").length,
      late: values.filter(status => status === "LATE").length,
    };
  }, [roster.data, rows]);
  const rate = counts.total ? Math.round((counts.present / counts.total) * 100) : 0;

  const sectionName = sections.find((item: any) => item.id === classSectionId)?.name;

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRows(current => ({
      ...current,
      [studentId]: { status, remarks: current[studentId]?.remarks ?? "" },
    }));
  }

  function cycleStatus(studentId: string) {
    const current = rows[studentId]?.status ?? "PRESENT";
    const index = STATUS_CYCLE.indexOf(current);
    setStatus(studentId, STATUS_CYCLE[(index + 1) % STATUS_CYCLE.length]);
  }

  function markAll(status: AttendanceStatus) {
    setRows(current => {
      const next = { ...current };
      for (const student of roster.data?.students ?? []) {
        next[student.studentId] = { status, remarks: current[student.studentId]?.remarks ?? "" };
      }
      return next;
    });
  }

  if (!canManage) {
    return (
      <>
        <PageHeader title="Attendance" subtitle="Attendance records are available from your portal dashboard." />
        <div className="surface">
          <div className="empty-state">
            <CalendarCheck size={34} />
            <b>Class attendance is managed by academic staff</b>
            <p>Your role does not have permission to open the class attendance register.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        subtitle={`${sectionName ?? "Select a class section"} · ${localDate(attendanceDate)}`}
        action={canMark && tab === "mark" ? (
          <button
            className="primary"
            disabled={!classSectionId || !roster.data?.students.length || saveAttendance.isPending}
            onClick={() => saveAttendance.mutate()}
          >
            <Save size={14} /> {saveAttendance.isPending ? "Saving…" : "Save attendance"}
          </button>
        ) : undefined}
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Students" value={String(counts.total)} note="active roster" color="#2563EB" bg="#EFF6FF"><CalendarCheck size={20} /></StatCard>
        <StatCard label="Present" value={String(counts.present)} note={counts.total ? `${rate}% attendance` : "—"} color="#059669" bg="#ECFDF5"><Check size={20} /></StatCard>
        <StatCard label="Absent" value={String(counts.absent)} note="today" color="#DC2626" bg="#FEF2F2"><XIcon size={20} /></StatCard>
        <StatCard label="Late" value={String(counts.late)} note="today" color="#D97706" bg="#FFFBEB"><Clock size={20} /></StatCard>
      </section>

      <div className="section-tabs">
        {canMark && <button className={tab === "mark" ? "active" : ""} onClick={() => setTab("mark")}><CalendarCheck size={13} /> Mark attendance</button>}
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><History size={13} /> History</button>
      </div>

      <div className="surface">
        <div className="surface-head">
          <div className="surface-head-left">
            <h3>{tab === "mark" ? "Daily attendance register" : "Attendance history"}</h3>
            <p>{tab === "mark" ? "Choose a class and date, then mark each student." : "Saved attendance from the operational register."}</p>
          </div>
          <div className="surface-head-actions" style={{ flexWrap: "wrap" }}>
            <select value={classSectionId} onChange={event => setClassSectionId(event.target.value)}>
              <option value="">All / select class</option>
              {sections.map((section: any) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
            {tab === "mark" && <input type="date" value={attendanceDate} max={today} onChange={event => setAttendanceDate(event.target.value)} />}
          </div>
        </div>

        {tab === "mark" ? (
          <>
            <div className="data-toolbar">
              <label className="search-box">
                <Search size={14} />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search student or number…" />
              </label>
              {classSectionId && canMark && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(["PRESENT", "ABSENT", "LATE"] as AttendanceStatus[]).map(status => (
                    <button key={status} className="secondary" onClick={() => markAll(status)}>{STATUS_META[status].short} · All {STATUS_META[status].label}</button>
                  ))}
                </div>
              )}
            </div>

            {!classSectionId ? (
              <div className="empty-state"><CalendarCheck size={34} /><b>Select a class section</b><p>The roster will load directly from active enrollments.</p></div>
            ) : roster.isLoading ? (
              <div className="empty-state"><b>Loading class roster…</b><p>Reading active enrollments and saved attendance.</p></div>
            ) : visibleStudents.length === 0 ? (
              <div className="empty-state"><CalendarCheck size={34} /><b>No students found</b><p>There are no active enrollments matching this register.</p></div>
            ) : (
              <div className="table-wrap sticky-head">
                <table className="premium-table">
                  <thead><tr><th>Student</th><th>Number</th><th>Status</th><th>Remarks</th><th>Last update</th></tr></thead>
                  <tbody>
                    {visibleStudents.map(student => {
                      const state = rows[student.studentId] ?? { status: "PRESENT" as AttendanceStatus, remarks: "" };
                      const meta = STATUS_META[state.status];
                      return (
                        <tr key={student.studentId}>
                          <td><b>{student.studentName}</b></td>
                          <td><code style={{ fontSize: 11 }}>{student.studentNumber}</code></td>
                          <td>
                            <button className={`status-pill ${meta.className}`} onClick={() => canMark && cycleStatus(student.studentId)} disabled={!canMark}>
                              {meta.label}
                            </button>
                          </td>
                          <td style={{ minWidth: 220 }}>
                            <input
                              value={state.remarks}
                              disabled={!canMark}
                              onChange={event => setRows(current => ({ ...current, [student.studentId]: { ...state, remarks: event.target.value } }))}
                              placeholder="Optional note"
                              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 8, padding: "7px 9px", background: "var(--surface)" }}
                            />
                          </td>
                          <td><small>{student.updatedAt ? new Date(student.updatedAt).toLocaleString() : "Not marked yet"}</small></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          history.isLoading ? (
            <div className="empty-state"><b>Loading attendance history…</b></div>
          ) : (history.data?.length ?? 0) === 0 ? (
            <div className="empty-state"><BarChart3 size={34} /><b>No attendance history</b><p>Saved attendance will appear here after the first register is submitted.</p></div>
          ) : (
            <div className="table-wrap sticky-head">
              <table className="premium-table">
                <thead><tr><th>Date</th><th>Class</th><th>Student</th><th>Number</th><th>Status</th><th>Remarks</th></tr></thead>
                <tbody>{history.data?.map(item => (
                  <tr key={item.attendanceId}>
                    <td>{localDate(item.attendanceDate)}</td>
                    <td>{item.classSectionName}</td>
                    <td><b>{item.studentName}</b></td>
                    <td><code style={{ fontSize: 11 }}>{item.studentNumber}</code></td>
                    <td><span className={`status-pill ${STATUS_META[item.status]?.className ?? "gray"}`}>{STATUS_META[item.status]?.label ?? item.status}</span></td>
                    <td>{item.remarks || "—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )
        )}
      </div>
    </>
  );
}
