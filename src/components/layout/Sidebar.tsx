import { NavLink } from "react-router-dom";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, Bus, CalendarCheck, ClipboardCheck, GraduationCap, LayoutDashboard, Library, MessageCircle, Settings, Users, Wallet, X, } from "lucide-react";
const items = [
    ["/", "Dashboard", LayoutDashboard],
    ["/academics", "Academics", GraduationCap],
    ["/students", "Students", Users],
    ["/teachers", "Teachers", Users],
    ["/examinations", "Examinations", ClipboardCheck],
    ["/attendance", "Attendance", CalendarCheck],
    ["/finance", "Finance", Wallet],
    ["/hr", "HR & Payroll", BriefcaseBusiness],
    ["/library", "Library", Library],
    ["/transport", "Transport", Bus],
    ["/communication", "Communication", MessageCircle],
    ["/ai", "AI Intelligence", Bot],
    ["/admissions", "Admissions", BookOpen],
    ["/activities", "Activities", BookOpen],
    ["/inventory", "Inventory", BookOpen],
    ["/learning", "Learning", BookOpen],
    ["/organization", "Organization", BookOpen],
    ["/payroll", "Payroll", BookOpen],
    ["/documents", "Documents", BookOpen],
    ["/workflow", "Workflow", BookOpen],
    ["/tenancy", "Tenancy", BookOpen],
    ["/reports", "Reports", BarChart3],
    ["/settings", "Settings", Settings],
] as const;
export function Sidebar({ open, onClose }: {
    open: boolean;
    onClose: () => void;
}) {
    return (<>
      {open && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose}/>}
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <div className="brand">
<span className="brand-mark">
<GraduationCap size={22}/>
</span>
<span>Smart<b>School</b>
</span>
</div>
          <button className="sidebar-close" onClick={onClose}>
<X size={20}/>
</button>
        </div>
        <div className="school-chip">
<span>SS</span>
<div>
<b>SmartSchool Academy</b>
<small>Karachi • Main Campus</small>
</div>
</div>
        <div className="nav-label">Workspace</div>
        <nav className="nav">
          {items.map(([to, label, Icon]) => (<NavLink key={to} to={to} end={to === "/"} onClick={onClose}>
              <Icon size={18}/>
<span>{label}</span>
            </NavLink>))}
        </nav>
        <div className="sidebar-upgrade">
          <Bot size={20}/>
          <b>AI is ready</b>
          <span>Ollama local services healthy</span>
          <div className="health-line">
<i /> All systems operational</div>
        </div>
      </aside>
    </>);
}

