import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SchoolCampusTab }       from "./tabs/SchoolCampusTab";
import { AcademicStructureTab }  from "./tabs/AcademicStructureTab";
import { FeeConfigTab }          from "./tabs/FeeConfigTab";
import { LookupConfigTab }       from "./tabs/LookupConfigTab";
import { AiConfigTab }           from "./tabs/AiConfigTab";

type SetupTab = "school"|"academic"|"fees"|"lookups"|"ai";

const TABS: { key: SetupTab; label: string }[] = [
  { key:"school",   label:"🏫 School & Campus"       },
  { key:"academic", label:"📅 Academic structure"     },
  { key:"fees",     label:"💰 Fee configuration"      },
  { key:"lookups",  label:"🔧 Lookup values"           },
  { key:"ai",       label:"🧠 AI configuration"        },
];

export function TenantSetupPage() {
  const [tab, setTab] = useState<SetupTab>("school");
  return (
    <>
      <PageHeader title="School Setup" subtitle="Configure your school, campuses, academic structure and AI settings"/>
      <div className="section-tabs" style={{ marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} className={tab===t.key?"active":""} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab === "school"   && <SchoolCampusTab/>}
      {tab === "academic" && <AcademicStructureTab/>}
      {tab === "fees"     && <FeeConfigTab/>}
      {tab === "lookups"  && <LookupConfigTab/>}
      {tab === "ai"       && <AiConfigTab/>}
    </>
  );
}
