import { useState } from "react";
import { Modal, Field, Input, Select, DataTable, ActionCell, ModalActions, StatusPill } from "./_helpers";

interface LV { id: string; type: string; code: string; name: string; sortOrder: number; isActive: boolean; }

const MOCK: LV[] = [
  { id:"1", type:"GENDER",      code:"MALE",   name:"Male",     sortOrder:1, isActive:true },
  { id:"2", type:"GENDER",      code:"FEMALE", name:"Female",   sortOrder:2, isActive:true },
  { id:"3", type:"BLOOD_GROUP", code:"A+",     name:"A Positive", sortOrder:1, isActive:true },
  { id:"4", type:"BLOOD_GROUP", code:"B+",     name:"B Positive", sortOrder:2, isActive:true },
  { id:"5", type:"LEAVE_TYPE",  code:"ANNUAL", name:"Annual Leave",sortOrder:1,isActive:true },
  { id:"6", type:"LEAVE_TYPE",  code:"SICK",   name:"Sick Leave",  sortOrder:2,isActive:true },
  { id:"7", type:"LEAVE_TYPE",  code:"CASUAL", name:"Casual Leave", sortOrder:3,isActive:true },
];

const TYPES = ["GENDER","BLOOD_GROUP","LEAVE_TYPE","RELIGION","NATIONALITY","RELATIONSHIP"];
const empty = { type:"GENDER", code:"", name:"", sortOrder:"1", isActive:true };

export function LookupTab() {
  const [rows, setRows] = useState<LV[]>(MOCK);
  const [filterType, setFilterType] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LV|null>(null);
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter(r => filterType === "ALL" || r.type === filterType);
  const f = (k: keyof typeof form) => (v: string|boolean) => setForm(p=>({...p,[k]:v}));

  function openAdd() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: LV) { setEditing(r); setForm({type:r.type,code:r.code,name:r.name,sortOrder:String(r.sortOrder),isActive:r.isActive}); setOpen(true); }
  function remove(r: LV) { if(confirm(`Delete "${r.name}"?`)) setRows(p=>p.filter(x=>x.id!==r.id)); }

  async function save() {
    if(!form.code||!form.name) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    if(editing) setRows(p=>p.map(x=>x.id===editing.id?{...x,...form,sortOrder:Number(form.sortOrder)}:x));
    else setRows(p=>[...p,{id:Date.now().toString(),...form,sortOrder:Number(form.sortOrder)}]);
    setSaving(false); setOpen(false);
  }

  return (
    <>
      <div className="surface">
        <div className="surface-head">
          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {["ALL",...TYPES].map(t => (
              <button key={t} className={`table-action ${filterType===t?"active":""}`}
                style={{ background: filterType===t?"var(--navy)":"var(--surface)", color: filterType===t?"#fff":"var(--text)" }}
                onClick={()=>setFilterType(t)}>
                {t}
              </button>
            ))}
          </div>
          <button className="primary" onClick={openAdd}>Add Lookup Value</button>
        </div>
        <div className="table-wrap">
          <table className="premium-table">
            <thead><tr><th>Type</th><th>Code</th><th>Name</th><th>Sort Order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(r=>(
                <tr key={r.id}>
                  <td><span className="status-pill purple">{r.type}</span></td>
                  <td><code style={{fontSize:11}}>{r.code}</code></td>
                  <td><b>{r.name}</b></td>
                  <td>{r.sortOrder}</td>
                  <td><StatusPill active={r.isActive}/></td>
                  <td><ActionCell onEdit={()=>openEdit(r)} onDelete={()=>remove(r)}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} title={editing?"Edit Lookup Value":"Add Lookup Value"} onClose={()=>setOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <Field label="Type" required>
              <Select value={form.type} onChange={f("type")}>
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </Select>
            </Field>
            <Field label="Code" required><Input value={form.code} onChange={v=>f("code")(v.toUpperCase())} placeholder="e.g. MALE"/></Field>
            <Field label="Display Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Male"/></Field>
            <Field label="Sort Order"><Input value={form.sortOrder} onChange={f("sortOrder")} type="number"/></Field>
          </div>
        </div>
        <ModalActions onCancel={()=>setOpen(false)} onSave={save} saving={saving} disabled={!form.code||!form.name}/>
      </Modal>
    </>
  );
}
