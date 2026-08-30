import { useState } from "react";
import { Plus, X } from "lucide-react";

interface School { id:string; name:string; reg:string; city:string; phone:string; email:string; }
interface Campus { id:string; schoolId:string; name:string; type:string; city:string; isMain:boolean; }

const MOCK_SCHOOLS: School[] = [
  { id:"1", name:"Al-Noor Academy", reg:"REG-2020-001", city:"Karachi", phone:"021-1234567", email:"info@alnoor.edu.pk" },
];
const MOCK_CAMPUS: Campus[] = [
  { id:"1", schoolId:"1", name:"Main Campus", type:"Main",    city:"Karachi",  isMain:true  },
  { id:"2", schoolId:"1", name:"North Branch",type:"Branch",  city:"Karachi",  isMain:false },
  { id:"3", schoolId:"1", name:"Gulshan Campus",type:"Branch",city:"Karachi",  isMain:false },
];

export function SchoolCampusTab() {
  const [schools, setSchools] = useState<School[]>(MOCK_SCHOOLS);
  const [campuses, setCampuses] = useState<Campus[]>(MOCK_CAMPUS);
  const [schoolModal, setSchoolModal] = useState(false);
  const [campusModal, setCampusModal] = useState(false);
  const [sf, setSf] = useState({ name:"",reg:"",city:"",phone:"",email:"" });
  const [cf, setCf] = useState({ schoolId:"1",name:"",type:"Branch",city:"",isMain:"false" });

  function saveSchool() {
    if(!sf.name) return;
    setSchools(p=>[...p,{id:Date.now().toString(),...sf}]);
    setSchoolModal(false); setSf({name:"",reg:"",city:"",phone:"",email:""});
  }
  function saveCampus() {
    if(!cf.name) return;
    setCampuses(p=>[...p,{id:Date.now().toString(),...cf,isMain:cf.isMain==="true"}]);
    setCampusModal(false); setCf({schoolId:"1",name:"",type:"Branch",city:"",isMain:"false"});
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Schools */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Schools</h3><p>Your registered school entities</p></div>
          <button className="primary" onClick={()=>setSchoolModal(true)}><Plus size={14}/> Add school</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Name</th><th>Reg. No.</th><th>City</th><th>Email</th><th>Campuses</th></tr></thead>
            <tbody>
              {schools.map(s=>(
                <tr key={s.id}>
                  <td><b>{s.name}</b></td>
                  <td><code style={{fontSize:11}}>{s.reg}</code></td>
                  <td>{s.city}</td><td>{s.email}</td>
                  <td>{campuses.filter(c=>c.schoolId===s.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campuses */}
      <div className="surface">
        <div className="surface-head">
          <div><h3>Campuses / Branches</h3><p>Physical locations for each school</p></div>
          <button className="primary" onClick={()=>setCampusModal(true)}><Plus size={14}/> Add campus</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Campus</th><th>School</th><th>Type</th><th>City</th><th>Main?</th></tr></thead>
            <tbody>
              {campuses.map(c=>(
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{schools.find(s=>s.id===c.schoolId)?.name}</td>
                  <td><span className={`status-pill ${c.type==="Main"?"success":"info"}`}>{c.type}</span></td>
                  <td>{c.city}</td>
                  <td>{c.isMain?"✅":"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {schoolModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setSchoolModal(false)}}>
          <div className="modal-card" style={{width:"min(560px,96vw)"}}>
            <div className="modal-head"><h2>Add school</h2><button className="icon-button" onClick={()=>setSchoolModal(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field field-wide"><span>School name *</span><input value={sf.name} onChange={e=>setSf(p=>({...p,name:e.target.value}))}/></label>
                <label className="human-field"><span>Registration no.</span><input value={sf.reg} onChange={e=>setSf(p=>({...p,reg:e.target.value}))}/></label>
                <label className="human-field"><span>City</span><input value={sf.city} onChange={e=>setSf(p=>({...p,city:e.target.value}))}/></label>
                <label className="human-field"><span>Phone</span><input value={sf.phone} onChange={e=>setSf(p=>({...p,phone:e.target.value}))}/></label>
                <label className="human-field field-wide"><span>Email</span><input type="email" value={sf.email} onChange={e=>setSf(p=>({...p,email:e.target.value}))}/></label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setSchoolModal(false)}>Cancel</button>
              <button className="primary" onClick={saveSchool} disabled={!sf.name}>Save school</button>
            </div>
          </div>
        </div>
      )}

      {campusModal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setCampusModal(false)}}>
          <div className="modal-card" style={{width:"min(520px,96vw)"}}>
            <div className="modal-head"><h2>Add campus</h2><button className="icon-button" onClick={()=>setCampusModal(false)}><X size={18}/></button></div>
            <div className="human-form">
              <div className="human-form-grid">
                <label className="human-field"><span>School</span>
                  <select value={cf.schoolId} onChange={e=>setCf(p=>({...p,schoolId:e.target.value}))}>
                    {schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label className="human-field"><span>Campus name *</span><input value={cf.name} onChange={e=>setCf(p=>({...p,name:e.target.value}))}/></label>
                <label className="human-field"><span>Type</span>
                  <select value={cf.type} onChange={e=>setCf(p=>({...p,type:e.target.value}))}>
                    <option>Main</option><option>Branch</option><option>Satellite</option>
                  </select>
                </label>
                <label className="human-field"><span>City</span><input value={cf.city} onChange={e=>setCf(p=>({...p,city:e.target.value}))}/></label>
                <label className="human-field"><span>Is main campus?</span>
                  <select value={cf.isMain} onChange={e=>setCf(p=>({...p,isMain:e.target.value}))}>
                    <option value="false">No</option><option value="true">Yes</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="modal-actions" style={{padding:"12px 20px",borderTop:"1px solid var(--line)"}}>
              <button className="secondary" onClick={()=>setCampusModal(false)}>Cancel</button>
              <button className="primary" onClick={saveCampus} disabled={!cf.name}>Save campus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
