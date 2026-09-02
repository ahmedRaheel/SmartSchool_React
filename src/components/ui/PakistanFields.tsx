/**
 * PakistanFields — validated, typed input components for Pakistani data
 *
 * PkPhoneInput  — validates 03XX-XXXXXXX mobile / 0XX-XXXXXXX landline
 * PkEmailInput  — validates email format
 * PkCnicInput   — validates CNIC 00000-0000000-0 format
 * PkCitySelect  — dropdown of all Pakistani cities
 * PkProvinceSelect — dropdown of provinces / territories
 * PkCountrySelect — dropdown (Pakistan default + world)
 * PkAddressInput — multi-line address with city / province row
 *
 * All accept: value, onChange(v), label, required, error
 */

// ── Data ──────────────────────────────────────────────────────────────────────

export const PK_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa (KPK)",
  "Balochistan",
  "Islamabad Capital Territory",
  "Azad Jammu & Kashmir",
  "Gilgit-Baltistan",
];

export const PK_CITIES: Record<string, string[]> = {
  "Punjab": [
    "Lahore","Faisalabad","Rawalpindi","Gujranwala","Multan","Sialkot",
    "Bahawalpur","Sargodha","Sheikhupura","Jhang","Rahim Yar Khan",
    "Gujrat","Sahiwal","Wah Cantonment","Okara","Kasur","Chiniot",
    "Mandi Bahauddin","Jhelum","Khanewal","Hafizabad","Chakwal",
    "Narowal","Pakpattan","Attock","Mianwali","Bhakkar","Khushab",
    "Muzaffargarh","Lodhran","Vehari","Toba Tek Singh","Nankana Sahib",
  ],
  "Sindh": [
    "Karachi","Hyderabad","Sukkur","Larkana","Nawabshah","Mirpurkhas",
    "Jacobabad","Shikarpur","Khairpur","Dadu","Thatta","Badin",
    "Tando Allahyar","Tando Muhammad Khan","Sanghar","Ghotki","Kashmore",
    "Umerkot","Qambar Shahdadkot","Matiari","Naushahro Feroze",
  ],
  "Khyber Pakhtunkhwa (KPK)": [
    "Peshawar","Mardan","Mingora","Kohat","Abbottabad","Mansehra",
    "Swabi","Nowshera","Charsadda","Bannu","Dera Ismail Khan",
    "Haripur","Buner","Dir (Upper)","Dir (Lower)","Chitral","Hangu",
    "Karak","Lakki Marwat","Malakand","Shangla","Swat","Tank","Tor Ghar",
  ],
  "Balochistan": [
    "Quetta","Gwadar","Turbat","Khuzdar","Chaman","Zhob","Hub",
    "Loralai","Panjgur","Sibi","Kalat","Mastung","Kharan","Nushki",
    "Washuk","Awaran","Kech","Lasbela","Pishin","Ziarat",
  ],
  "Islamabad Capital Territory": ["Islamabad"],
  "Azad Jammu & Kashmir": [
    "Muzaffarabad","Mirpur","Bhimber","Kotli","Rawalakot","Bagh",
    "Haveli","Jhelum Valley","Poonch","Neelum",
  ],
  "Gilgit-Baltistan": [
    "Gilgit","Skardu","Hunza","Ghanche","Diamer","Astore",
    "Ghizer","Shigar","Kharmang","Nagar",
  ],
};

// All cities flat (for when province isn't selected)
export const ALL_PK_CITIES = Object.values(PK_CITIES).flat().sort();

export const COUNTRIES = [
  "Pakistan",
  "Afghanistan","Albania","Algeria","Angola","Argentina","Armenia",
  "Australia","Austria","Azerbaijan","Bahrain","Bangladesh","Belgium",
  "Brazil","Canada","Chile","China","Colombia","Croatia","Cyprus",
  "Czech Republic","Denmark","Egypt","Ethiopia","Finland","France",
  "Germany","Ghana","Greece","Hungary","India","Indonesia","Iran",
  "Iraq","Ireland","Israel","Italy","Japan","Jordan","Kazakhstan",
  "Kenya","Kuwait","Lebanon","Libya","Malaysia","Maldives","Mali",
  "Mexico","Morocco","Myanmar","Nepal","Netherlands","New Zealand",
  "Nigeria","Norway","Oman","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Saudi Arabia","Senegal","Singapore","Somalia",
  "South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden",
  "Switzerland","Syria","Taiwan","Tanzania","Thailand","Tunisia",
  "Turkey","Turkmenistan","UAE","Uganda","Ukraine","United Kingdom",
  "United States","Uzbekistan","Venezuela","Vietnam","Yemen","Zimbabwe",
];

// ── Validation ────────────────────────────────────────────────────────────────

/** Pakistani mobile: 03XX-XXXXXXX or 03XXXXXXXXX (10-11 digits) */
export function validatePkPhone(v: string): string {
  const digits = v.replace(/[-\s()]/g, "");
  if (!v.trim()) return "";
  if (!/^0/.test(digits))          return "Must start with 0 (e.g. 0300-1234567)";
  if (digits.length < 10)          return "Too short — enter at least 10 digits";
  if (digits.length > 11)          return "Too long — max 11 digits";
  if (/^03/.test(digits) && digits.length !== 11) return "Mobile numbers must be 11 digits (03XX-XXXXXXX)";
  if (!/^0[2-9]\d{8,9}$/.test(digits)) return "Invalid format — use 0300-1234567 or 021-12345678";
  return "";
}

/** Basic email validation */
export function validateEmail(v: string): string {
  if (!v.trim()) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address";
  return "";
}

/** Pakistani CNIC: XXXXX-XXXXXXX-X */
export function validateCnic(v: string): string {
  if (!v.trim()) return "";
  const digits = v.replace(/-/g, "");
  if (!/^\d{13}$/.test(digits)) return "CNIC must be 13 digits (e.g. 35202-1234567-8)";
  return "";
}

/** Format phone as user types */
export function formatPkPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.startsWith("03") && d.length > 4) return d.slice(0, 4) + "-" + d.slice(4);
  if (d.length > 3 && !d.startsWith("03")) return d.slice(0, 3) + "-" + d.slice(3);
  return d;
}

/** Format CNIC as user types */
export function formatCnic(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length > 12) return d.slice(0, 5) + "-" + d.slice(5, 12) + "-" + d.slice(12);
  if (d.length > 5)  return d.slice(0, 5) + "-" + d.slice(5);
  return d;
}

// ── Shared field wrapper ──────────────────────────────────────────────────────
interface FieldWrapperProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  wide?: boolean;
}

function FieldWrapper({ label, required, error, hint, children, wide }: FieldWrapperProps) {
  return (
    <label className={`human-field${wide ? " field-wide" : ""}`} style={{ display: "grid", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>
        {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
      </span>
      {children}
      {error && (
        <span style={{ fontSize: 10, color: "var(--danger)", display: "flex", alignItems: "center", gap: 4 }}>
          ⚠ {error}
        </span>
      )}
      {hint && !error && (
        <span style={{ fontSize: 10, color: "var(--muted-2)" }}>{hint}</span>
      )}
    </label>
  );
}

// ── PkPhoneInput ──────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChange: (v: string, valid: boolean) => void;
  required?: boolean;
  placeholder?: string;
  wide?: boolean;
}

export function PkPhoneInput({ label = "Phone", value, onChange, required, placeholder = "0300-1234567", wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validatePkPhone(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPkPhone(e.target.value);
    const error = validatePkPhone(formatted);
    onChange(formatted, !error);
  }

  return (
    <FieldWrapper label={label} required={required} error={err} hint="Format: 0300-1234567 or 021-12345678" wide={wide}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "var(--muted-2)", pointerEvents: "none", userSelect: "none" }}>🇵🇰 +92</span>
        <input
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          style={{
            paddingLeft: 58,
            borderColor: err ? "var(--danger)" : undefined,
            boxShadow: err ? "0 0 0 3px rgba(220,38,38,.1)" : undefined,
          }}
        />
      </div>
    </FieldWrapper>
  );
}

// ── PkEmailInput ──────────────────────────────────────────────────────────────
export function PkEmailInput({ label = "Email", value, onChange, required, placeholder = "name@school.edu.pk", wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validateEmail(value) : "";

  return (
    <FieldWrapper label={label} required={required} error={err} wide={wide}>
      <input
        type="email"
        value={value}
        onChange={e => { onChange(e.target.value, !validateEmail(e.target.value)); }}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        style={{
          borderColor: err ? "var(--danger)" : undefined,
          boxShadow: err ? "0 0 0 3px rgba(220,38,38,.1)" : undefined,
        }}
      />
    </FieldWrapper>
  );
}

// ── PkCnicInput ───────────────────────────────────────────────────────────────
export function PkCnicInput({ label = "CNIC / National ID", value, onChange, required, wide }: InputProps) {
  const [touched, setTouched] = React.useState(false);
  const err = (touched || value) ? validateCnic(value) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCnic(e.target.value);
    onChange(formatted, !validateCnic(formatted));
  }

  return (
    <FieldWrapper label={label} required={required} error={err} hint="Format: 35202-1234567-8" wide={wide}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        placeholder="35202-1234567-8"
        maxLength={15}
        style={{
          borderColor: err ? "var(--danger)" : undefined,
          boxShadow: err ? "0 0 0 3px rgba(220,38,38,.1)" : undefined,
          fontFamily: "monospace", letterSpacing: ".05em",
        }}
      />
    </FieldWrapper>
  );
}

// ── PkProvinceSelect ──────────────────────────────────────────────────────────
interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  wide?: boolean;
}

export function PkProvinceSelect({ label = "Province / Territory", value, onChange, required, wide }: SelectProps) {
  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Select province —</option>
        {PK_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    </FieldWrapper>
  );
}

// ── PkCitySelect ──────────────────────────────────────────────────────────────
interface CitySelectProps extends SelectProps {
  province?: string; // if provided, filters cities to that province
}

export function PkCitySelect({ label = "City", value, onChange, required, province, wide }: CitySelectProps) {
  const cities = province && PK_CITIES[province] ? PK_CITIES[province] : ALL_PK_CITIES;

  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Select city —</option>
        {cities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </FieldWrapper>
  );
}

// ── PkCountrySelect ───────────────────────────────────────────────────────────
export function PkCountrySelect({ label = "Country", value, onChange, required, wide }: SelectProps) {
  return (
    <FieldWrapper label={label} required={required} wide={wide}>
      <select value={value || "Pakistan"} onChange={e => onChange(e.target.value)}>
        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </FieldWrapper>
  );
}

// ── PkAddressBlock ────────────────────────────────────────────────────────────
/**
 * Complete address block: street address + city + province + country
 * Manages all sub-fields internally, calls onChange with the full address object.
 */
interface AddressValue {
  street:   string;
  city:     string;
  province: string;
  country:  string;
}

interface AddressBlockProps {
  label?: string;
  value: AddressValue;
  onChange: (v: AddressValue) => void;
  required?: boolean;
}

export function PkAddressBlock({ label = "Address", value, onChange, required }: AddressBlockProps) {
  const set = (k: keyof AddressValue) => (v: string) => {
    const updated = { ...value, [k]: v };
    if (k === "province") updated.city = ""; // reset city when province changes
    onChange(updated);
  };

  return (
    <div style={{ gridColumn: "1 / -1", display: "grid", gap: 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>
        {label}{required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
      </span>
      <input
        value={value.street}
        onChange={e => set("street")(e.target.value)}
        placeholder="Street address, building, area…"
        style={{ gridColumn: "1 / -1" }}
      />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <label className="human-field">
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Province</span>
          <select value={value.province} onChange={e => set("province")(e.target.value)}>
            <option value="">— Province —</option>
            {PK_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="human-field">
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>City</span>
          <select value={value.city} onChange={e => set("city")(e.target.value)}>
            <option value="">— City —</option>
            {(value.province && PK_CITIES[value.province] ? PK_CITIES[value.province] : ALL_PK_CITIES)
              .map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="human-field">
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Country</span>
          <select value={value.country || "Pakistan"} onChange={e => set("country")(e.target.value)}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}

// ── React import ──────────────────────────────────────────────────────────────
import React from "react";
