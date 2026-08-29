import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { students } from "../../../mocks/data";

export function StudentsPage() {
  const [q, setQ] = useState("");
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.studentNumber.includes(q)
  );

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${students.length} students enrolled · AY 2025–26`}
        action={
          <div className="page-actions">
            <button className="secondary">Export</button>
            <button className="primary"><Plus size={15} /> Enroll Student</button>
          </div>
        }
      />

      <section className="metric-grid" style={{ marginBottom: 20 }}>
        <StatCard label="Total Students"     value="2,840" note="↑ 3% enrollment"    color="#2563EB" bg="#EFF6FF"><span style={{fontSize:20}}>🎓</span></StatCard>
        <StatCard label="New This Month"     value="34"    note="↑ 12%"              color="#10B981" bg="#ECFDF5"><span style={{fontSize:20}}>➕</span></StatCard>
        <StatCard label="AI Flagged At-Risk" value="47"    note="Needs intervention" color="#EF4444" bg="#FFF0F1"><span style={{fontSize:20}}>⚠️</span></StatCard>
        <StatCard label="Graduated"          value="312"   note="This year"          color="#D97706" bg="#FFFBEB"><span style={{fontSize:20}}>🏆</span></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head">
          <div>
            <h3>All Students</h3>
            <p>Search, filter and manage student records</p>
          </div>
          <button className="primary"><Plus size={14} /> Enroll Student</button>
        </div>

        <div className="data-toolbar" style={{ padding: "0 20px 14px" }}>
          <label className="search-box">
            <Search size={15} />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by name or roll number…"
            />
          </label>
          <select className="soft-button" style={{ border: "1.5px solid var(--line)", borderRadius: 8, padding: "0 12px" }}>
            <option>All Grades</option>
            <option>Grade 7</option><option>Grade 8</option>
            <option>Grade 9</option><option>Grade 10</option>
            <option>Grade 11</option><option>Grade 12</option>
          </select>
          <select className="soft-button" style={{ border: "1.5px solid var(--line)", borderRadius: 8, padding: "0 12px" }}>
            <option>All Sections</option>
            <option>Section A</option><option>Section B</option><option>Section C</option>
          </select>
        </div>

        <div className="table-wrap">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Grade</th>
                <th>Roll No.</th>
                <th>Attendance</th>
                <th>Avg Grade</th>
                <th>Fee Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="person-cell">
                      <span
                        className="row-avatar"
                        style={{ background: "#EFF6FF", color: "#2563EB" }}
                      >
                        {s.name.split(" ").map(w => w[0]).join("")}
                      </span>
                      <div>
                        <b>{s.name}</b>
                        <small>{s.status}</small>
                      </div>
                    </div>
                  </td>
                  <td>{s.className} — {s.section}</td>
                  <td><code style={{ fontSize: 11 }}>{s.studentNumber}</code></td>
                  <td>{s.attendance}</td>
                  <td><b>{s.avgGrade}</b></td>
                  <td>
                    <span
                      className={`status-pill ${
                        s.feeStatus === "Paid"    ? "success" :
                        s.feeStatus === "Overdue" ? "danger"  : "warning"
                      }`}
                    >
                      {s.feeStatus}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="table-action">View</button>
                      <button className="table-action">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filtered.length} of {students.length} students</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[1, 2, 3].map(p => (
              <button
                key={p}
                className="table-action"
                style={{ minWidth: 28, padding: 0, fontWeight: p === 1 ? 700 : 400 }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
