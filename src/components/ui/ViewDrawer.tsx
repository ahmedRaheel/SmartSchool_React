/**
 * ViewDrawer — right-side slide-in panel for viewing a record.
 * Used by every data page. Renders field key→label pairs from the item object.
 */
import { X, Edit3, Copy, Check } from "lucide-react";
import { useState } from "react";

export interface DrawerField {
  key:    string;
  label:  string;
  wide?:  boolean;
  render?: (value: any, item: any) => React.ReactNode;
}

interface Props {
  title:   string;
  item:    Record<string, any>;
  fields:  readonly DrawerField[] | DrawerField[];
  onClose: () => void;
  onEdit?: () => void;
  /** Optional header accent color */
  color?:  string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <button
      onClick={copy}
      style={{ display:"flex", alignItems:"center", border:0, background:"transparent", cursor:"pointer", padding:"2px 4px", borderRadius:4, color:"var(--muted-2)", marginLeft:4 }}
      title="Copy"
    >
      {copied ? <Check size={11} style={{ color:"var(--success)" }}/> : <Copy size={11}/>}
    </button>
  );
}

function fmt(val: any): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  // ISO date
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    try { return new Date(val).toLocaleDateString("en-PK", { day:"2-digit", month:"short", year:"numeric" }); }
    catch { return val; }
  }
  return String(val);
}

export function ViewDrawer({ title, item, fields, onClose, onEdit, color = "var(--indigo)" }: Props) {
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={`View ${title}`}>
        {/* Header */}
        <div className="drawer-head">
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--indigo-soft)", display:"grid", placeItems:"center" }}>
              <span style={{ fontSize:13, fontWeight:800, color }}>
                {String(item.firstName ?? item.name ?? title)?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <h2 style={{ fontSize:14, margin:0 }}>{item.firstName ? `${item.firstName} ${item.lastName ?? ""}` : (item.name ?? title)}</h2>
              <p style={{ fontSize:11, color:"var(--muted)", margin:0 }}>{title}</p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16}/>
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {(fields as DrawerField[]).map(f => {
              const raw = item[f.key];
              const display = f.render ? f.render(raw, item) : fmt(raw);
              const isLong  = typeof display === "string" && display.length > 30;
              return (
                <div
                  key={f.key}
                  className="drawer-field"
                  style={{ gridColumn: f.wide || isLong ? "1 / -1" : undefined }}
                >
                  <span>{f.label}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:2 }}>
                    <b>{display}</b>
                    {typeof display === "string" && display !== "—" && display.length > 2 && (
                      <CopyButton text={display}/>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metadata */}
          {(item.createdAt || item.updatedAt) && (
            <div style={{ marginTop:8, paddingTop:14, borderTop:"1px solid var(--line)", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {item.createdAt && (
                <div className="drawer-field">
                  <span>Created</span>
                  <b>{fmt(item.createdAt)}</b>
                </div>
              )}
              {item.updatedAt && (
                <div className="drawer-field">
                  <span>Last updated</span>
                  <b>{fmt(item.updatedAt)}</b>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {onEdit && (
          <div className="drawer-footer">
            <button className="secondary" onClick={onClose} style={{ flex:1 }}>Close</button>
            <button className="primary" onClick={onEdit} style={{ flex:2, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <Edit3 size={13}/> Edit record
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
