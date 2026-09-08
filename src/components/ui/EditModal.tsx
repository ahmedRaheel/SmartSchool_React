/**
 * EditModal — generic edit form with field-level validation.
 * Supports all field types. Shows inline error messages per field.
 */
import { useState, useRef } from "react";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";

export interface EditField {
  key:          string;
  label:        string;
  type?:        "text" | "email" | "number" | "date" | "select" | "textarea" | "tel"
              | "pk-phone" | "pk-mobile" | "pk-email" | "pk-website" | "pk-cnic"
              | "pk-city" | "pk-province" | "pk-country";
  options?:     { value: string; label: string }[];
  required?:    boolean;
  wide?:        boolean;
  readOnly?:    boolean;
  placeholder?: string;
  hint?:        string;
  maxLength?:   number;
}

interface Props {
  title:    string;
  item:     Record<string, any>;
  fields:   readonly EditField[] | EditField[];
  onSave:   (data: Record<string, any>) => Promise<void>;
  onClose:  () => void;
  isCreate?: boolean;
}

const PK_CITIES    = ["Karachi","Lahore","Islamabad","Rawalpindi","Faisalabad","Multan","Hyderabad","Peshawar","Quetta","Sialkot","Gujranwala","Bahawalpur","Sargodha","Sukkur","Sheikhupura","Sahiwal","Gujrat","Kasur","Okara","Chiniot","Dera Ghazi Khan","Mirpur Khas","Mardan","Abbottabad","Hafizabad","Rahim Yar Khan"];
const PK_PROVINCES = ["Punjab","Sindh","Khyber Pakhtunkhwa","Balochistan","Gilgit-Baltistan","Azad Kashmir","Islamabad Capital Territory"];

type FieldErrors = Record<string, string>;

function validate(fields: readonly EditField[], form: Record<string, any>): FieldErrors {
  const errs: FieldErrors = {};
  for (const f of fields as EditField[]) {
    const val = form[f.key];
    const empty = val === undefined || val === null || String(val).trim() === "";

    if (f.required && empty) {
      errs[f.key] = `${f.label} is required`;
      continue;
    }
    if (!empty) {
      if ((f.type === "email" || f.type === "pk-email") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        errs[f.key] = "Enter a valid email address";
      } else if ((f.type === "pk-phone" || f.type === "pk-mobile" || f.type === "tel") && !/^(\+92|0)?[0-9\-\s]{9,14}$/.test(String(val).replace(/\s/g, ""))) {
        errs[f.key] = "Enter a valid phone number";
      } else if (f.type === "pk-cnic" && !/^\d{5}-\d{7}-\d$/.test(val)) {
        errs[f.key] = "CNIC must be in format 00000-0000000-0";
      } else if (f.type === "number" && isNaN(Number(val))) {
        errs[f.key] = "Must be a valid number";
      } else if (f.maxLength && String(val).length > f.maxLength) {
        errs[f.key] = `Cannot exceed ${f.maxLength} characters`;
      }
    }
  }
  return errs;
}

function FieldInput({ f, val, onChange, onBlur, error, touched }:
  { f: EditField; val: any; onChange: (v: any) => void; onBlur: () => void; error?: string; touched: boolean }) {

  const base = {
    value: val ?? "",
    onChange: (e: React.ChangeEvent<any>) => onChange(e.target.value),
    onBlur,
    disabled: f.readOnly,
    placeholder: f.placeholder,
  };

  if (f.type === "select" && f.options) {
    return (
      <select {...base}>
        <option value="">— Select {f.label.toLowerCase()} —</option>
        {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }
  if (f.type === "pk-city") {
    return (
      <select {...base}>
        <option value="">— Select city —</option>
        {PK_CITIES.map(c => <option key={c}>{c}</option>)}
      </select>
    );
  }
  if (f.type === "pk-province") {
    return (
      <select {...base}>
        <option value="">— Select province —</option>
        {PK_PROVINCES.map(p => <option key={p}>{p}</option>)}
      </select>
    );
  }
  if (f.type === "pk-country") {
    return <input {...base} value="Pakistan" readOnly style={{ color: "var(--muted)", cursor: "default" }}/>;
  }
  if (f.type === "textarea") {
    return <textarea {...base} rows={3} maxLength={f.maxLength}/>;
  }

  const typeMap: Record<string, string> = {
    "pk-phone": "tel", "pk-mobile": "tel", "pk-email": "email",
    "pk-cnic": "text", "pk-website": "url",
    date: "date", number: "number", email: "email", tel: "tel",
  };
  const phMap: Record<string, string> = {
    "pk-phone": "e.g. 042-12345678", "pk-mobile": "e.g. 0300-1234567",
    "pk-email": "name@school.edu.pk", "pk-cnic": "00000-0000000-0",
    "pk-website": "https://school.edu.pk",
  };

  return (
    <input
      {...base}
      type={typeMap[f.type ?? "text"] ?? "text"}
      placeholder={f.placeholder ?? phMap[f.type ?? ""] ?? ""}
      maxLength={f.maxLength}
    />
  );
}

export function EditModal({ title, item, fields, onSave, onClose, isCreate }: Props) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    (fields as EditField[]).forEach(f => { init[f.key] = item[f.key] ?? ""; });
    return init;
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState("");

  function setField(key: string, val: any) {
    setForm(p => ({ ...p, [key]: val }));
    setFormErr("");
  }

  function touchField(key: string) {
    setTouched(p => ({ ...p, [key]: true }));
  }

  const errors = validate(fields, form);
  const fieldErrs: FieldErrors = {};
  for (const [k, v] of Object.entries(errors)) {
    if (touched[k]) fieldErrs[k] = v;
  }

  async function handleSave() {
    // Touch all fields to reveal errors
    const allTouched: Record<string, boolean> = {};
    (fields as EditField[]).forEach(f => { allTouched[f.key] = true; });
    setTouched(allTouched);

    if (Object.keys(errors).length > 0) {
      setFormErr("Please fix the errors below before saving.");
      // Scroll to first error
      return;
    }

    setSaving(true);
    setFormErr("");
    try {
      await onSave(form);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? e?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(600px, 96vw)" }}>

        {/* Header */}
        <div className="modal-head">
          <div>
            <h2>{isCreate ? `Add ${title}` : `Edit ${title}`}</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
              Fields marked with <span style={{ color: "var(--danger)", fontWeight: 800 }}>*</span> are required
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button>
        </div>

        {/* Form */}
        <div className="human-form">
          {/* Form-level error */}
          {formErr && (
            <div className="form-error-banner">
              <AlertTriangle size={15}/>
              {formErr}
            </div>
          )}

          <div className="human-form-grid">
            {(fields as EditField[]).map(f => {
              const err      = fieldErrs[f.key];
              const isFilled = !!form[f.key] && String(form[f.key]).trim() !== "";
              const isInvalid = !!err;

              return (
                <label
                  key={f.key}
                  className={[
                    "human-field",
                    f.wide ? "field-wide" : "",
                    isInvalid ? "field-invalid" : "",
                    isFilled && !isInvalid ? "field-filled" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <span>
                    {f.label}
                    {f.required && <i className="required-mark">*</i>}
                    {f.readOnly && <span style={{ fontSize: 9, marginLeft: 6, color: "var(--muted-2)", fontStyle: "normal", fontWeight: 400 }}>read-only</span>}
                  </span>

                  <FieldInput
                    f={f}
                    val={form[f.key]}
                    onChange={v => setField(f.key, v)}
                    onBlur={() => touchField(f.key)}
                    error={err}
                    touched={!!touched[f.key]}
                  />

                  {/* Inline error */}
                  {err && <span className="field-error-msg">{err}</span>}

                  {/* Hint text */}
                  {f.hint && !err && <span className="field-hint">{f.hint}</span>}

                  {/* Char counter for maxLength fields */}
                  {f.maxLength && isFilled && (
                    <span className={`field-char-counter ${String(form[f.key]).length > f.maxLength ? "over" : ""}`}>
                      {String(form[f.key]).length}/{f.maxLength}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button className="secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button
            className="primary"
            onClick={handleSave}
            disabled={saving}
            style={{ minWidth: 130, justifyContent: "center" }}
          >
            {saving
              ? <><Loader2 size={13} style={{ animation: "spin .7s linear infinite" }}/> Saving…</>
              : <><Save size={13}/> {isCreate ? "Create" : "Save changes"}</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
