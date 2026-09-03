/**
 * EditModal — generic edit/create modal for any entity.
 * Renders a form from a field definition and calls onSave with the updated data.
 */
import { useState } from "react";
import { PkPhoneInput, PkMobileInput, PkEmailInput, PkWebsiteInput, PkCnicInput, PkCitySelect, PkProvinceSelect, PkCountrySelect } from "./PakistanFields";
import { X, Save } from "lucide-react";

export interface EditField {
  key:      string;
  label:    string;
  type?:    "text" | "email" | "number" | "date" | "select" | "textarea" | "tel"
            | "pk-phone" | "pk-mobile" | "pk-email" | "pk-website" | "pk-cnic" | "pk-city" | "pk-province" | "pk-country";
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  wide?:    boolean;
  readOnly?: boolean;
  provinceKey?: string; // for pk-city: key of the province field to filter cities
}

interface Props {
  title:    string;
  item:     Record<string, any> | null;
  fields:   EditField[];
  onSave:   (data: Record<string, any>) => Promise<void> | void;
  onClose:  () => void;
  isCreate?: boolean;
}

function parseMeta(j?: string | null): Record<string, any> {
  try { return JSON.parse(j ?? "{}"); } catch { return {}; }
}

export function EditModal({ title, item, fields, onSave, onClose, isCreate }: Props) {
  const meta    = parseMeta(item?.metadataJson);
  const merged  = { ...item, ...meta };
  const initial = fields.reduce((acc, f) => ({ ...acc, [f.key]: merged[f.key] ?? "" }), {} as Record<string, any>);

  const [form, setForm]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function submit() {
    const missing = fields.filter(f => f.required && !form[f.key]?.toString().trim());
    if (missing.length) { setError(`${missing.map(f => f.label).join(", ")} ${missing.length > 1 ? "are" : "is"} required`); return; }
    setSaving(true); setError("");
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e?.message ?? "Failed to save"); }
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(600px,96vw)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="modal-head" style={{ position: "sticky", top: 0, background: "var(--surface)", zIndex: 1, borderRadius: "var(--r-xl) var(--r-xl) 0 0" }}>
          <div>
            <h2 style={{ fontSize: 17 }}>{isCreate ? `New ${title}` : `Edit ${title}`}</h2>
            {item?.name && !isCreate && <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>{item.name}</p>}
          </div>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <div className="human-form">
          <div className="human-form-grid">
            {fields.map(f => (
              <label key={f.key} className={`human-field${f.wide ? " field-wide" : ""}`}>
                <span>{f.label}{f.required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}</span>
                {f.type === "pk-phone" ? (
                  <PkPhoneInput label="" value={form[f.key] ?? ""} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} required={f.required} />
                ) : f.type === "pk-email" ? (
                  <PkEmailInput label="" value={form[f.key] ?? ""} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} required={f.required} />
                ) : f.type === "pk-cnic" ? (
                  <PkCnicInput label="" value={form[f.key] ?? ""} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} required={f.required} />
                ) : f.type === "pk-province" ? (
                  <PkProvinceSelect label="" value={form[f.key] ?? ""} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} required={f.required} />
                ) : f.type === "pk-city" ? (
                  <PkCitySelect label="" value={form[f.key] ?? ""} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} province={f.provinceKey ? form[f.provinceKey] : undefined} required={f.required} />
                ) : f.type === "pk-country" ? (
                  <PkCountrySelect label="" value={form[f.key] ?? "Pakistan"} onChange={(v) => setForm(p => ({ ...p, [f.key]: v }))} required={f.required} />
                ) : f.type === "select" ? (
                  <select value={form[f.key] ?? ""} onChange={set(f.key)} disabled={f.readOnly}>
                    <option value="">— Select —</option>
                    {(f.options ?? []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea value={form[f.key] ?? ""} onChange={set(f.key)} placeholder={f.placeholder} readOnly={f.readOnly} />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={form[f.key] ?? ""}
                    onChange={set(f.key)}
                    placeholder={f.placeholder}
                    readOnly={f.readOnly}
                  />
                )}
              </label>
            ))}
          </div>
          {error && <div style={{ color: "var(--danger)", fontSize: 12, padding: "6px 0" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "flex-end", gap: 8, position: "sticky", bottom: 0, background: "var(--surface)" }}>
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={submit} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={13} /> {saving ? "Saving…" : isCreate ? `Create ${title}` : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
