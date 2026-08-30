import { useState } from "react";
import { Plus, X } from "lucide-react";
import { moduleData } from "../../../../mocks/data";

interface FeeType { id:string; name:string; code:string; frequency:string; }
const MOCK_FT: FeeType[] = [
  {id:"1",name:"Tuition Fee",  code:"TUITION",  frequency:"Monthly"},
  {id:"2",name:"Transport Fee",code:"TRANSPORT",frequency:"Monthly"},
  {id:"3",name:"Library Fee",  code:"LIBRARY",  frequency:"Annual"},
  {id:"4",name:"Lab Fee",      code:"LAB",      frequency:"Term"},
  {id:"5",name:"Sports Fee",   code:"SPORTS",   frequency:"Annual"},
];

const GRADES = ["Grade 7","Grade 8","Grade 9","Grade 10","Grade 11","Grade 12"];

export function FeeConfigTab() {
  const [feeTypes, setFeeTypes] = useState<FeeType[]>(MOCK_FT);
  const [ftOpen, setFtOpen]     = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("Grade 9");
  const [ff, setFf]             = useState({name:"",code:"",frequency:"Monthly"});

  const row = moduleData.feeStructure.find(r=>r.grade===selectedGrade) ?? moduleData.feeStructure[2];

  function saveFt() {
    if(!ff.name||!ff.code) return;
    setFeeTypes(p=>[...p,{id:Date.now().toString(),...ff}]);
    setFtOpen(false); setFf({name:"",code:"",frequency:"Monthly"});
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {/* Fee Types */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Fee types</h3><p>Categories of fees your school charges</p></div>
          <button className="primary" onClick={()=>setFtOpen(true)}><Plus size={14}/> Add fee type</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Fee type</th><th>Code</th><th>Frequency</th></tr></thead>
            <tbody>
              {feeTypes.map(ft=>(
                <tr key={ft.id}>
                  <td><b>{ft.name}</b></td>
                  <td><code style={{fontSize:11}}>{ft.code}</code></td>
                  <td><span className="status-pill info">{ft.frequency}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee Structure per grade */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Fee structure</h3><p>Monthly amounts per grade level</p></div>
          <select value={selectedGrade} onChange={e=>setSelectedGrade(e.target.value)}
            style={{height:34,padding:"0 12px",border:"1.5px solid var(--line)",borderRadius:8,background:"var(--surface)",fontSize:12,fontWeight:700}}>
            {GRADES.map(g=><option key={g}>{g}</option>)}
          </select>
        </div>
        <div style={{padding:"0 20px 20px"}}>
          {[["Tuition Fee",row.tuition],["Transport Fee",row.transport],["Library Fee",row.library],["Lab Fee",row.lab],["Sports Fee",row.sports]].map(([l,v])=>(
            <div key={l as string} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:"1px solid var(--surface-2)",fontSize:13}}>
              <span style={{fontWeight:500}}>{l}</span>
              <div style={{display:"flex",alignItems:"center",gap:16}}>
                <b style={{fontSize:16}}>$ {v}</b>
                <button className="table-action" style={{fontSize:11}}>Edit</button>
              </div>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"16px 0 4px",fontSize:14,fontWeight:700}}>
            <span>Total monthly</span><span style={{fontSize:20,color:"var(--navy)"}}>$ {row.total}</span>
          </div>
        </div>
      </div>

      {ftOpen && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setFtOpen(false)}}>
          <div className="modal-card" style={{width:"min(480px,96vw)"}}>
            <div className="modal-head"><h2>Add fee type</h2><button className="icon-button" onClick={()=>setFtOpen(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field"><span>Name *</span><input value={ff.name} onChange={e=>setFf(p=>({...p,name:e.target.value}))} placeholder="e.g. Exam Fee"/></label>
                <label className="human-field"><span>Code *</span><input value={ff.code} onChange={e=>setFf(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. EXAM"/></label>
                <label className="human-field"><span>Frequency</span>
                  <select value={ff.frequency} onChange={e=>setFf(p=>({...p,frequency:e.target.value}))}>
                    <option>Monthly</option><option>Term</option><option>Annual</option><option>OneTime</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setFtOpen(false)}>Cancel</button>
              <button className="primary" onClick={saveFt} disabled={!ff.name||!ff.code}>Save fee type</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
