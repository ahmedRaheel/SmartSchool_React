import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SchoolCampusTab }    from "./tabs/SchoolCampusTab";
import { AcademicStructureTab } from "./tabs/AcademicStructureTab";
import { AcademicSystemTab }  from "./tabs/AcademicSystemTab";
import { FeeConfigTab }       from "./tabs/FeeConfigTab";
import { LookupConfigTab }    from "./tabs/LookupConfigTab";
import { AiConfigTab }        from "./tabs/AiConfigTab";
import { DepartmentsTab }     from "../../settings/pages/tabs/DepartmentsTab";
import { SubjectsTab }        from "../../settings/pages/tabs/SubjectsTab";
import { RoomsTab }           from "../../settings/pages/tabs/RoomsTab";

type SetupTab =
  | "school" | "academic" | "system" | "departments"
  | "subjects" | "rooms" | "fees" | "lookups" | "ai";

const TABS: { key: SetupTab; label: string; group: string }[] = [
  { key:"school",      label:"🏫 School & Campus",     group:"Organisation" },
  { key:"academic",    label:"📅 Academic structure",   group:"Organisation" },
  { key:"system",      label:"📋 Academic systems",     group:"Organisation" },
  { key:"departments", label:"🏢 Departments",          group:"Organisation" },
  { key:"subjects",    label:"📖 Subjects",             group:"Curriculum"   },
  { key:"rooms",       label:"🚪 Rooms & Facilities",   group:"Curriculum"   },
  { key:"fees",        label:"💰 Fee configuration",    group:"Finance"      },
  { key:"lookups",     label:"🔧 Lookup values",        group:"System"       },
  { key:"ai",          label:"🧠 AI configuration",     group:"System"       },
];

export function TenantSetupPage() {
  const [tab, setTab] = useState<SetupTab>("school");
  const groups = [...new Set(TABS.map(t => t.group))];

  return (
    <>
      <PageHeader
        title="School Setup"
        subtitle="Configure your school structure, campuses, academic systems, curriculum, fees and AI settings"
      />
      <div style={{ marginBottom: 16 }}>
        {groups.map(g => (
          <div key={g} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".8px", color: "var(--muted)", marginBottom: 6, paddingLeft: 2 }}>{g}</div>
            <div className="section-tabs" style={{ marginBottom: 0, flexWrap: "wrap" }}>
              {TABS.filter(t => t.group === g).map(t => (
                <button key={t.key} className={tab===t.key?"active":""} onClick={() => setTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tab === "school"      && <SchoolCampusTab/>}
      {tab === "academic"    && <AcademicStructureTab/>}
      {tab === "system"      && <AcademicSystemTab/>}
      {tab === "departments" && <DepartmentsTab/>}
      {tab === "subjects"    && <SubjectsTab/>}
      {tab === "rooms"       && <RoomsTab/>}
      {tab === "fees"        && <FeeConfigTab/>}
      {tab === "lookups"     && <LookupConfigTab/>}
      {tab === "ai"          && <AiConfigTab/>}
    </>
  );
}
