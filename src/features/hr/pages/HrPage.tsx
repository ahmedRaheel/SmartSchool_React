import React, { useEffect, useState } from "react";
import { Plus, Search, X, CheckCircle2, XCircle, Clock, CalendarOff, MessageSquare } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { DocumentUploader } from "../../../components/ui/DocumentUploader";
import {
  useEmployees, useCreateEmployee, useCampuses, useDepartments,
  useLeaveRequests, useApproveLeave, useRejectLeave,
} from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { usePermissions } from "../../../core/rbac/usePermissions";
import { Users, Briefcase, UserCheck, AlertCircle } from "lucide-react";

const STAFF_TYPES = ["TEACHER","DRIVER","PRINCIPAL","ADMIN_OFFICER","ACCOUNTANT","HR","LIBRARIAN","TRANSPORT","OTHER"];
const EMPLOYMENT_TYPES = ["PERMANENT","CONTRACT","PART_TIME"];

export function HrPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const perms = usePermissions();
  const [tab, setTab] = useState<"list"|"leaves"|"new">("list");
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<1|2|3>(1);
  const [newEmpId, setNewEmpId] = useState("");
  const [docCompliant, setDocComp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Leave request state
  const [leaveFilter, setLeaveFilter] = useState<"ALL"|"PENDING"|"APPROVED"|"REJECTED">("ALL");
  const [rejectModal, setRejectModal] = useState<any|null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [localLeaves, setLocalLeaves] = useState<any[]>([]);

  const [localEmp, setLocalEmp] = useState<any[]>([]);
  const { data, isLoading } = useEmployees();
  const { data: leavesData } = useLeaveRequests();
  const approveLeave = useApproveLeave();
  const rejectLeave  = useRejectLeave();
  useEffect(()=>{ setLocalEmp((data as any)?.items??(data as any)??[]); },[data]);
  useEffect(()=>{ setLocalLeaves((leavesData as any)?.items??(leavesData as any)??[]); },[leavesData]);
  const { data: campusesData } = useCampuses();
  const { data: deptsData } = useDepartments();
  const createEmployee = useCreateEmployee();

  const employees = localEmp;
  const campuses  = (campusesData as any)?.items ?? (campusesData as any) ?? [];
  const depts     = (deptsData as any)?.items ?? (deptsData as any) ?? [];

  const pendingLeaves = localLeaves.filter((l:any) => l.status === "PENDING").length;

  async function handleApprove(leave: any) {
    try {
      await approveLeave.mutateAsync({ id: leave.id, notes: "Approved by HR" });
      setLocalLeaves(p => p.map((l:any) => l.id === leave.id ? { ...l, status: "APPROVED", approverNotes: "Approved by HR", approvedAt: new Date().toISOString() } : l));
    } catch { /* toast */ }
  }

  async function handleReject() {
    if (!rejectModal) return;
    try {
      await rejectLeave.mutateAsync({ id: rejectModal.id, reason: rejectReason || "Rejected by HR" });
      setLocalLeaves(p => p.map((l:any) => l.id === rejectModal.id ? { ...l, status: "REJECTED", approverNotes: rejectReason || "Rejected by HR", rejectedAt: new Date().toISOString() } : l));
      setRejectModal(null); setRejectReason("");
    } catch { /* toast */ }
  }

  const [form, setForm] = useState({
    schoolId: "", branchId: "", departmentId: "",
    firstName: "", lastName: "", cnicNumber: "", dateOfBirth: "", gender: "",
    jobTitle: "", staffType: "TEACHER", employmentTypeCode: "PERMANENT",
    email: "", phone: "", alternatePhone: "", address: "",
    emergencyContactName: "", emergencyContactPhone: "",
    hireDate: new Date().toISOString().slice(0,10),
    qualification: "",
  });

  function sf(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));
  }

  const filtered = employees.filter((e: any) =>
    `${e.firstName} ${e.lastName} ${e.jobTitle} ${e.staffType}`.toLowerCase().includes(search.toLowerCase())
  );

  async function saveStep1() {
    if (!form.firstName || !form.branchId || !form.staffType || !form.hireDate) {
      setError("First name, campus, staff type and hire date are required"); return;
    }
    setError("");
    try {
      const result: any = await createEmployee.mutateAsync({
        tenantId: tid,
        schoolId: campuses.find((c:any) => c.id === form.branchId)?.schoolId ?? "",
        branchId: form.branchId,
        departmentId: form.departmentId || undefined,
        firstName: form.firstName, lastName: form.lastName || undefined,
        cnicNumber: form.cnicNumber || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        jobTitle: form.jobTitle || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        hireDate: form.hireDate,
        employmentTypeCode: form.employmentTypeCode,
        staffType: form.staffType,
      });
      setNewEmpId(result?.id ?? `emp-mock-${Date.now()}`);
      setStep(2);
    } catch(e: any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed"); }
  }

  const STAFF_ACTOR: Record<string,string> = {
    TEACHER: "TEACHER", DRIVER: "DRIVER", ADMIN_OFFICER: "ADMIN_OFFICER",
    PRINCIPAL: "TEACHER", ACCOUNTANT: "EMPLOYEE", HR: "EMPLOYEE",
    LIBRARIAN: "EMPLOYEE", TRANSPORT: "DRIVER", OTHER: "EMPLOYEE",
  };

  const staffByType = (t: string) => employees.filter((e:any) => e.staffType === t).length;

  return (
    <>
      <PageHeader title="HR & Staff" subtitle="Employee management with document compliance"
        action={<div className="page-actions">
          {tab === "list" && <button className="primary" onClick={() => { setTab("new"); setStep(1); setNewEmpId(""); setDocComp(false); setSubmitted(false); setError(""); }}><Plus size={14}/> Add staff</button>}
          {tab === "new"  && <button className="secondary" onClick={() => setTab("list")}>← Back to list</button>}
          {tab === "leaves" && perms.can("hr.leave.apply") && !perms.can("hr.leave.approve") && (
            <button className="primary" onClick={() => {/* apply own leave */}}><Plus size={14}/> Apply leave</button>
          )}
        </div>}
      />

      {/* Tab bar — only show if not in "new" wizard */}
      {tab !== "new" && (
        <div className="section-tabs" style={{ marginBottom: 16 }}>
          <button className={tab === "list"   ? "active" : ""} onClick={() => setTab("list")}>
            👥 Staff ({employees.length})
          </button>
          {perms.canAny(["hr.leave.approve", "hr.leave.manage", "hr.leave.apply"]) && (
            <button className={tab === "leaves" ? "active" : ""} onClick={() => setTab("leaves")}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              📅 Leave requests
              {pendingLeaves > 0 && (
                <span style={{ background: "#EF4444", color: "white", borderRadius: 20, fontSize: 9, padding: "1px 6px", fontWeight: 800 }}>
                  {pendingLeaves}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── LEAVE REQUESTS TAB ─────────────────────────────────────────────── */}
      {tab === "leaves" && (
        <>
          <section className="metric-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Pending"  value={String(localLeaves.filter((l:any)=>l.status==="PENDING").length)}  note="awaiting action" color="#D97706" bg="#FFFBEB"><Clock size={20}/></StatCard>
            <StatCard label="Approved" value={String(localLeaves.filter((l:any)=>l.status==="APPROVED").length)} note="this month"     color="#059669" bg="#ECFDF5"><CheckCircle2 size={20}/></StatCard>
            <StatCard label="Rejected" value={String(localLeaves.filter((l:any)=>l.status==="REJECTED").length)} note=""             color="#DC2626" bg="#FEF2F2"><XCircle size={20}/></StatCard>
            <StatCard label="Total"    value={String(localLeaves.length)}                                          note=""             color="#6366F1" bg="#EEF2FF"><CalendarOff size={20}/></StatCard>
          </section>

          <div className="surface">
            <div className="surface-head">
              <h3>Leave requests</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {(["ALL","PENDING","APPROVED","REJECTED"] as const).map(f => (
                  <button key={f} onClick={() => setLeaveFilter(f)}
                    className={leaveFilter === f ? "primary" : "secondary"}
                    style={{ height: 30, fontSize: 11, padding: "0 12px" }}>
                    {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
                    {f !== "ALL" && ` (${localLeaves.filter((l:any)=>l.status===f).length})`}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-wrap">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Leave type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Applied</th>
                    <th>Status</th>
                    {perms.can("hr.leave.approve") && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {localLeaves
                    .filter((l:any) => leaveFilter === "ALL" || l.status === leaveFilter)
                    .length === 0 ? (
                      <tr><td colSpan={perms.can("hr.leave.approve") ? 10 : 9} style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
                        No {leaveFilter === "ALL" ? "" : leaveFilter.toLowerCase()} leave requests.
                      </td></tr>
                    ) : localLeaves
                      .filter((l:any) => leaveFilter === "ALL" || l.status === leaveFilter)
                      .map((leave: any) => {
                        const isPending  = leave.status === "PENDING";
                        const isApproved = leave.status === "APPROVED";
                        const isRejected = leave.status === "REJECTED";
                        return (
                          <tr key={leave.id} style={{ background: isPending ? "var(--warning-bg)" : "" }}>
                            <td>
                              <div className="person-cell">
                                <div style={{ width: 32, height: 32, borderRadius: 9, background: "var(--indigo-soft)", color: "var(--indigo)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                                  {leave.employeeName?.split(" ").map((n:string)=>n[0]).slice(0,2).join("")}
                                </div>
                                <div>
                                  <b style={{ fontSize: 12 }}>{leave.employeeName}</b>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "var(--indigo-soft)", color: "var(--indigo)", fontWeight: 700 }}>
                                {leave.staffType}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: 11, fontWeight: 700, color: leave.leaveType === "SICK" ? "#DC2626" : leave.leaveType === "EMERGENCY" ? "#7C3AED" : "#0369A1" }}>
                                {leave.leaveType}
                              </span>
                            </td>
                            <td style={{ fontSize: 11 }}>{leave.startDate}</td>
                            <td style={{ fontSize: 11 }}>{leave.endDate}</td>
                            <td style={{ textAlign: "center" }}><b>{leave.days}</b></td>
                            <td style={{ maxWidth: 200 }}>
                              <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {leave.reason}
                              </div>
                            </td>
                            <td style={{ fontSize: 10, color: "var(--muted)" }}>
                              {new Date(leave.appliedAt).toLocaleDateString("en-PK")}
                            </td>
                            <td>
                              <div>
                                <span className={`status-pill ${isApproved ? "success" : isRejected ? "danger" : "warning"}`} style={{ fontSize: 9 }}>
                                  {leave.status}
                                </span>
                                {(isApproved || isRejected) && leave.approverNotes && (
                                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3, fontStyle: "italic" }}>
                                    "{leave.approverNotes}"
                                  </div>
                                )}
                              </div>
                            </td>
                            {perms.can("hr.leave.approve") && (
                              <td>
                                {isPending && (
                                  <div className="row-actions">
                                    <button
                                      className="table-action approve"
                                      style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                      disabled={approveLeave.isPending}
                                      onClick={() => handleApprove(leave)}>
                                      <CheckCircle2 size={11} /> Approve
                                    </button>
                                    <button
                                      className="table-action reject"
                                      style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}
                                      onClick={() => { setRejectModal(leave); setRejectReason(""); }}>
                                      <XCircle size={11} /> Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                  }
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>
                {localLeaves.filter((l:any) => leaveFilter === "ALL" || l.status === leaveFilter).length} leave requests
                {perms.can("hr.leave.approve") && pendingLeaves > 0 && (
                  <span style={{ marginLeft: 10, color: "#D97706", fontWeight: 700 }}>· {pendingLeaves} pending your action</span>
                )}
              </span>
            </div>
          </div>

          {/* Reject reason modal */}
          {rejectModal && (
            <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setRejectModal(null); }}>
              <div className="modal-card" style={{ width: "min(420px,96vw)" }}>
                <div className="modal-head">
                  <div>
                    <h2 style={{ fontSize: 17 }}>Reject leave request</h2>
                    <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{rejectModal.employeeName} · {rejectModal.days} day{rejectModal.days>1?"s":""} ({rejectModal.leaveType})</p>
                  </div>
                  <button className="icon-button" onClick={() => setRejectModal(null)}><X size={18}/></button>
                </div>
                <div className="human-form">
                  <div style={{ padding: "10px 14px", background: "var(--surface-2)", borderRadius: 10, fontSize: 12 }}>
                    <b>Reason for leave:</b> {rejectModal.reason}
                  </div>
                  <label className="human-field field-wide">
                    <span>Rejection reason (shown to employee)</span>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="e.g. Exam week — cannot grant leave. Please re-apply after exams."
                      style={{ minHeight: 80, padding: "10px 12px", border: "1.5px solid var(--line)", borderRadius: 10, width: "100%", fontSize: 13, resize: "vertical" }}
                    />
                  </label>
                </div>
                <div className="modal-actions" style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                  <button className="secondary" onClick={() => setRejectModal(null)}>Cancel</button>
                  <button
                    style={{ height: 36, padding: "0 16px", borderRadius: 9, border: "none", background: "var(--danger)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                    onClick={handleReject} disabled={rejectLeave.isPending}>
                    <XCircle size={13} /> {rejectLeave.isPending ? "Rejecting…" : "Confirm rejection"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "list" && (
        <>
          <section className="metric-grid" style={{ marginBottom:20 }}>
            <StatCard label="Total staff" value={String(employees.length)}    note=""           color="#0F2241" bg="#EEF2FF"><Users size={20}/></StatCard>
            <StatCard label="Teachers"    value={String(staffByType("TEACHER"))} note=""        color="#2563EB" bg="#EFF6FF"><UserCheck size={20}/></StatCard>
            <StatCard label="Drivers"     value={String(staffByType("DRIVER"))}  note=""        color="#D97706" bg="#FFFBEB"><Briefcase size={20}/></StatCard>
            <StatCard label="Admin"       value={String(staffByType("ADMIN_OFFICER"))} note=""  color="#8B5CF6" bg="#F5F3FF"><Users size={20}/></StatCard>
          </section>
          <div className="surface">
            <div className="surface-head">
              <label className="search-box" style={{ maxWidth:280 }}>
                <Search size={14}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"/>
              </label>
            </div>
            {isLoading ? <div style={{ padding:40, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
              <div className="table-wrap">
                <table className="premium-table">
                  <thead><tr><th>Name</th><th>Employee #</th><th>Role</th><th>Department</th><th>Campus</th><th>Hire date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filtered.length === 0
                      ? <tr><td colSpan={7} style={{ textAlign:"center", padding:32, color:"var(--muted)" }}>No staff found.</td></tr>
                      : filtered.map((e: any) => (
                        <tr key={e.id}>
                          <td>
                            <div className="person-cell">
                              <span className="row-avatar">{e.firstName?.[0]}{e.lastName?.[0]??""}</span>
                              <div><b>{e.firstName} {e.lastName ?? ""}</b><div style={{ fontSize:10, color:"var(--muted)" }}>{e.email ?? ""}</div></div>
                            </div>
                          </td>
                          <td><code style={{ fontSize:11 }}>{e.employeeNumber ?? "—"}</code></td>
                          <td>
                            <span style={{ fontSize:10, padding:"2px 8px", borderRadius:20, background:"#EEF2FF", color:"#6366F1", fontWeight:700 }}>
                              {e.staffType ?? "—"}
                            </span>
                          </td>
                          <td style={{ fontSize:11 }}>{e.department ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{e.jobTitle ?? "—"}</td>
                          <td style={{ fontSize:11 }}>{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : "—"}</td>
                          <td><span className={`status-pill ${e.status === "ACTIVE" ? "success" : e.status === "ON_LEAVE" ? "warning" : e.status === "PENDING" ? "info" : "danger"}`}>{e.status}</span></td>
                          <td>
                            <div className="row-actions">
                              {e.status !== "ACTIVE" && e.status !== "TERMINATED" && (
                                <button className="table-action approve"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"ACTIVE"}:x)); }}>
                                  ✓ Approve
                                </button>
                              )}
                              {e.status === "ACTIVE" && (
                                <button className="table-action hold"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"ON_LEAVE"}:x)); }}>
                                  ⏸ Leave
                                </button>
                              )}
                              {e.status !== "TERMINATED" && (
                                <button className="table-action reject"
                                  onClick={ev => { ev.stopPropagation(); setLocalEmp(p => p.map((x:any) => x.id===e.id ? {...x,status:"TERMINATED"}:x)); }}>
                                  ✗
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="table-footer"><span>{filtered.length} staff members</span></div>
          </div>
        </>
      )}

      {tab === "new" && (
        <div style={{ maxWidth:760, margin:"0 auto" }}>
          {/* Step indicator */}
          <div style={{ display:"flex", gap:0, marginBottom:20, border:"1px solid var(--line)", borderRadius:12, overflow:"hidden" }}>
            {[
              { n:1, label:"Personal & Role info" },
              { n:2, label:"Upload required documents" },
              { n:3, label:"Review & confirm" },
            ].map((s, i) => (
              <div key={s.n} style={{ flex:1, padding:"12px 16px", background: step===s.n ? "#EEF2FF" : step>s.n ? "#ECFDF5" : "var(--surface)", borderRight: i<2 ? "1px solid var(--line)" : "none", textAlign:"center" }}>
                <div style={{ fontSize:11, fontWeight:700, color: step===s.n ? "#6366F1" : step>s.n ? "#059669" : "var(--muted)" }}>
                  {step > s.n ? "✓" : `Step ${s.n}`}
                </div>
                <div style={{ fontSize:12, marginTop:2, color: step>=s.n ? "var(--text)" : "var(--muted)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Step 1 — Personal info */}
          {step === 1 && (
            <div className="surface">
              <div className="surface-head"><h3>Staff information</h3></div>
              <div className="human-form">
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4 }}>Role & placement</div>
                <div className="human-form-grid">
                  <label className="human-field field-wide"><span>Campus *</span>
                    <select value={form.branchId} onChange={sf("branchId")}>
                      <option value="">— Select campus —</option>
                      {campuses.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Staff type *</span>
                    <select value={form.staffType} onChange={sf("staffType")}>
                      {STAFF_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Employment type</span>
                    <select value={form.employmentTypeCode} onChange={sf("employmentTypeCode")}>
                      {EMPLOYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="human-field"><span>Department</span>
                    <select value={form.departmentId} onChange={sf("departmentId")}>
                      <option value="">— None —</option>
                      {depts.map((d:any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </label>
                  <label className="human-field field-wide"><span>Job title</span><input value={form.jobTitle} onChange={sf("jobTitle")} placeholder="e.g. Senior Mathematics Teacher"/></label>
                </div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94A3B8", textTransform:"uppercase", letterSpacing:.8, marginBottom:4, marginTop:10 }}>Personal details</div>
                <div className="human-form-grid">
                  <label className="human-field"><span>First name *</span><input value={form.firstName} onChange={sf("firstName")}/></label>
                  <label className="human-field"><span>Last name</span><input value={form.lastName} onChange={sf("lastName")}/></label>
                  <label className="human-field"><span>CNIC</span><input value={form.cnicNumber} onChange={sf("cnicNumber")} placeholder="35202-0000000-0"/></label>
                  <label className="human-field"><span>Date of birth</span><input type="date" value={form.dateOfBirth} onChange={sf("dateOfBirth")}/></label>
                  <label className="human-field"><span>Gender</span>
                    <select value={form.gender} onChange={sf("gender")}>
                      <option value="">—</option><option>Male</option><option>Female</option>
                    </select>
                  </label>
                  <label className="human-field"><span>Qualification</span><input value={form.qualification} onChange={sf("qualification")} placeholder="e.g. MSc Mathematics"/></label>
                  <label className="human-field"><span>Email</span><input type="email" value={form.email} onChange={sf("email")}/></label>
                  <label className="human-field"><span>Phone</span><input value={form.phone} onChange={sf("phone")}/></label>
                  <label className="human-field"><span>Hire date *</span><input type="date" value={form.hireDate} onChange={sf("hireDate")}/></label>
                  <label className="human-field field-wide"><span>Address</span><input value={form.address} onChange={sf("address")}/></label>
                  <label className="human-field"><span>Emergency contact name</span><input value={form.emergencyContactName} onChange={sf("emergencyContactName")}/></label>
                  <label className="human-field"><span>Emergency contact phone</span><input value={form.emergencyContactPhone} onChange={sf("emergencyContactPhone")}/></label>
                </div>
                {error && <div style={{ color:"var(--danger)", fontSize:12 }}>{error}</div>}
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setTab("list")}>Cancel</button>
                <button className="primary" onClick={saveStep1} disabled={createEmployee.isPending}>
                  {createEmployee.isPending ? "Saving…" : "Next: Upload documents →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Documents */}
          {step === 2 && (
            <div className="surface">
              <div className="surface-head">
                <div>
                  <h3>Required documents</h3>
                  <p>All marked required must be uploaded before the employee can be approved</p>
                </div>
              </div>
              <div style={{ padding:"0 20px 20px" }}>
                <DocumentUploader
                  actorType={STAFF_ACTOR[form.staffType] ?? "EMPLOYEE"}
                  entityId={newEmpId}
                  tenantId={tid}
                  staffType={form.staffType}
                  onComplianceChange={setDocComp}
                  title={`Documents for ${form.staffType}`}
                />
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="primary" onClick={() => setStep(3)}>
                  {docCompliant ? "Next: Review →" : "Skip for now →"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Review */}
          {step === 3 && (
            <div className="surface">
              <div className="surface-head"><h3>Review & confirm</h3></div>
              <div style={{ padding:"0 20px 20px" }}>
                {!docCompliant && (
                  <div style={{ display:"flex", gap:10, padding:"12px 14px", background:"#FFFBEB", border:"1px solid #fde68a", borderRadius:10, marginBottom:14, fontSize:12 }}>
                    <AlertCircle size={16} style={{ color:"#D97706", flexShrink:0 }}/>
                    <span>Not all required documents have been uploaded. The employee will be saved as <b>PENDING_DOCUMENTS</b> and must upload remaining documents before approval.</span>
                  </div>
                )}
                {docCompliant && (
                  <div style={{ padding:"12px 14px", background:"#ECFDF5", border:"1px solid #a7f3d0", borderRadius:10, marginBottom:14, fontSize:12, color:"#065f46" }}>
                    ✅ All required documents uploaded. Employee is ready for approval.
                  </div>
                )}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4 }}>
                  {[
                    ["Name", `${form.firstName} ${form.lastName}`],
                    ["Staff type", form.staffType],
                    ["Employment", form.employmentTypeCode],
                    ["Hire date", form.hireDate],
                    ["Email", form.email || "—"],
                    ["Phone", form.phone || "—"],
                    ["Campus", campuses.find((c:any)=>c.id===form.branchId)?.name ?? form.branchId],
                    ["Documents", docCompliant ? "✓ Complete" : "⚠ Incomplete"],
                  ].map(([l, v]) => (
                    <div key={l} style={{ display:"flex", gap:8, padding:"8px 0", borderBottom:"1px solid var(--surface-2)", fontSize:12 }}>
                      <span style={{ width:120, color:"var(--muted)", flexShrink:0 }}>{l}</span>
                      <b>{v}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
                <button className="secondary" onClick={() => setStep(2)}>← Back</button>
                <button className="primary" onClick={() => { setSubmitted(true); setTab("list"); }}>
                  ✓ Confirm & save employee
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
