import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Search, UserRound, UsersRound } from "lucide-react";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";
import { AddStudentWizard } from "../components/AddStudentWizard";
import { StudentSummary, studentsApi } from "../api/studentsApi";

export function StudentsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [approvalStudent, setApprovalStudent] = useState<StudentSummary | null>(null);
  const [approvalEmail, setApprovalEmail] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadStudents() {
    setIsLoading(true);
    try {
      const page = await studentsApi.getPage(tenantId, 1, 50);
      setStudents(page.items ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { void loadStudents(); }, [tenantId]);

  const visibleStudents = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return students.filter((student) =>
      `${student.studentNumber} ${student.firstName} ${student.lastName ?? ""}`.toLowerCase().includes(query),
    );
  }, [students, searchText]);

  async function approveStudent() {
    if (!approvalStudent || !approvalEmail.trim()) return;
    setActionError("");
    try {
      await studentsApi.approve(approvalStudent.id, tenantId, approvalEmail.trim());
      setApprovalStudent(null);
      setApprovalEmail("");
      await loadStudents();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Student approval failed.");
    }
  }

  return (
    <div className="business-page">
      <header className="business-hero">
        <div><span className="eyebrow">STUDENT INFORMATION SYSTEM</span><h1>Students</h1><p>Admissions remain pending until a Principal or Tenant Administrator approves portal access.</p></div>
        <button className="button primary" onClick={() => setShowAddStudent(true)}><Plus size={17} />Add student</button>
      </header>

      <section className="metric-grid">
        <Metric icon={<UsersRound />} label="Total students" value={String(students.length)} />
        <Metric icon={<CheckCircle2 />} label="Active" value={String(students.filter((x) => x.status === "ACTIVE").length)} />
        <Metric icon={<UserRound />} label="Awaiting approval" value={String(students.filter((x) => x.status === "PENDING_APPROVAL").length)} />
      </section>

      <section className="content-card">
        <div className="content-toolbar"><div><h2>Student directory</h2><p>Approve an admission to provision the student's login account.</p></div><label className="search-box"><Search size={17} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search students" /></label></div>
        {isLoading ? <div className="state-panel">Loading students…</div> : (
          <div className="data-table">
            <div className="data-row data-head"><span>Student</span><span>Student no.</span><span>Admission</span><span>Status / action</span></div>
            {visibleStudents.map((student) => (
              <div className="data-row" key={student.id}>
                <span><b>{student.firstName} {student.lastName}</b><small>{student.id}</small></span>
                <span>{student.studentNumber ?? "Assigned after approval"}</span><span>{student.admissionDate || "—"}</span>
                <span>{student.status === "PENDING_APPROVAL" ? <button className="button primary" onClick={() => setApprovalStudent(student)}>Approve admission</button> : <i className="status-pill">{student.status}</i>}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {showAddStudent && <AddStudentWizard tenantId={tenantId} onClose={() => setShowAddStudent(false)} onCreated={() => { setShowAddStudent(false); void loadStudents(); }} />}
      {approvalStudent && (
        <div className="workflow-overlay"><section className="workflow-dialog compact-dialog" role="dialog" aria-modal="true"><header className="workflow-header"><div><small>ADMISSION APPROVAL</small><h2>Approve {approvalStudent.firstName}</h2><p>Approval creates the Identity account and activates student portal access.</p></div></header><div className="workflow-body"><label className="field"><span>Student login email</span><input type="email" value={approvalEmail} onChange={(event) => setApprovalEmail(event.target.value)} placeholder="student@example.com" /></label>{actionError && <div className="form-error">{actionError}</div>}</div><footer className="workflow-footer"><button className="button secondary" onClick={() => setApprovalStudent(null)}>Cancel</button><button className="button primary" disabled={!approvalEmail.trim()} onClick={() => void approveStudent()}>Approve & create account</button></footer></section></div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="metric-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
