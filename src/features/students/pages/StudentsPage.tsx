import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Search, UserRound, UsersRound } from "lucide-react";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { useAuth } from "../../auth/auth";
import { StudentSummary, studentsApi } from "../api/studentsApi";

export function StudentsPage() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
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

  async function strikeOff(student: StudentSummary) {
    if (!window.confirm(`Strike off ${student.firstName} ${student.lastName ?? ""}? Portal access will be revoked.`)) return;
    await studentsApi.strikeOff(student.id, tenantId, "Struck off by school administration");
    await loadStudents();
  }


  return (
    <div className="business-page">
      <header className="business-hero">
        <div><span className="eyebrow">STUDENT INFORMATION SYSTEM</span><h1>Students</h1><p>Only admitted students appear here. New applicants are managed from Admissions.</p></div>
      </header>

      <section className="metric-grid">
        <Metric icon={<UsersRound />} label="Total students" value={String(students.length)} />
        <Metric icon={<CheckCircle2 />} label="Active" value={String(students.filter((x) => x.status === "ACTIVE").length)} />
        <Metric icon={<UserRound />} label="Struck off" value={String(students.filter((x) => x.status === "STRUCK_OFF").length)} />
      </section>

      <section className="content-card">
        <div className="content-toolbar"><div><h2>Student directory</h2><p>Student numbers are allocated by the system when admission is accepted.</p></div><label className="search-box"><Search size={17} /><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search students" /></label></div>
        {isLoading ? <div className="state-panel">Loading students…</div> : (
          <div className="data-table">
            <div className="data-row data-head"><span>Student</span><span>Student no.</span><span>Admission</span><span>Status / action</span></div>
            {visibleStudents.map((student) => (
              <div className="data-row" key={student.id}>
                <span><b>{student.firstName} {student.lastName}</b></span>
                <span>{student.studentNumber ?? "Assigned after approval"}</span><span>{student.admissionDate || "—"}</span>
                <span><div className="row-actions"><i className="status-pill">{student.status}</i>{student.status !== "STRUCK_OFF" && <button className="button secondary compact" onClick={() => void strikeOff(student)}>Strike off</button>}</div></span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <article className="metric-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
