import { useState } from "react";
import { moduleData } from "../../../../mocks/data";

const GRADES = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

export function FeeStructureTab() {
  const [grade, setGrade] = useState("Grade 9");
  const row = moduleData.feeStructure.find(r => r.grade === grade) ?? moduleData.feeStructure[2];

  return (
    <div className="surface">
      <div className="surface-head">
        <div><h3>Fee Structure</h3><p>Monthly fee breakdown per grade level</p></div>
        <select
          value={grade}
          onChange={e => setGrade(e.target.value)}
          style={{ height:34, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:8, background:"var(--surface)", fontSize:12, fontWeight:700 }}
        >
          {GRADES.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <div style={{ padding:"0 20px 20px" }}>
        {[
          ["Tuition Fee",   row.tuition],
          ["Transport Fee", row.transport],
          ["Library Fee",   row.library],
          ["Lab Fee",       row.lab],
          ["Sports Fee",    row.sports],
        ].map(([label, amount]) => (
          <div key={label as string} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid var(--surface-2)", fontSize:13 }}>
            <span style={{ fontWeight:500 }}>{label}</span>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <b style={{ fontSize:16 }}>${amount}</b>
              <button className="table-action" style={{ fontSize:11 }}>Edit</button>
            </div>
          </div>
        ))}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0 4px", fontSize:14, fontWeight:800 }}>
          <span>Total Monthly</span>
          <span style={{ fontSize:20, color:"var(--navy)" }}>${row.total}</span>
        </div>
      </div>
    </div>
  );
}
