/**
 * ViewDrawer — right-side sliding drawer that renders any record's fields.
 * Used by all pages for the "View" action.
 *
 * Usage:
 *   <ViewDrawer title="Student" item={selected} fields={STUDENT_FIELDS} onClose={() => setSelected(null)} />
 */
import { X, Edit3 } from "lucide-react";

export interface DrawerField {
  label:   string;
  key:     string;
  render?: (value: any, row: any) => React.ReactNode;
  wide?:   boolean;
}

interface Props {
  title:   string;
  subtitle?: string;
  item:    Record<string, any> | null;
  fields:  DrawerField[];
  onClose: () => void;
  onEdit?: () => void;
  badge?:  React.ReactNode;
  avatar?: React.ReactNode;
  extra?:  React.ReactNode; // additional content below fields
}

function parseMeta(j?: string | null): Record<string, any> {
  try { return JSON.parse(j ?? "{}"); } catch { return {}; }
}

export function ViewDrawer({ title, subtitle, item, fields, onClose, onEdit, badge, avatar, extra }: Props) {
  if (!item) return null;
  const meta = parseMeta(item.metadataJson);
  const merged = { ...item, ...meta };

  return (
    <>
      <button
        style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,20,40,.38)", border: 0, backdropFilter: "blur(3px)", cursor: "default" }}
        onClick={onClose}
        aria-label="Close drawer"
      />
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 201,
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--line)",
          boxShadow: "-20px 0 60px rgba(0,0,0,.12)",
          display: "flex", flexDirection: "column",
          animation: "drawerIn .2s cubic-bezier(.16,1,.3,1)",
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 14, flexShrink: 0 }}>
          {avatar && <div style={{ flexShrink: 0, marginTop: 2 }}>{avatar}</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--muted)", marginBottom: 4 }}>{title}</div>
            <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, letterSpacing: "-.4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {merged.name ?? merged.firstName ? `${merged.firstName ?? ""} ${merged.lastName ?? ""}`.trim() : merged.title ?? title}
            </h2>
            {subtitle && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{subtitle}</p>}
            {badge && <div style={{ marginTop: 6 }}>{badge}</div>}
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            {onEdit && (
              <button className="secondary" style={{ height: 32, padding: "0 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }} onClick={onEdit}>
                <Edit3 size={12} /> Edit
              </button>
            )}
            <button className="icon-button" style={{ width: 32, height: 32 }} onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Fields */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.map(f => {
              const val = merged[f.key];
              const display = f.render ? f.render(val, merged) : (val !== undefined && val !== null && val !== "" ? String(val) : <span style={{ color: "var(--muted-2)" }}>—</span>);
              return (
                <div
                  key={f.key}
                  style={{
                    gridColumn: f.wide ? "1 / -1" : undefined,
                    padding: "12px 14px",
                    background: "var(--surface-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".6px", color: "var(--muted)", marginBottom: 5 }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", lineHeight: 1.5 }}>{display}</div>
                </div>
              );
            })}
          </div>
          {extra && <div style={{ marginTop: 16 }}>{extra}</div>}
        </div>
      </div>
    </>
  );
}
