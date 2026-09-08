/**
 * EditModal — generic edit form driven by a field descriptor array.
 * Handles all field types, loading state, and error feedback.
 */
import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";

export interface EditField {
  key:       string;
  label:     string;
  type?:     "text" | "email" | "number" | "date" | "select" | "textarea" | "tel"
           | "pk-phone" | "pk-mobile" | "pk-email" | "pk-website" | "pk-cnic"
           | "pk-city" | "pk-province" | "pk-country";
  options?:  { value: string; label: string }[];
  required?: boolean;
  wide?:     boolean;
  readOnly?: boolean;
  placeholder?: string;
}

interface Props {
  title:   string;
  item:    Record<string, any>;
  fields:  readonly EditField[] | EditField[];
  onSave:  (data: Record<string, any>) => Promise<void>;
  onClose: () => void;
  isCreate?: boolean;
}

const PK_CITIES = ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Hyderabad","Peshawar","Quetta","Sialkot","Gujranwala","Bahawalpur","Sargodha","Sukkur","Larkana","Sheikhupura","Rahim Yar Khan","Jhang","Gujrat","Dera Ghazi Khan","Mirpur Khas","Nawabshah","Mingora","Mardan","Abbottabad","Okara","Sahiwal","Kasur","Hafizabad","Chiniot"];
const PK_PROVINCES = ["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Gilgit-Baltistan","Azad Kashmir","Islamabad Capital Territory"];

function FieldInput({ f, val, onChange }: { f: EditField; val: any; onChange: (v: any) => void }) {
  const base = { value: val ?? "", onChange: (e: React.ChangeEvent<any>) => onChange(e.target.value) };

  if (f.type === "select" && f.options) {
    return (
      <select {...base} disabled={f.readOnly}>
        <option value="">— Select —</option>
        {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (f.type === "textarea") {
    return <textarea {...base} placeholder={f.placeholder} rows={3} readOnly={f.readOnly}/>;
  }
  if (f.type === "pk-city") {
    return (
      <select {...base} disabled={f.readOnly}>
        <option value="">— Select city —</option>
        {PK_CITIES.map(c => <option key={c}>{c}</option>)}
      </select>
    );
  }
  if (f.type === "pk-province") {
    return (
      <select {...base} disabled={f.readOnly}>
        <option value="">— Select province —</option>
        {PK_PROVINCES.map(p => <option key={p}>{p}</option>)}
      </select>
    );
  }
  if (f.type === "pk-country") {
    return <input {...base} value="Pakistan" readOnly style={{ color:"var(--muted)" }}/>;
  }

  const typeMap: Record<string, string> = {
    "pk-phone": "tel", "pk-mobile": "tel", "pk-email": "email",
    "pk-cnic": "text", "pk-website": "url",
    "date": "date", "number": "number", "email": "email", "tel": "tel",
  };
  const htmlType = typeMap[f.type ?? "text"] ?? "text";
  const phMap: Record<string, string> = {
    "pk-phone":  "e.g. 042-12345678",
    "pk-mobile": "e.g. 0300-1234567",
    "pk-email":  "name@school.edu.pk",
    "pk-cnic":   "00000-0000000-0",
    "pk-website":"https://school.edu.pk",
  };

  return (
    <input
      {...base}
      type={htmlType}
      placeholder={f.placeholder ?? phMap[f.type ?? ""] ?? ""}
      readOnly={f.readOnly}
    />
  );
}

export function EditModal({ title, item, fields, onSave, onClose, isCreate }: Props) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    (fields as EditField[]).forEach(f => { init[f.key] = item[f.key] ?? ""; });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function setField(key: string, val: any) { setForm(p => ({ ...p, [key]: val })); }

  async function handleSave() {
    const missing = (fields as EditField[]).filter(f => f.required && !form[f.key]);
    if (missing.length) { setError(`Required: ${missing.map(f => f.label).join(", ")}`); return; }
    setError(""); setSaving(true);
    try { await onSave(form); }
    catch (e: any) { setError(e?.response?.data?.message ?? e?.message ?? "Failed to save."); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(580px, 96vw)" }}>
        {/* Header */}
        <div className="modal-head">
          <h2>{isCreate ? `Add ${title}` : `Edit ${title}`}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button>
        </div>

        {/* Fields */}
        <div className="human-form">
          <div className="human-form-grid">
            {(fields as EditField[]).map(f => (
              <label
                key={f.key}
                className={`human-field${f.wide ? " field-wide" : ""}`}
              >
                <span>
                  {f.label}
                  {f.required && <i className="required-mark"> *</i>}
                  {f.readOnly && <span style={{ fontSize:9, marginLeft:6, color:"var(--muted-2)", fontStyle:"normal" }}>read-only</span>}
                </span>
                <FieldInput f={f} val={form[f.key]} onChange={v => setField(f.key, v)}/>
              </label>
            ))}
          </div>
          {error && (
            <div className="callout danger" style={{ fontSize:12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button className="secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 120, justifyContent:"center" }}
          >
            {saving
              ? <><Loader2 size={13} style={{ animation:"spin .7s linear infinite" }}/> Saving…</>
              : <><Save size={13}/> {isCreate ? "Create" : "Save changes"}</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
