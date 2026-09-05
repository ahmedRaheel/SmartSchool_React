/**
 * PakistanFields — validated form components for Pakistani data
 *
 * City, Province, Country values come from the LOOKUP API (typeCode CITY / PROVINCE / COUNTRY).
 * Hardcoded arrays are kept as a fallback when the API returns nothing.
 *
 * All inputs have proper placeholder text.
 */
import React, { useMemo } from "react";
import { useLookupValues } from "../../core/api/queries";

// ── Fallback static data (used if API returns empty) ─────────────────────────
const FB_PROVINCES = [
  "Punjab","Sindh","Khyber Pakhtunkhwa (KPK)","Balochistan",
  "Islamabad Capital Territory","Azad Jammu & Kashmir","Gilgit-Baltistan",
];
const FB_CITIES = [
  "Lahore","Karachi","Islamabad","Rawalpindi","Faisalabad","Multan",
  "Gujranwala","Sialkot","Peshawar","Quetta","Hyderabad","Abbottabad",
  "Bahawalpur","Sargodha","Gujrat","Mardan","Muzaffarabad","Gilgit",
];
const FB_COUNTRIES = [
  "Pakistan","United States","United Kingdom","Canada","Australia",
  "Saudi Arabia","UAE","India","China","Turkey","Germany","France",
  "Afghanistan","Bangladesh","Malaysia","Qatar","Kuwait","Oman","Bahrain","Other",
];

// ── Validation ────────────────────────────────────────────────────────────────
export function validatePkPhone(v: string): string {
  const d = v.replace(/[-\s()]/g, "");
  if (!v.trim())            return "";
  if (!/^0/.test(d))        return "Must start with 0 (e.g. 0300-1234567)";
  if (d.length < 10)        return "Too short — at least 10 digits";
  if (d.length > 11)        return "Too long — max 11 digits";
  if (/^03/.test(d) && d.length !== 11) return "Mobile numbers must be 11 digits (03XX-XXXXXXX)";
  if (!/^0[2-9]\d{8,9}$/.test(d)) return "Invalid — use 0300-1234567 or 021-12345678";
  return "";
}
export function validateEmail(v: string): string {
  if (!v.trim()) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address";
  return "";
}
export function validateUrl(v: string): string {
  if (!v.trim()) return "";
  if (!/^https?:\/\/.+\..+/.test(v) && !v.startsWith("www.")) return "Enter a valid URL (e.g. https://school.edu.pk)";
  return "";
}
export function validateCnic(v: string): string {
  if (!v.trim()) return "";
  if (!/^\d{13}$/.test(v.replace(/-/g,""))) return "CNIC must be 13 digits (e.g. 35202-1234567-8)";
  return "";
}
export function formatPkPhone(v: string): string {
  const d = v.replace(/\D/g,"").slice(0,11);
  if (!d) return "";
  if (d.startsWith("03") && d.length > 4) return d.slice(0,4)+"-"+d.slice(4);
  if (!d.startsWith("03") && d.length > 3) return d.slice(0,3)+"-"+d.slice(3);
  return d;
}
export function formatCnic(v: string): string {
  const d = v.replace(/\D/g,"").slice(0,13);
  if (d.length > 12) return d.slice(0,5)+"-"+d.slice(5,12)+"-"+d.slice(12);
  if (d.length > 5)  return d.slice(0,5)+"-"+d.slice(5);
  return d;
}

// ── Shared field wrapper ──────────────────────────────────────────────────────
function FieldWrapper({ label, required, error, hint, children, wide }: {
  label: string; required?: boolean; error?: string; hint?: string;
  children: React.ReactNode; wide?: boolean;
}) {
  return (
    <label className={`human-field${wide ? " field-wide" : ""}`} style={{ display:"grid", gap:5 }}>
      <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>
        {label}{required && <span style={{ color:"var(--danger)", marginLeft:2 }}>*</span>}
      </span>
      {children}
      {error && <span style={{ fontSize:10, color:"var(--danger)", display:"flex", alignItems:"center", gap:4 }}>⚠ {error}</span>}
      {hint && !error && <span style={{ fontSize:10, color:"var(--muted-2)" }}>{hint}</span>}
    </label>
  );
}

// ── PkPhoneInput ──────────────────────────────────────────────────────────────
interface InputProps {
  label?: string; value: string;
  onChange: (v: string, valid?: boolean) => void;
  required?: boolean; placeholder?: string; wide?: boolean;
}
export function PkPhoneInput({ label="Phone", value, onChange, required, placeholder="03XX-XXXXXXX  or  0XX-XXXXXXXX", wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validatePkPhone(value) : "";
  return (
    <FieldWrapper label={label} required={required} error={err} hint="Format: 0300-1234567 (mobile) or 021-12345678 (landline)" wide={wide}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", fontSize:11, fontWeight:700, color:"var(--muted-2)", pointerEvents:"none" }}>🇵🇰</span>
        <input type="tel" inputMode="numeric" value={value}
          onChange={e => { const f=formatPkPhone(e.target.value); onChange(f, !validatePkPhone(f)); }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          style={{ paddingLeft:30, borderColor:err?"var(--danger)":undefined, boxShadow:err?"0 0 0 3px rgba(220,38,38,.1)":undefined }}
        />
      </div>
    </FieldWrapper>
  );
}

// ── PkMobileInput (alias with mobile placeholder) ────────────────────────────
export function PkMobileInput(props: InputProps) {
  return <PkPhoneInput {...props} label={props.label ?? "Mobile"} placeholder="0300-1234567" />;
}

// ── PkEmailInput ──────────────────────────────────────────────────────────────
export function PkEmailInput({ label="Email", value, onChange, required, placeholder="name@school.edu.pk", wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validateEmail(value) : "";
  return (
    <FieldWrapper label={label} required={required} error={err} wide={wide}>
      <input type="email" value={value}
        onChange={e => { onChange(e.target.value, !validateEmail(e.target.value)); }}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        style={{ borderColor:err?"var(--danger)":undefined, boxShadow:err?"0 0 0 3px rgba(220,38,38,.1)":undefined }}
      />
    </FieldWrapper>
  );
}

// ── PkWebsiteInput ────────────────────────────────────────────────────────────
export function PkWebsiteInput({ label="Website", value, onChange, required, placeholder="https://www.school.edu.pk", wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validateUrl(value) : "";
  return (
    <FieldWrapper label={label} required={required} error={err} hint="Include https:// for the full URL" wide={wide}>
      <input type="url" value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        style={{ borderColor:err?"var(--danger)":undefined, boxShadow:err?"0 0 0 3px rgba(220,38,38,.1)":undefined }}
      />
    </FieldWrapper>
  );
}

// ── PkCnicInput ───────────────────────────────────────────────────────────────
export function PkCnicInput({ label="CNIC / National ID", value, onChange, required, wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validateCnic(value) : "";
  return (
    <FieldWrapper label={label} required={required} error={err} hint="Format: 35202-1234567-8" wide={wide}>
      <input type="text" inputMode="numeric" value={value}
        onChange={e => { const f=formatCnic(e.target.value); onChange(f, !validateCnic(f)); }}
        onBlur={() => setTouched(true)}
        placeholder="35202-1234567-8"
        maxLength={15}
        style={{ borderColor:err?"var(--danger)":undefined, fontFamily:"monospace", letterSpacing:".05em" }}
      />
    </FieldWrapper>
  );
}

// ── Lookup-backed selects ─────────────────────────────────────────────────────
interface SelectProps {
  label?: string; value: string; onChange: (v: string) => void;
  required?: boolean; wide?: boolean;
}

/** Province select — values come from PROVINCE lookup type */
export function PkProvinceSelect({ label="Province / Territory", value, onChange, required, wide }: SelectProps) {
  const { data } = useLookupValues("PROVINCE");
  const opts = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return items.length > 0 ? items.map((i:any) => i.name) : FB_PROVINCES;
  }, [data]);
  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Select province / territory —</option>
        {opts.map((p:string) => <option key={p} value={p}>{p}</option>)}
      </select>
    </FieldWrapper>
  );
}

/** City select — values come from CITY lookup type; optionally filtered by province */
interface CitySelectProps extends SelectProps { province?: string; }
export function PkCitySelect({ label="City", value, onChange, required, province, wide }: CitySelectProps) {
  const { data } = useLookupValues("CITY");
  const opts = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) return FB_CITIES;
    // Backend city items don't have province info — just return all
    return items.map((i:any) => i.name);
  }, [data]);
  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Select city —</option>
        {opts.map((c:string) => <option key={c} value={c}>{c}</option>)}
      </select>
    </FieldWrapper>
  );
}

/** Country select — values come from COUNTRY lookup type */
export function PkCountrySelect({ label="Country", value, onChange, required, wide }: SelectProps) {
  const { data } = useLookupValues("COUNTRY");
  const opts = useMemo(() => {
    const items = Array.isArray(data) ? data : [];
    return items.length > 0 ? items.map((i:any) => i.name) : FB_COUNTRIES;
  }, [data]);
  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value || "Pakistan"} onChange={e => onChange(e.target.value)}>
        {opts.map((c:string) => <option key={c} value={c}>{c}</option>)}
      </select>
    </FieldWrapper>
  );
}

// ── PkAddressBlock — full address with lookup-backed selects ──────────────────
interface AddressValue { street: string; city: string; province: string; country: string; }
interface AddressBlockProps { label?: string; value: AddressValue; onChange: (v: AddressValue) => void; required?: boolean; }

export function PkAddressBlock({ label="Address", value, onChange, required }: AddressBlockProps) {
  const set = (k: keyof AddressValue) => (v: string) => {
    const u = { ...value, [k]: v };
    if (k === "province") u.city = "";
    onChange(u);
  };
  const { data: cityData } = useLookupValues("CITY");
  const { data: provData } = useLookupValues("PROVINCE");
  const { data: ctrData  } = useLookupValues("COUNTRY");
  const cities    = useMemo(() => Array.isArray(cityData) && cityData.length ? cityData.map((i:any)=>i.name) : FB_CITIES,    [cityData]);
  const provinces = useMemo(() => Array.isArray(provData) && provData.length ? provData.map((i:any)=>i.name) : FB_PROVINCES, [provData]);
  const countries = useMemo(() => Array.isArray(ctrData)  && ctrData.length  ? ctrData.map((i:any)=>i.name)  : FB_COUNTRIES, [ctrData]);

  return (
    <div style={{ gridColumn:"1 / -1", display:"grid", gap:10 }}>
      <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>
        {label}{required && <span style={{ color:"var(--danger)", marginLeft:2 }}>*</span>}
      </span>
      <input value={value.street} onChange={e => set("street")(e.target.value)}
        placeholder="Street address, building no., area…" style={{ gridColumn:"1 / -1" }} />
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
        <label className="human-field">
          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>Province</span>
          <select value={value.province} onChange={e => set("province")(e.target.value)}>
            <option value="">— Province —</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="human-field">
          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>City</span>
          <select value={value.city} onChange={e => set("city")(e.target.value)}>
            <option value="">— City —</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="human-field">
          <span style={{ fontSize:11, fontWeight:700, color:"var(--text-2)" }}>Country</span>
          <select value={value.country || "Pakistan"} onChange={e => set("country")(e.target.value)}>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
