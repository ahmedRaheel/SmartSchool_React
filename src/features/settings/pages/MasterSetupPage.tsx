import { BookOpen, Building2, GraduationCap, Layers3, MapPin, ReceiptText, School, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";

const groups = [
  { title: "Organization", description: "Core school structure used by admissions, HR and academics.", items: [
    { label: "Schools", description: "School profile, registration and contact information", path: "/organization", icon: School },
    { label: "Branches", description: "Branches, gender policy and academic system", path: "/organization", icon: MapPin },
    { label: "Departments", description: "Academic and administrative departments", path: "/setup/departments", icon: Building2 },
  ]},
  { title: "Academic setup", description: "The hierarchy used by students, admissions, timetable and examinations.", items: [
    { label: "Academic Years", description: "Current and upcoming academic sessions", path: "/academics", icon: BookOpen },
    { label: "Classes & Sections", description: "Branch classes and their sections", path: "/academics", icon: GraduationCap },
    { label: "Subjects & Courses", description: "Curriculum and course setup", path: "/academics", icon: Layers3 },
  ]},
  { title: "Finance & people", description: "Reusable master data for fee and staff workflows.", items: [
    { label: "Fee Types", description: "Tuition, admission, transport and other fee types", path: "/setup/fee-types", icon: ReceiptText },
    { label: "HR Setup", description: "Employee and recruitment supporting setup", path: "/hr", icon: UsersRound },
  ]},
];

export function MasterSetupPage() {
  const navigate = useNavigate();
  return <>
    <PageHeader title="School Setup" subtitle="Configure organization, academic and finance master data from one consistent workspace" />
    <div className="setup-groups">
      {groups.map(group => <section className="surface setup-group" key={group.title}>
        <div className="surface-head"><div><h3>{group.title}</h3><p>{group.description}</p></div></div>
        <div className="setup-card-grid">
          {group.items.map(item => { const Icon=item.icon; return <button className="setup-nav-card" key={item.label} onClick={()=>navigate(item.path)}>
            <span className="setup-nav-icon"><Icon size={20}/></span><span><b>{item.label}</b><small>{item.description}</small></span><span className="setup-arrow">→</span>
          </button>; })}
        </div>
      </section>)}
    </div>
  </>;
}
