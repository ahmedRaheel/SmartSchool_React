import { useState } from "react";
import { Modal, Field, Input, Select, DataTable, ActionCell, ModalActions, StatusPill } from "./_helpers";

interface Subject { id: string; name: string; code: string; department: string; isElective: boolean; isActive: boolean; }

const MOCK: Subject[] = [
  { id: "1", name: "Mathematics",       code: "MATH-01", department: "Mathematics",    isElective: false, isActive: true },
  { id: "2", name: "Physics",           code: "SCI-01",  department: "Sciences",       isElective: false, isActive: true },
  { id: "3", name: "Chemistry",         code: "SCI-02",  department: "Sciences",       isElective: false, isActive: true },
  { id: "4", name: "English Language",  code: "LANG-01", department: "Languages",      isElective: false, isActive: true },
  { id: "5", name: "Computer Science",  code: "CS-01",   department: "CS",             isElective: false, isActive: true },
  { id: "6", name: "History",           code: "SOC-01",  department: "Social Studies", isElective: false, isActive: true },
  { id: "7", name: "Fine Arts",         code: "ART-01",  department: "Languages",      isElective: true,  isActive: true },
];

const DEPTS = ["Mathematics","Sciences","Languages","Social Studies","CS"];
const empty = { name: "", code: "", department: "", isElective: false, isActive: true };

export function SubjectsTab() {
  const [rows, setRows] = useState<Subject[]>(MOCK);
  const [q, setQ]       = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase())
  );

  function openAdd()         { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: Subject) { setEditing(r); setForm({ name:r.name,code:r.code,department:r.department,isElective:r.isElective,isActive:r.isActive }); setOpen(true); }
  function remove(r: Subject) { if (confirm(`Delete "${r.name}"?`)) setRows(p => p.filter(x => x.id !== r.id)); }

  async function save() {
    if (!form.name || !form.code) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (editing) setRows(p => p.map(x => x.id === editing.id ? {...x,...form} : x));
    else setRows(p => [...p, { id: Date.now().toString(), ...form }]);
    setSaving(false); setOpen(false);
  }

  const f = (k: keyof typeof form) => (v: string | boolean) => setForm(p => ({...p,[k]:v}));

  return (
    <>
      <DataTable headers={["Subject","Code","Department","Elective","Status","Actions"]} onSearch={setQ} onAdd={openAdd} addLabel="Add Subject">
        {filtered.map(r => (
          <tr key={r.id}>
            <td><b>{r.name}</b></td>
            <td><code style={{fontSize:11}}>{r.code}</code></td>
            <td>{r.department}</td>
            <td><span className={`status-pill ${r.isElective?"info":"gray"}`}>{r.isElective?"Yes":"No"}</span></td>
            <td><StatusPill active={r.isActive} /></td>
            <td><ActionCell onEdit={() => openEdit(r)} onDelete={() => remove(r)} /></td>
          </tr>
        ))}
      </DataTable>

      <Modal open={open} title={editing ? "Edit Subject" : "Add Subject"} onClose={() => setOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <Field label="Subject Name" required><Input value={form.name} onChange={f("name")} placeholder="e.g. Mathematics" /></Field>
            <Field label="Subject Code" required><Input value={form.code} onChange={v => f("code")(v.toUpperCase())} placeholder="e.g. MATH-01" /></Field>
            <Field label="Department">
              <Select value={form.department} onChange={f("department")}>
                <option value="">Select department</option>
                {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.isActive?"1":"0"} onChange={v => f("isActive")(v==="1")}>
                <option value="1">Active</option><option value="0">Inactive</option>
              </Select>
            </Field>
            <Field label="Is Elective?">
              <Select value={form.isElective?"1":"0"} onChange={v => f("isElective")(v==="1")}>
                <option value="0">No — Core subject</option>
                <option value="1">Yes — Elective</option>
              </Select>
            </Field>
          </div>
        </div>
        <ModalActions onCancel={() => setOpen(false)} onSave={save} saving={saving} disabled={!form.name||!form.code} />
      </Modal>
    </>
  );
}
