import { Search, X } from "lucide-react";
import { useRef } from "react";

interface Props {
  value:        string;
  onChange:     (q: string) => void;
  placeholder?: string;
  width?:       number | string;
  autoFocus?:   boolean;
}

export function SearchBar({ value, onChange, placeholder = "Search…", width = 260, autoFocus }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <label className="search-box" style={{ maxWidth: width }} onClick={() => ref.current?.focus()}>
      <Search size={13} style={{ flexShrink: 0 }}/>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {value && (
        <button
          type="button"
          style={{ display:"flex", border:0, background:"transparent", cursor:"pointer", padding:"2px", color:"var(--muted)", borderRadius:4 }}
          onClick={e => { e.preventDefault(); onChange(""); ref.current?.focus(); }}
          aria-label="Clear"
        >
          <X size={12}/>
        </button>
      )}
    </label>
  );
}
