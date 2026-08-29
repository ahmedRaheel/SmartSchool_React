import { useState } from "react";
import { Modal, Field, Input, Select, DataTable, ActionCell, ModalActions, StatusPill } from "./_helpers";

interface Room { id: string; name: string; code: string; type: string; capacity: number; isActive: boolean; }

const MOCK: Room[] = [
  { id:"1", name:"Room 101",      code:"RM-101", type:"Classroom",  capacity:45, isActive:true },
  { id:"2", name:"Room 201",      code:"RM-201", type:"Classroom",  capacity:42, isActive:true },
  { id:"3", name:"Science Lab 1", code:"LAB-01", type:"Laboratory", capacity:30, isActive:true },
  { id:"4", name:"Computer Lab",  code:"LAB-02", type:"Laboratory", capacity:35, isActive:true },
  { id:"5", name:"Main Hall",     code:"HALL-01",type:"Hall",       capacity:500,isActive:true },
];

const empty = { name:"",code:"",type:"Classroom",capacity:"40",isActive:true };

export function RoomsTab() {
  const [rows, setRows] = useState<Room[]>(MOCK);
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room|null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const f = (k: keyof typeof form) => (v: string|boolean) => setForm(p=>({...p,[k]:v}));

  function openAdd() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: Room) { setEditing(r); setForm({name:r.name,code:r.code,type:r.type,capacity:String(r.capacity),isActive:r.isActive}); setOpen(true); }
  function remove(r: Room) { if(confirm(`Delete "${r.name}"?`)) setRows(p=>p.filter(x=>x.id!==r.id)); }

  async function save() {
    if(!form.name||!form.code) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    if(editing) setRows(p=>p.map(x=>x.id===editing.id?{...x,...form,capacity:Number(form.capacity)}:x));
    else setRows(p=>[...p,{id:Date.now().toString(),...form,capacity:Number(form.capacity)}]);
    setSaving(false); setOpen(false);
  }

  return (
    <>
      <DataTable headers={["Room","Code","Type","Capacity","Status","Actions"]} onSearch={setQ} onAdd={openAdd} addLabel="Add Room">
        {filtered.map(r=>(
          <tr key={r.id}>
            <td><b>{r.name}</b></td>
            <td><code style={{fontSize:11}}>{r.code}</code></td>
            <td><span className="status-pill info">{r.type}</span></td>
            <td>{r.capacity}</td>
            <td><StatusPill active={r.isActive}/></td>
            <td><ActionCell onEdit={()=>openEdit(r)} onDelete={()=>remove(r)}/></td>
          </tr>
        ))}
      </DataTable>

      <Modal open={open} title={editing?"Edit Room":"Add Room"} onClose={()=>setOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <Field label="Room Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Room 101"/></Field>
            <Field label="Code" required><Input value={form.code} onChange={v=>f("code")(v.toUpperCase())} placeholder="e.g. RM-101"/></Field>
            <Field label="Type" required>
              <Select value={form.type} onChange={f("type")}>
                <option>Classroom</option><option>Laboratory</option><option>Hall</option><option>Library</option><option>Staff Room</option>
              </Select>
            </Field>
            <Field label="Capacity" required><Input value={form.capacity} onChange={f("capacity")} type="number" placeholder="40"/></Field>
          </div>
        </div>
        <ModalActions onCancel={()=>setOpen(false)} onSave={save} saving={saving} disabled={!form.name||!form.code}/>
      </Modal>
    </>
  );
}
