/**
 * EditModal — generic edit form with field-level validation.
 * Pakistani phone, mobile, CNIC, email all validated with proper format rules.
 * Shows inline error messages per field, touched-on-blur, touch-all-on-submit.
 */
import { useState } from "react";
import { X, Save, Loader2, AlertTriangle } from "lucide-react";
import {
  validatePkPhone, validateEmail, validateCnic, validateUrl,
  formatPkPhone, formatCnic,
} from "./PakistanFields";

// ── Field descriptor ──────────────────────────────────────────────────────────
export interface EditField {
  key:          string;
  label:        string;
  type?:        "text" | "email" | "number" | "date" | "select" | "textarea" | "tel"
              | "pk-phone" | "pk-mobile" | "pk-email" | "pk-website" | "pk-cnic"
              | "pk-city"  | "pk-province" | "pk-country";
  options?:     { value: string; label: string }[];
  required?:    boolean;
  wide?:        boolean;
  readOnly?:    boolean;
  placeholder?: string;
  hint?:        string;
  maxLength?:   number;
}

interface Props {
  title:     string;
  item:      Record<string, any>;
  fields:    readonly EditField[] | EditField[];
  onSave:    (data: Record<string, any>) => Promise<void>;
  onClose:   () => void;
  isCreate?: boolean;
}

// ── City / Province lists (must match PakistanFields.tsx) ────────────────────
const PK_CITIES = [
  "Lahore","Karachi","Islamabad","Rawalpindi","Faisalabad","Multan",
  "Gujranwala","Sialkot","Peshawar","Quetta","Hyderabad","Abbottabad",
  "Bahawalpur","Sargodha","Gujrat","Mardan","Muzaffarabad","Gilgit",
  "Mirpur Khas","Sukkur","Larkana","Sheikhupura","Sahiwal","Okara",
  "Rahim Yar Khan","Jhang","Chiniot","Kasur","Hafizabad","Dera Ghazi Khan",
];
const PK_PROVINCES = [
  "Punjab","Sindh","Khyber Pakhtunkhwa (KPK)","Balochistan",
  "Islamabad Capital Territory","Azad Jammu & Kashmir","Gilgit-Baltistan",
];

// ── Per-field validator ───────────────────────────────────────────────────────
function getFieldError(f: EditField, val: any): string | null {
  const v  = val !== undefined && val !== null ? String(val).trim() : "";
  const empty = v === "";

  // Required check first
  if (f.required && empty) return `${f.label} is required`;

  // Format checks only when field has a value
  if (!empty) {
    switch (f.type) {
      case "pk-phone":   return validatePkPhone(v) || null;
      case "pk-mobile":  return validatePkPhone(v) || null;
      case "tel":        return validatePkPhone(v) || null;
      case "pk-email":
      case "email":      return validateEmail(v) || null;
      case "pk-cnic":    return validateCnic(v) || null;
      case "pk-website": return validateUrl(v) || null;
      case "number":
        if (isNaN(Number(v))) return `${f.label} must be a valid number`;
        break;
    }
    if (f.maxLength && v.length > f.maxLength)
      return `${f.label} cannot exceed ${f.maxLength} characters`;
  }
  return null;
}

// ── Placeholder + hint per type ───────────────────────────────────────────────
const PLACEHOLDERS: Record<string, string> = {
  "pk-phone":   "03XX-XXXXXXX or 0XX-XXXXXXXX",
  "pk-mobile":  "03XX-XXXXXXX",
  "pk-email":   "name@school.edu.pk",
  "pk-cnic":    "35202-1234567-8",
  "pk-website": "https://school.edu.pk",
};
const HINTS: Record<string, string> = {
  "pk-phone":  "Mobile: 03XX-XXXXXXX · Landline: 0XX-XXXXXXXX",
  "pk-mobile": "Format: 03XX-XXXXXXX (11 digits)",
  "pk-cnic":   "Format: 35202-1234567-8 (13 digits, auto-formatted)",
};

// ── Input renderer ────────────────────────────────────────────────────────────
function FieldInput({ f, val, onChange, onBlur }: {
  f: EditField; val: any;
  onChange: (v: any) => void;
  onBlur: () => void;
}) {
  const strVal = val ?? "";

  // Select with options
  if (f.type === "select" && f.options) {
    return (
      <select value={strVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} disabled={f.readOnly}>
        <option value="">— Select {f.label.toLowerCase()} —</option>
        {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  // City select
  if (f.type === "pk-city") {
    return (
      <select value={strVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} disabled={f.readOnly}>
        <option value="">— Select city —</option>
        {PK_CITIES.map(c => <option key={c}>{c}</option>)}
      </select>
    );
  }

  // Province select
  if (f.type === "pk-province") {
    return (
      <select value={strVal} onChange={e => onChange(e.target.value)} onBlur={onBlur} disabled={f.readOnly}>
        <option value="">— Select province —</option>
        {PK_PROVINCES.map(p => <option key={p}>{p}</option>)}
      </select>
    );
  }

  // Country (fixed)
  if (f.type === "pk-country") {
    return <input type="text" value="Pakistan" readOnly style={{ color: "var(--muted)", cursor: "default", borderStyle: "dashed" }}/>;
  }

  // Textarea
  if (f.type === "textarea") {
    return (
      <textarea
        value={strVal}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        rows={3}
        maxLength={f.maxLength}
        placeholder={f.placeholder}
        readOnly={f.readOnly}
      />
    );
  }

  // Pakistani phone — auto-format on change
  if (f.type === "pk-phone" || f.type === "pk-mobile") {
    return (
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none", lineHeight: 1,
        }}>🇵🇰</span>
        <input
          type="tel"
          inputMode="numeric"
          value={strVal}
          onChange={e => onChange(formatPkPhone(e.target.value))}
          onBlur={onBlur}
          placeholder={f.placeholder ?? PLACEHOLDERS[f.type]}
          maxLength={12}
          readOnly={f.readOnly}
          style={{ paddingLeft: 30 }}
        />
      </div>
    );
  }

  // CNIC — auto-format on change
  if (f.type === "pk-cnic") {
    return (
      <input
        type="text"
        inputMode="numeric"
        value={strVal}
        onChange={e => onChange(formatCnic(e.target.value))}
        onBlur={onBlur}
        placeholder={f.placeholder ?? "35202-1234567-8"}
        maxLength={15}
        readOnly={f.readOnly}
      />
    );
  }

  // Generic input
  const typeMap: Record<string, string> = {
    "pk-email": "email", email: "email",
    "pk-website": "url", url: "url",
    date: "date", number: "number", tel: "tel",
  };

  return (
    <input
      type={typeMap[f.type ?? "text"] ?? "text"}
      value={strVal}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={f.placeholder ?? PLACEHOLDERS[f.type ?? ""] ?? ""}
      maxLength={f.maxLength}
      readOnly={f.readOnly}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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

  // Compute errors — only show for touched fields
  const allErrors: Record<string, string> = {};
  for (const f of fields as EditField[]) {
    const err = getFieldError(f, form[f.key]);
    if (err) allErrors[f.key] = err;
  }

  const visibleErrors: Record<string, string> = {};
  for (const [k, v] of Object.entries(allErrors)) {
    if (touched[k]) visibleErrors[k] = v;
  }

  async function handleSave() {
    // Touch all fields at once
    const allTouched: Record<string, boolean> = {};
    (fields as EditField[]).forEach(f => { allTouched[f.key] = true; });
    setTouched(allTouched);

    if (Object.keys(allErrors).length > 0) {
      setFormErr("Please correct the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    setFormErr("");
    try {
      await onSave(form);
    } catch (e: any) {
      setFormErr(e?.response?.data?.message ?? e?.message ?? "Save failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const errorCount = Object.keys(allErrors).length;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: "min(600px, 96vw)" }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="modal-head">
          <div>
            <h2>{isCreate ? `Add ${title}` : `Edit ${title}`}</h2>
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>
              Fields marked <span style={{ color: "var(--danger)", fontWeight: 800 }}>*</span> are required
            </p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={16}/></button>
        </div>

        {/* ── Fields ─────────────────────────────────────────────────────── */}
        <div className="human-form">
          {formErr && (
            <div className="form-error-banner">
              <AlertTriangle size={15}/>
              <span>{formErr}</span>
            </div>
          )}

          <div className="human-form-grid">
            {(fields as EditField[]).map(f => {
              const err     = visibleErrors[f.key];
              const val     = form[f.key];
              const filled  = val !== undefined && val !== null && String(val).trim() !== "";
              const invalid = !!err;

              return (
                <label
                  key={f.key}
                  className={[
                    "human-field",
                    f.wide ? "field-wide" : "",
                    invalid          ? "field-invalid" : "",
                    filled && !invalid ? "field-filled" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {/* Label */}
                  <span>
                    {f.label}
                    {f.required && <i className="required-mark">*</i>}
                    {f.readOnly && (
                      <span style={{ fontSize: 9, marginLeft: 6, color: "var(--muted-2)", fontStyle: "normal", fontWeight: 400 }}>
                        read-only
                      </span>
                    )}
                  </span>

                  {/* Input */}
                  <FieldInput
                    f={f}
                    val={val}
                    onChange={v => setField(f.key, v)}
                    onBlur={() => touchField(f.key)}
                  />

                  {/* Inline error */}
                  {err && <span className="field-error-msg">{err}</span>}

                  {/* Hint (only when no error) */}
                  {!err && (f.hint ?? HINTS[f.type ?? ""]) && (
                    <span className="field-hint">{f.hint ?? HINTS[f.type ?? ""]}</span>
                  )}

                  {/* Char counter */}
                  {f.maxLength && filled && (
                    <span className={`field-char-counter${String(val).length > f.maxLength ? " over" : ""}`}>
                      {String(val).length}/{f.maxLength}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="modal-actions">
          {errorCount > 0 && Object.keys(touched).length > 0 && (
            <span style={{ fontSize: 11, color: "var(--danger)", marginRight: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <AlertTriangle size={12}/>
              {errorCount} field{errorCount > 1 ? "s" : ""} need{errorCount === 1 ? "s" : ""} attention
            </span>
          )}
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
