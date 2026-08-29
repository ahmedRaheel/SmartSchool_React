import { useState, useEffect, type ReactNode } from "react";
import { X, Plus, Pencil, Trash2, Search } from "lucide-react";

/* ── Generic modal ─────────────────────────────────────────── */
export function Modal({ open, title, onClose, children, wide = false }: {
  open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width: wide ? "min(760px,96vw)" : undefined }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Field components ───────────────────────────────────────── */
export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="human-field">
      <span>{label}{required && <em style={{ color: "var(--danger)", marginLeft: 2 }}>*</em>}</span>
      {children}
    </label>
  );
}

export function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} />;
}

export function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: ReactNode;
}) {
  return <select value={value} onChange={e => onChange(e.target.value)}>{children}</select>;
}

/* ── Table scaffold ─────────────────────────────────────────── */
export function DataTable({ headers, children, onSearch, onAdd, addLabel = "Add" }: {
  headers: string[]; children: ReactNode; onSearch?: (q: string) => void;
  onAdd?: () => void; addLabel?: string;
}) {
  return (
    <div className="surface">
      <div className="surface-head">
        {onSearch && (
          <label className="search-box" style={{ maxWidth: 300 }}>
            <Search size={14} />
            <input placeholder="Search…" onChange={e => onSearch(e.target.value)} />
          </label>
        )}
        {onAdd && (
          <button className="primary" onClick={onAdd}><Plus size={14} /> {addLabel}</button>
        )}
      </div>
      <div className="table-wrap">
        <table className="premium-table">
          <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function ActionCell({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="row-actions">
      <button className="table-action" onClick={onEdit}><Pencil size={13} /> Edit</button>
      <button className="table-action" style={{ color: "var(--danger)" }} onClick={onDelete}><Trash2 size={13} /> Delete</button>
    </div>
  );
}

export function ModalActions({ onCancel, onSave, saving = false, disabled = false }: {
  onCancel: () => void; onSave: () => void; saving?: boolean; disabled?: boolean;
}) {
  return (
    <div className="modal-actions" style={{ padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
      <button className="secondary" onClick={onCancel}>Cancel</button>
      <button className="primary" onClick={onSave} disabled={saving || disabled}>
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export function StatusPill({ active }: { active: boolean }) {
  return <span className={`status-pill ${active ? "success" : "gray"}`}>{active ? "Active" : "Inactive"}</span>;
}
