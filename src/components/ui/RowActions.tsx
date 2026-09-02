/**
 * RowActions — standard View / Edit / Delete action cell for every table row.
 * Import once, use everywhere. Handles the delete-confirm modal internally.
 */
import { useState } from "react";
import { Eye, Edit3, Trash2, MoreHorizontal, X, AlertTriangle } from "lucide-react";

interface Action {
  label:    string;
  icon?:    React.ReactNode;
  onClick:  () => void;
  variant?: "default" | "approve" | "reject" | "hold" | "waitlist" | "danger";
  hidden?:  boolean;
}

interface Props {
  onView?:   () => void;
  onEdit?:   () => void;
  onDelete?: () => void;
  /** Label shown in delete confirmation */
  deleteLabel?: string;
  /** Extra custom actions */
  extra?: Action[];
  /** Collapse to a kebab ⋯ menu when true */
  compact?: boolean;
}

function DeleteConfirm({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try { await onConfirm(); } finally { setBusy(false); }
  }
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-card" style={{ width: "min(420px,96vw)" }}>
        <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--danger-bg)", border: "1.5px solid var(--danger-border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={24} style={{ color: "var(--danger)" }} />
          </div>
          <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, letterSpacing: "-.3px" }}>Delete {label}?</h3>
          <p style={{ margin: "0 0 24px", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
            This action cannot be undone. The record will be permanently removed from the system.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="secondary" style={{ minWidth: 90 }} onClick={onCancel}>Cancel</button>
            <button
              style={{ minWidth: 120, height: 36, padding: "0 18px", borderRadius: 9, border: "none", background: "var(--danger)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: busy ? "wait" : "pointer", opacity: busy ? .7 : 1 }}
              onClick={confirm} disabled={busy}
            >
              {busy ? "Deleting…" : "Yes, delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RowActions({ onView, onEdit, onDelete, deleteLabel = "this record", extra = [], compact }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);

  const allActions: Action[] = [
    ...(onView  ? [{ label: "View",   icon: <Eye size={12} />,   onClick: onView,                               variant: "default" as const }] : []),
    ...(onEdit  ? [{ label: "Edit",   icon: <Edit3 size={12} />, onClick: onEdit,                               variant: "default" as const }] : []),
    ...extra.filter(a => !a.hidden),
    ...(onDelete? [{ label: "Delete", icon: <Trash2 size={12} />,onClick: () => setConfirmDelete(true),         variant: "danger"  as const }] : []),
  ];

  if (allActions.length === 0) return null;

  const VARIANT_CLS: Record<string, string> = {
    default:   "table-action",
    approve:   "table-action approve",
    reject:    "table-action reject",
    hold:      "table-action hold",
    waitlist:  "table-action waitlist",
    danger:    "table-action",
  };
  const VARIANT_STYLE: Record<string, React.CSSProperties> = {
    danger: { color: "var(--danger)", borderColor: "var(--danger-border)" },
  };

  return (
    <>
      <div className="row-actions" style={{ justifyContent: "flex-end" }}>
        {!compact && allActions.map((a, i) => (
          <button
            key={i}
            className={VARIANT_CLS[a.variant ?? "default"]}
            style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4, ...(VARIANT_STYLE[a.variant ?? ""] ?? {}) }}
            onClick={a.onClick}
            title={a.label}
          >
            {a.icon}{a.label}
          </button>
        ))}

        {compact && (
          <div style={{ position: "relative" }}>
            <button className="table-action" style={{ fontSize: 10, padding: "0 8px" }} onClick={() => setMenuOpen(o => !o)}>
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 100,
                  background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12,
                  boxShadow: "var(--shadow-lg)", padding: "4px", minWidth: 140,
                }}>
                  {allActions.map((a, i) => (
                    <button key={i} onClick={() => { a.onClick(); setMenuOpen(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 12px", border: 0, borderRadius: 8, background: "transparent",
                        fontSize: 12, cursor: "pointer", textAlign: "left",
                        color: a.variant === "danger" ? "var(--danger)" : "var(--text)",
                        fontWeight: 500,
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {confirmDelete && (
        <DeleteConfirm
          label={deleteLabel}
          onConfirm={() => { onDelete!(); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
