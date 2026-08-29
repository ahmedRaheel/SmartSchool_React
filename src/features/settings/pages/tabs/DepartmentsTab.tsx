import { useState } from "react";
import { api } from "../../../../core/api/ApiClient";
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { Modal, Field, Input, Select, DataTable, ActionCell, ModalActions, StatusPill } from "./_helpers";

interface Dept { id: string; name: string; code: string; head: string; isActive: boolean; }

const MOCK: Dept[] = [
  { id: "1", name: "Mathematics",    code: "MATH", head: "Ms. Aisha Siddiqui", isActive: true  },
  { id: "2", name: "Sciences",       code: "SCI",  head: "Mr. Tariq Jameel",   isActive: true  },
  { id: "3", name: "Languages",      code: "LANG", head: "Ms. Zara Khan",      isActive: true  },
  { id: "4", name: "Social Studies", code: "SOC",  head: "Mr. Fahad Ali",      isActive: true  },
  { id: "5", name: "Computer Science",code:"CS",   head: "Dr. Noman Arif",     isActive: true  },
];

const empty = { name: "", code: "", head: "", isActive: true };

export function DepartmentsTab() {
  const { user } = useAuth();
  const tenantId = effectiveTenantId(user);
  const [rows, setRows]       = useState<Dept[]>(MOCK);
  const [q, setQ]             = useState("");
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [form, setForm]       = useState(empty);
  const [saving, setSaving]   = useState(false);

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.code.toLowerCase().includes(q.toLowerCase())
  );

  function openAdd()       { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(r: Dept) { setEditing(r); setForm({ name: r.name, code: r.code, head: r.head, isActive: r.isActive }); setOpen(true); }
  function remove(r: Dept) { if (confirm(`Delete "${r.name}"?`)) setRows(prev => prev.filter(x => x.id !== r.id)); }

  async function save() {
    if (!form.name || !form.code) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    if (editing) {
      setRows(prev => prev.map(x => x.id === editing.id ? { ...x, ...form } : x));
    } else {
      setRows(prev => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setSaving(false);
    setOpen(false);
  }

  const f = (k: keyof typeof form) => (v: string | boolean) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <DataTable
        headers={["Department", "Code", "Head of Department", "Status", "Actions"]}
        onSearch={setQ}
        onAdd={openAdd}
        addLabel="Add Department"
      >
        {filtered.map(r => (
          <tr key={r.id}>
            <td><b>{r.name}</b></td>
            <td><code style={{ fontSize: 11 }}>{r.code}</code></td>
            <td>{r.head || "—"}</td>
            <td><StatusPill active={r.isActive} /></td>
            <td><ActionCell onEdit={() => openEdit(r)} onDelete={() => remove(r)} /></td>
          </tr>
        ))}
      </DataTable>

      <Modal open={open} title={editing ? "Edit Department" : "Add Department"} onClose={() => setOpen(false)}>
        <div className="human-form">
          <div className="human-form-grid">
            <Field label="Department Name" required>
              <Input value={form.name} onChange={f("name")} placeholder="e.g. Mathematics" />
            </Field>
            <Field label="Code" required>
              <Input value={form.code} onChange={v => f("code")(v.toUpperCase())} placeholder="e.g. MATH" />
            </Field>
            <Field label="Head of Department">
              <Input value={form.head} onChange={f("head")} placeholder="Employee name" />
            </Field>
            <Field label="Status">
              <Select value={form.isActive ? "1" : "0"} onChange={v => f("isActive")(v === "1")}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
        </div>
        <ModalActions onCancel={() => setOpen(false)} onSave={save} saving={saving} disabled={!form.name || !form.code} />
      </Modal>
    </>
  );
}
