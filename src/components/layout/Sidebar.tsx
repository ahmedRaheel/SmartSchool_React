import { NavLink } from "react-router-dom";
import { BarChart3, BookOpen, Bot, BriefcaseBusiness, Bus, CalendarCheck, ClipboardCheck, GraduationCap, LayoutDashboard, Library, MessageCircle, Settings, Users, Wallet, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../../features/auth/auth";

type NavItem=[string,string,any,string[]];
const items:NavItem[]=[
 ["/","Dashboard",LayoutDashboard,["*"]],
 ["/platform","Platform",ShieldCheck,["SuperAdmin"]],
 ["/tenancy","Tenants",BookOpen,["SuperAdmin"]],
 ["/organization","Branches",BookOpen,["SuperAdmin","SchoolAdmin","Admin","Principal"]],
 ["/academics","Academics",GraduationCap,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Student","Parent"]],
 ["/students","Students",Users,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher"]],
 ["/teachers","Teachers",Users,["SuperAdmin","SchoolAdmin","Admin","Principal"]],
 ["/examinations","Examinations",ClipboardCheck,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Student","Parent","Examiner"]],
 ["/attendance","Attendance",CalendarCheck,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Student","Parent"]],
 ["/finance","Finance",Wallet,["SuperAdmin","SchoolAdmin","Admin","Accountant","Parent","Student"]],
 ["/hr","HR & Payroll",BriefcaseBusiness,["SuperAdmin","SchoolAdmin","Admin","Principal","HRManager","Staff","Teacher"]],
 ["/transport","Transport",Bus,["SuperAdmin","SchoolAdmin","Admin","TransportManager","Driver","Parent"]],
 ["/communication","Chat & Notifications",MessageCircle,["*"]],
 ["/ai","AI Assistant",Bot,["*"]],
 ["/learning","Learning",BookOpen,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Student","Parent"]],
 ["/documents","Documents",BookOpen,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Student","Parent","Staff"]],
 ["/workflow","Workflow",BookOpen,["SuperAdmin","SchoolAdmin","Admin","Principal","Teacher","Staff"]],
 ["/reports","Reports",BarChart3,["SuperAdmin","SchoolAdmin","Admin","Principal","Examiner"]],
 ["/settings","Settings",Settings,["SuperAdmin","SchoolAdmin","Admin","Principal"]],
];
export function Sidebar({open,onClose}:{open:boolean;onClose:()=>void;}){
 const {user}=useAuth();
 const roles=user?.roles??[];
 const visible=items.filter(x=>x[3].includes("*")||x[3].some(r=>roles.includes(r)));
 return <>{open&&<button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose}/>}
 <aside className={`sidebar ${open?"open":""}`}><div className="sidebar-head"><div className="brand"><span className="brand-mark"><GraduationCap size={22}/></span><span>Smart<b>School</b></span></div><button className="sidebar-close" onClick={onClose}><X size={20}/></button></div>
 <div className="school-chip"><span>{user?.initials||"SS"}</span><div><b>{user?.name||"SmartSchool"}</b><small>{user?.role||"User"} workspace</small></div></div>
 <div className="nav-label">Workspace</div><nav className="nav">{visible.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==="/"} onClick={onClose}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
 <div className="sidebar-upgrade"><Bot size={20}/><b>AI services</b><span>Ollama • RAG • Predictions</span><div className="health-line"><i/> Connected services configured</div></div>
 </aside></>;
}
