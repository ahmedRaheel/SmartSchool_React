/**
 * PakistanFields — validated, auto-formatted form inputs for Pakistani data.
 *
 * Every component:
 *  - Auto-formats as you type (phone → 0300-1234567, CNIC → 35202-1234567-8)
 *  - Shows format error on blur (after user has interacted)
 *  - Shows "required" error on blur when required + empty
 *  - Shows 🇵🇰 flag / format hint below the field
 *  - Applies .field-invalid CSS class for the red border/background
 *
 * Exported validators (use in save() handlers):
 *   validatePkPhone(v) → "" if valid | error string if invalid
 *   validateEmail(v)   → "" if valid | error string if invalid
 *   validateCnic(v)    → "" if valid | error string if invalid
 *   validateUrl(v)     → "" if valid | error string if invalid
 */
import React, { useMemo } from "react";
import { useCities, useCountries, useProvinces } from "../../core/api/queries";

/* ─── Fallback static data ──────────────────────────────────────────────────── */
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

/* ─── Validators ────────────────────────────────────────────────────────────── */
export function validatePkPhone(v: string): string {
  const d = v.replace(/[-\s()]/g, "");
  if (!v.trim()) return "";
  if (!/^0/.test(d))       return "Must start with 0 (e.g. 0300-1234567)";
  if (d.length < 10)        return "Too short — at least 10 digits required";
  if (d.length > 11)        return "Too long — maximum 11 digits";
  if (/^03/.test(d) && d.length !== 11) return "Mobile numbers must be 11 digits (03XX-XXXXXXX)";
  if (!/^0[2-9]\d{8,9}$/.test(d)) return "Invalid format — use 0300-1234567 or 021-12345678";
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
  if (!/^\d{13}$/.test(v.replace(/-/g, ""))) return "CNIC must be 13 digits (e.g. 35202-1234567-8)";
  return "";
}

/* ─── Formatters ────────────────────────────────────────────────────────────── */
export function formatPkPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.startsWith("03") && d.length > 4) return d.slice(0, 4) + "-" + d.slice(4);
  if (!d.startsWith("03") && d.length > 3) return d.slice(0, 3) + "-" + d.slice(3);
  return d;
}
export function formatCnic(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length > 12) return d.slice(0, 5) + "-" + d.slice(5, 12) + "-" + d.slice(12);
  if (d.length > 5)  return d.slice(0, 5) + "-" + d.slice(5);
  return d;
}

/* ─── Shared FieldWrapper ───────────────────────────────────────────────────── */
function FieldWrapper({ label, required, error, hint, children, wide }: {
  label: string; required?: boolean; error?: string;
  hint?: string; children: React.ReactNode; wide?: boolean;
}) {
  const invalid = !!error;
  return (
    <label className={[
      "human-field",
      wide     ? "field-wide"   : "",
      invalid  ? "field-invalid": "",
    ].filter(Boolean).join(" ")}>
      <span>
        {label}
        {required && <i className="required-mark">*</i>}
      </span>
      {children}
      {error && <span className="field-error-msg">{error}</span>}
      {!error && hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/* ─── Input props shared by all field components ───────────────────────────── */
interface InputProps {
  label?:       string;
  value:        string;
  onChange:     (v: string, valid?: boolean) => void;
  required?:    boolean;
  placeholder?: string;
  wide?:        boolean;
}

/* ─── PkPhoneInput ──────────────────────────────────────────────────────────── */
export function PkPhoneInput({
  label = "Phone", value, onChange, required,
  placeholder = "03XX-XXXXXXX  or  0XX-XXXXXXXX", wide,
}: InputProps) {
  const [touched, setTouched] = React.useState(false);

  const err = React.useMemo(() => {
    if (!touched && !value) return "";
    if (required && !value.trim()) return `${label} is required`;
    return validatePkPhone(value);
  }, [value, touched, required, label]);

  return (
    <FieldWrapper label={label} required={required} error={err}
      hint="Format: 0300-1234567 (mobile) or 021-12345678 (landline)" wide={wide}>
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          fontSize: 14, pointerEvents: "none", lineHeight: 1, zIndex: 1,
        }}>🇵🇰</span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={e => {
            const f = formatPkPhone(e.target.value);
            onChange(f, !validatePkPhone(f));
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          style={{ paddingLeft: 30 }}
        />
      </div>
    </FieldWrapper>
  );
}

/* ─── PkMobileInput ─────────────────────────────────────────────────────────── */
export function PkMobileInput(props: InputProps) {
  return <PkPhoneInput {...props} label={props.label ?? "Mobile"} placeholder="0300-1234567"/>;
}

/* ─── PkEmailInput ──────────────────────────────────────────────────────────── */
export function PkEmailInput({
  label = "Email", value, onChange, required,
  placeholder = "name@school.edu.pk", wide,
}: InputProps) {
  const [touched, setTouched] = React.useState(false);

  const err = React.useMemo(() => {
    if (!touched && !value) return "";
    if (required && !value.trim()) return `${label} is required`;
    return validateEmail(value);
  }, [value, touched, required, label]);

  return (
    <FieldWrapper label={label} required={required} error={err} wide={wide}>
      <input
        type="email"
        value={value}
        onChange={e => onChange(e.target.value, !validateEmail(e.target.value))}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
      />
    </FieldWrapper>
  );
}

/* ─── PkWebsiteInput ────────────────────────────────────────────────────────── */
export function PkWebsiteInput({
  label = "Website", value, onChange, required,
  placeholder = "https://www.school.edu.pk", wide,
}: InputProps) {
  const [touched, setTouched] = React.useState(false);

  const err = React.useMemo(() => {
    if (!touched && !value) return "";
    if (required && !value.trim()) return `${label} is required`;
    return validateUrl(value);
  }, [value, touched, required, label]);

  return (
    <FieldWrapper label={label} required={required} error={err}
      hint="Include https:// for the full URL" wide={wide}>
      <input
        type="url"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
      />
    </FieldWrapper>
  );
}

/* ─── PkCnicInput ───────────────────────────────────────────────────────────── */
export function PkCnicInput({
  label = "CNIC / National ID", value, onChange, required, wide,
}: InputProps) {
  const [touched, setTouched] = React.useState(false);

  const err = React.useMemo(() => {
    if (!touched && !value) return "";
    if (required && !value.trim()) return `${label} is required`;
    return validateCnic(value);
  }, [value, touched, required, label]);

  return (
    <FieldWrapper label={label} required={required} error={err}
      hint="Format: 35202-1234567-8 (auto-formatted as you type)" wide={wide}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => {
          const f = formatCnic(e.target.value);
          onChange(f, !validateCnic(f));
        }}
        onBlur={() => setTouched(true)}
        placeholder="35202-1234567-8"
        maxLength={15}
        style={{ fontFamily: "monospace", letterSpacing: ".05em" }}
      />
    </FieldWrapper>
  );
}

/* ─── Lookup-backed geography selects ───────────────────────────────────────── */
interface GeographyItem { id: number; code: string; name: string; }
interface SelectProps {
  label?: string; value: string;
  onChange: (v: string) => void;
  required?: boolean; wide?: boolean;
}
function unwrapGeography(payload: unknown): GeographyItem[] {
  if (Array.isArray(payload)) return payload as GeographyItem[];
  const envelope = payload as { value?: GeographyItem[]; items?: GeographyItem[] } | undefined;
  return envelope?.value ?? envelope?.items ?? [];
}

export function PkCountrySelect({ label = "Country", value, onChange, required, wide }: SelectProps) {
  const { data } = useCountries();
  const items = unwrapGeography(data);
  const opts = items.length ? items.map(x => x.name) : FB_COUNTRIES;
  return <FieldWrapper label={label} required={required} wide={wide}><select value={value} onChange={e=>onChange(e.target.value)}><option value="">— Select country —</option>{opts.map(c=><option key={c} value={c}>{c}</option>)}</select></FieldWrapper>;
}

interface ProvinceSelectProps extends SelectProps { country?: string; }
export function PkProvinceSelect({ label = "Province / Territory", value, onChange, required, wide, country = "Pakistan" }: ProvinceSelectProps) {
  const countries = unwrapGeography(useCountries().data);
  const countryId = countries.find(x => x.name === country || x.code === country)?.id;
  const { data } = useProvinces(countryId);
  const items = unwrapGeography(data);
  const opts = items.length ? items.map(x => x.name) : (country === "Pakistan" ? FB_PROVINCES : []);
  return <FieldWrapper label={label} required={required} wide={wide}><select value={value} disabled={!country} onChange={e=>onChange(e.target.value)}><option value="">— Select province —</option>{opts.map(v=><option key={v} value={v}>{v}</option>)}</select></FieldWrapper>;
}

interface CitySelectProps extends SelectProps { province?: string; country?: string; }
export function PkCitySelect({ label = "City", value, onChange, required, province, country = "Pakistan", wide }: CitySelectProps) {
  const countries = unwrapGeography(useCountries().data);
  const countryId = countries.find(x => x.name === country || x.code === country)?.id;
  const provinces = unwrapGeography(useProvinces(countryId).data);
  const provinceId = provinces.find(x => x.name === province || x.code === province)?.id;
  const { data } = useCities(provinceId);
  const items = unwrapGeography(data);
  const opts = items.length ? items.map(x => x.name) : (!province && country === "Pakistan" ? FB_CITIES : []);
  return <FieldWrapper label={label} required={required} wide={wide}><select value={value} disabled={!province} onChange={e=>onChange(e.target.value)}><option value="">— Select city —</option>{opts.map(v=><option key={v} value={v}>{v}</option>)}</select></FieldWrapper>;
}

/* ─── PkAddressBlock ────────────────────────────────────────────────────────── */
interface AddressValue { street: string; city: string; province: string; country: string; }
interface AddressBlockProps { label?: string; value: AddressValue; onChange: (v: AddressValue) => void; required?: boolean; }
export function PkAddressBlock({ label = "Address", value, onChange, required }: AddressBlockProps) {
  return (
    <div style={{ display: "grid", gap: 10, gridColumn: "1/-1" }}>
      <label className="human-field field-wide">
        <span>{label}{required && <i className="required-mark">*</i>}</span>
        <input value={value.street} onChange={e => onChange({ ...value, street: e.target.value })} placeholder="Street / building / area"/>
      </label>
      <PkCountrySelect value={value.country} onChange={country => onChange({ ...value, country, province: "", city: "" })} required={required}/>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PkProvinceSelect country={value.country} value={value.province} onChange={province => onChange({ ...value, province, city: "" })} required={required}/>
        <PkCitySelect country={value.country} province={value.province} value={value.city} onChange={city => onChange({ ...value, city })} required={required}/>
      </div>
    </div>
  );
}
