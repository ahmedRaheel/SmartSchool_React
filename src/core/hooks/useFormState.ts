/**
 * useFormState — universal form state with field-level validation.
 *
 * Usage:
 *   const { form, setField, setFieldValue, reset, errors, touched,
 *           validate, clearError, hasError, error, setError } = useFormState(INITIAL, RULES);
 *
 * RULES: { fieldKey: (value, form) => "error message" | null }
 *
 * In JSX:
 *   <label className={`human-field${hasError("name") ? " field-invalid" : ""}${form.name ? " field-filled" : ""}`}>
 *     <span>Name <i className="required-mark">*</i></span>
 *     <input value={form.name} onChange={setField("name")} onBlur={touchField("name")} />
 *     {hasError("name") && <span className="field-error-msg">{errors.name}</span>}
 *   </label>
 */
import { useState, useCallback, useMemo } from "react";

type Rule<T> = (value: any, form: T) => string | null;
type Rules<T> = Partial<Record<keyof T, Rule<T>>>;
type FieldErrors<T> = Partial<Record<keyof T, string>>;

export function useFormState<T extends Record<string, any>>(
  initial: T,
  rules: Rules<T> = {},
) {
  const [form,    setForm]    = useState<T>(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [error,   setError]   = useState("");   // form-level error
  const [dirty,   setDirty]   = useState(false);

  // Compute field errors for touched fields
  const errors = useMemo<FieldErrors<T>>(() => {
    const out: FieldErrors<T> = {};
    for (const [key, rule] of Object.entries(rules) as [keyof T, Rule<T>][]) {
      if (touched[key]) {
        const msg = rule(form[key], form);
        if (msg) out[key] = msg;
      }
    }
    return out;
  }, [form, touched, rules]);

  // All errors (for submit validation)
  const allErrors = useMemo<FieldErrors<T>>(() => {
    const out: FieldErrors<T> = {};
    for (const [key, rule] of Object.entries(rules) as [keyof T, Rule<T>][]) {
      const msg = rule(form[key], form);
      if (msg) out[key] = msg;
    }
    return out;
  }, [form, rules]);

  const hasError = useCallback((key: keyof T) => !!errors[key], [errors]);
  const hasAnyError = Object.keys(allErrors).length > 0;

  const setField = useCallback(
    (key: keyof T) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        setDirty(true);
        setError("");
      },
    [],
  );

  const setFieldValue = useCallback(
    (key: keyof T, value: any) => {
      setForm(p => ({ ...p, [key]: value }));
      setDirty(true);
      setError("");
    },
    [],
  );

  const touchField = useCallback(
    (key: keyof T) => () => setTouched(p => ({ ...p, [key]: true })),
    [],
  );

  /** Touch all fields to reveal all errors before submit */
  const touchAll = useCallback(() => {
    const all: Partial<Record<keyof T, boolean>> = {};
    for (const key of Object.keys(rules) as (keyof T)[]) all[key] = true;
    setTouched(all);
  }, [rules]);

  /** Returns true if valid, false + touches all fields if not */
  const validate = useCallback((): boolean => {
    touchAll();
    if (hasAnyError) {
      setError("Please fix the highlighted fields.");
      return false;
    }
    return true;
  }, [touchAll, hasAnyError]);

  const clearError = useCallback((key?: keyof T) => {
    if (key) {
      setTouched(p => ({ ...p, [key]: false }));
    } else {
      setError("");
    }
  }, []);

  const reset = useCallback(() => {
    setForm(initial);
    setTouched({});
    setError("");
    setDirty(false);
  }, [initial]);

  return {
    form, setForm,
    setField, setFieldValue, touchField, touchAll,
    errors, allErrors, hasError, hasAnyError,
    validate, clearError,
    error, setError,
    touched, dirty, reset,
  };
}

// ── Built-in validators ──────────────────────────────────────────────────────
// Phone + CNIC use the canonical validators from PakistanFields for format consistency.
import {
  validatePkPhone as _phone,
  validateEmail   as _email,
  validateCnic    as _cnic,
  validateUrl     as _url,
} from "../../components/ui/PakistanFields";

export const Validators = {
  required:    (label = "This field") => (v: any) =>
    !v || !String(v).trim() ? `${label} is required` : null,

  minLen: (n: number, label = "Value") => (v: any) =>
    String(v ?? "").length < n ? `${label} must be at least ${n} characters` : null,

  maxLen: (n: number, label = "Value") => (v: any) =>
    String(v ?? "").length > n ? `${label} cannot exceed ${n} characters` : null,

  /** Pakistani phone — landline (0XX-XXXXXXXX) or mobile (03XX-XXXXXXX) */
  pkPhone: (label = "Phone") => (v: any) => {
    if (!v || !String(v).trim()) return null;
    return _phone(String(v)) || null;
  },

  /** Pakistani mobile only (03XX-XXXXXXX) */
  pkMobile: (label = "Mobile") => (v: any) => {
    if (!v || !String(v).trim()) return null;
    const err = _phone(String(v));
    if (err) return err;
    const digits = String(v).replace(/\D/g, "");
    return !digits.startsWith("03") ? `${label} must be a mobile number starting with 03` : null;
  },

  /** Pakistani CNIC — 13 digits, format 00000-0000000-0 */
  pkCnic: (label = "CNIC") => (v: any) => {
    if (!v || !String(v).trim()) return null;
    return _cnic(String(v)) || null;
  },

  email: (label = "Email") => (v: any) => {
    if (!v || !String(v).trim()) return null;
    return _email(String(v)) || null;
  },

  url: (label = "URL") => (v: any) => {
    if (!v || !String(v).trim()) return null;
    return _url(String(v)) || null;
  },

  numeric: (label = "Value") => (v: any) =>
    v && isNaN(Number(v)) ? `${label} must be a number` : null,

  positiveNum: (label = "Value") => (v: any) =>
    v && (isNaN(Number(v)) || Number(v) <= 0) ? `${label} must be a positive number` : null,

  dateNotPast: (label = "Date") => (v: any) =>
    v && new Date(v) < new Date(new Date().toDateString()) ? `${label} cannot be in the past` : null,
};
