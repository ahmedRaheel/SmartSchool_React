import { useMemo, useState } from "react";
import { Modal, useUi } from "../../../components/ui/InteractiveUi";
import { Download, Filter, Search, UserPlus } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { students } from "../../../mocks/data";
const studentRows = [
    ...students.map((student, index) => ({
        ...student,
        guardian: ["Mrs. Khan", "Mr. Ali", "Mrs. Raza"][index],
        attendance: ["96%", "91%", "94%"][index],
        prediction: ["A+", "A", "A"][index],
    })),
    { id: "4", name: "Noor Fatima", admissionNo: "ADM-2026-004", className: "Grade 10", section: "B", status: "Active", guardian: "Mr. Fatima", attendance: "98%", prediction: "A+" },
    { id: "5", name: "Zayan Ahmed", admissionNo: "ADM-2026-005", className: "Grade 7", section: "C", status: "Review", guardian: "Mrs. Ahmed", attendance: "84%", prediction: "B" },
    { id: "6", name: "Amina Yusuf", admissionNo: "ADM-2026-006", className: "O Level", section: "Blue", status: "Active", guardian: "Mrs. Yusuf", attendance: "97%", prediction: "A*" },
];
export function StudentsPage() {
    const { notify } = useUi();
    const [selected, setSelected] = useState<(typeof studentRows)[number] | null>(null);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => studentRows.filter((student) => `${student.name} ${student.admissionNo} ${student.className} ${student.guardian}`.toLowerCase().includes(query.toLowerCase())), [query]);
    return (<>
      <PageHeader title="Students" subtitle="Student lifecycle, academics, guardians and predicted progress." action={<button className="primary" onClick={() => notify("Add student form is ready for backend binding.")}>
<UserPlus size={16}/> Add student</button>}/>
      <section className="metric-grid">
        <article className="metric-card">
<div className="metric-label">Total Students</div>
<div className="metric-value">1,248</div>
<div className="metric-note up">+8.2% this year</div>
</article>
        <article className="metric-card">
<div className="metric-label">New Admissions</div>
<div className="metric-value">84</div>
<div className="metric-note up">Current session</div>
</article>
        <article className="metric-card">
<div className="metric-label">Avg. Attendance</div>
<div className="metric-value">92.6%</div>
<div className="metric-note up">+1.8% this month</div>
</article>
        <article className="metric-card">
<div className="metric-label">Needs Attention</div>
<div className="metric-value">34</div>
<div className="metric-note down">AI progress watchlist</div>
</article>
      </section>
      <section className="surface data-surface">
        <div className="surface-head">
          <div>
<h3>Student directory</h3>
<p>Search and manage enrolled students</p>
</div>
          <button className="secondary">
<Download size={16}/> Export</button>
        </div>
        <div className="data-toolbar">
          <label className="search-box">
<Search size={17}/>
<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, admission no, class or guardian..."/>
</label>
          <button className="secondary">
<Filter size={16}/> Filters</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead>
<tr>
<th>Student</th>
<th>Admission</th>
<th>Class</th>
<th>Guardian</th>
<th>Attendance</th>
<th>AI Prediction</th>
<th>Status</th>
</tr>
</thead>
            <tbody>{filtered.map((student) => (<tr key={student.id} onClick={() => setSelected(student)}>
                <td>
<div className="person-cell">
<span className="avatar small">{student.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</span>
<span>
<b>{student.name}</b>
<small>Student profile</small>
</span>
</div>
</td>
                <td>{student.admissionNo}</td>
<td>{student.className} • {student.section}</td>
<td>{student.guardian}</td>
                <td>
<b>{student.attendance}</b>
</td>
<td>
<span className="prediction-chip">{student.prediction}</span>
</td>
                <td>
<span className={`status-pill ${student.status.toLowerCase()}`}>{student.status}</span>
</td>
              </tr>))}</tbody>
          </table>
        </div>
      </section>
      <Modal open={Boolean(selected)} title={selected?.name ?? "Student"} onClose={() => setSelected(null)}>{selected && <div className="detail-body">
<div className="detail-grid">
<div>
<span>Admission</span>
<b>{selected.admissionNo}</b>
</div>
<div>
<span>Class</span>
<b>{selected.className} • {selected.section}</b>
</div>
<div>
<span>Guardian</span>
<b>{selected.guardian}</b>
</div>
<div>
<span>Attendance / Prediction</span>
<b>{selected.attendance} • {selected.prediction}</b>
</div>
</div>
<div className="detail-note">Student mock profile ready for backend DTO binding.</div>
</div>}</Modal>
    </>);
}

