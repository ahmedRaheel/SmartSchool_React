import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open:    boolean;
  title:   string;
  onClose: () => void;
  children: ReactNode;
  width?:  string;
  subtitle?: string;
}

export function Modal({ open, title, onClose, children, width = "min(540px,96vw)", subtitle }: Props) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card" style={{ width }}>
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p style={{ fontSize:11, color:"var(--muted)", margin:"3px 0 0" }}>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={16}/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
