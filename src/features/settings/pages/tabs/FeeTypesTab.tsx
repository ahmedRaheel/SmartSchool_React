import { useState } from "react";
import { Modal, Field, Input, Select, DataTable, ActionCell, ModalActions, StatusPill } from "./_helpers";

interface FeeType { id: string; name: string; code: string; frequency: string; isActive: boolean; }

const MOCK: FeeType[] = [
  { id:"1", name:"Tuition Fee",    code:"TUITION",   frequency:"Monthly", isActive:true  },
  { id:"2", name:"Transport Fee",  code:"TRANSPORT", frequency:"Monthly", isActive:true  },
  { id:"3", name:"Library Fee",    code:"LIBRARY",   frequency:"Annual",  isActive:true  },
  { id:"4", name:"Lab Fee",        code:"LAB",       frequency:"Term",    isActive:true  },
  { id:"5", name:"Sports Fee",     code:"SPORTS",    frequency:"Annual",  isActive:true  },
  { id:"6", name:"Admission Fee",  code:"ADMISSION", frequency:"OneTime", isActive:true  },
];

const empty = { name:"", code:"", frequency:"Monthly", isActive:true };

export function FeeTypesTab() {
  const [rows, setRows] = useState<FeeType[]>(MOCK);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FeeType|null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()));
  const f = (k: keyof typeof form) => (v: string|boolean) => setForm(p=>({...p,[k]:v}));

  function openAdd() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: FeeType) { setEditing(r); setForm({name:r.name,code:r.code,frequency:r.frequency,isActive:r.isActive}); setOpen(true); }
  function remove(r: FeeType) { if(confirm(`Delete "${r.name}"?`)) setRows(p=>p.filter(x=>x.id!==r.id)); }

  async function save() {
    if(!form.name||!form.code) return;
    setSaving(true);
    await new Promise(r=>setTimeout(r,400));
    if(editing) setRows(p=>p.map(x=>x.id===editing.id?{...x,...form}:x));
    else setRows(p=>[...p,{id:Date.now().toString(),...form}]);
    setSaving(false); setOpen(false);
  }

  return (
    <>
      <DataTable headers={["Fee Type","Code","Frequency","Status","Actions"]} onSearch={setQ} onAdd={openAdd} addLabel="Add Fee Type">
        {filtered.map(r=>(
          <tr key={r.id}>
            <td><b>{r.name}</b></td>
            <td><code style={{fontSize:11}}>{r.code}</code></td>
            <td><span className="status-pill info">{r.frequency}</span></td>
            <td><StatusPill active={r.isActive}/></td>
            <td><ActionCell onEdit={()=>openEdit(r)} onDelete={()=>remove(r)}/></td>
          </tr>
        ))}
      </DataTable>

      <Modal open={open} title={editing?"Edit Fee Type":"Add Fee Type"} onClose={()=>setOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <Field label="Fee Type Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Tuition Fee"/></Field>
            <Field label="Code" required><Input value={form.code} onChange={v=>f("code")(v.toUpperCase())} placeholder="e.g. TUITION"/></Field>
            <Field label="Frequency" required>
              <Select value={form.frequency} onChange={f("frequency")}>
                <option>Monthly</option><option>Term</option><option>Annual</option><option>OneTime</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.isActive?"1":"0"} onChange={v=>f("isActive")(v==="1")}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
        </div>
        <ModalActions onCancel={()=>setOpen(false)} onSave={save} saving={saving} disabled={!form.name||!form.code}/>
      </Modal>
    </>
  );
}
