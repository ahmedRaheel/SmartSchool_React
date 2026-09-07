/**
 * SearchBar — reusable search input used in the toolbar of every data page.
 */
import { Search, X } from "lucide-react";

interface Props {
  value:       string;
  onChange:    (q: string) => void;
  placeholder?: string;
  width?:      number | string;
}

export function SearchBar({ value, onChange, placeholder = "Search…", width = 280 }: Props) {
  return (
    <label className="search-box" style={{ maxWidth: width }}>
      <Search size={14} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "var(--muted)" }}
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={12} />
        </button>
      )}
    </label>
  );
}
