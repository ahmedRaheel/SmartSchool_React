import { createContext, type ReactNode, useContext, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
const UiContext = createContext<{
    notify: (message: string) => void;
} | undefined>(undefined);
export function UiProvider({ children }: {
    children: ReactNode;
}) {
    const [message, setMessage] = useState("");
    const value = useMemo(() => ({ notify: (next: string) => { setMessage(next); window.setTimeout(() => setMessage(""), 2400); } }), []);
    return <UiContext.Provider value={value}>{children}{message && <div className="toast">
<CheckCircle2 size={18}/>
<span>{message}</span>
<button onClick={() => setMessage("")}>
<X size={15}/>
</button>
</div>}</UiContext.Provider>;
}
export function useUi() { const value = useContext(UiContext); if (!value)
    throw new Error("UiProvider required"); return value; }
export function Modal({ open, title, children, onClose }: {
    open: boolean;
    title: string;
    children: ReactNode;
    onClose: () => void;
}) {
    if (!open)
        return null;
    return <div className="modal-backdrop" onMouseDown={onClose}>
<section className="modal-card" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
  <header className="modal-head">
<div>
<span className="eyebrow">SmartSchool</span>
<h2>{title}</h2>
</div>
<button className="icon-button" onClick={onClose}>
<X size={19}/>
</button>
</header>{children}
 </section>
</div>;
}

