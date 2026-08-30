import { useState } from "react";
import { Plus } from "lucide-react";
// No backend endpoint exists for rooms — uses local state only

const INITIAL_ROOMS = [
  { id:"1", name:"Room 101",  type:"Classroom",    capacity:40, floor:"1st" },
  { id:"2", name:"Lab 1",     type:"Laboratory",   capacity:28, floor:"1st" },
  { id:"3", name:"Room 204",  type:"Classroom",    capacity:35, floor:"2nd" },
  { id:"4", name:"Computer Lab", type:"Computer Lab", capacity:30, floor:"2nd" },
  { id:"5", name:"Library",   type:"Library",      capacity:60, floor:"GF"  },
];

export function RoomsTab() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name:"", type:"Classroom", capacity:"40", floor:"1st" });

  function save() {
    if (!form.name) return;
    setRooms(p => [...p, { id: String(Date.now()), ...form, capacity: Number(form.capacity) }]);
    setModal(false); setForm({ name:"", type:"Classroom", capacity:"40", floor:"1st" });
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div><h3>Rooms</h3><p>Classrooms and facilities (local config — no backend endpoint)</p></div>
          <button className="primary" onClick={()=>setModal(true)}><Plus size={14}/> Add room</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Room</th><th>Type</th><th>Capacity</th><th>Floor</th></tr></thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}><td><b>{r.name}</b></td><td>{r.type}</td><td>{r.capacity}</td><td>{r.floor}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {modal && (
        <div className="modal-backdrop" onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div className="modal-card" style={{ width:"min(420px,96vw)" }}>
            <div className="modal-head"><h2>Add room</h2><button className="icon-button" onClick={()=>setModal(false)}>✕</button></div>
            <div className="human-form"><div className="human-form-grid">
              <label className="human-field field-wide"><span>Name *</span><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Room 301"/></label>
              <label className="human-field"><span>Type</span>
                <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}>
                  {["Classroom","Laboratory","Computer Lab","Library","Auditorium","Staff Room"].map(t=><option key={t}>{t}</option>)}
                </select>
              </label>
              <label className="human-field"><span>Capacity</span><input type="number" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))}/></label>
              <label className="human-field"><span>Floor</span><input value={form.floor} onChange={e=>setForm(p=>({...p,floor:e.target.value}))} placeholder="e.g. 2nd"/></label>
            </div></div>
            <div className="modal-actions" style={{ padding:"12px 20px", borderTop:"1px solid var(--line)" }}>
              <button className="secondary" onClick={()=>setModal(false)}>Cancel</button>
              <button className="primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
