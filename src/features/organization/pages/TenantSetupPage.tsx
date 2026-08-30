import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SchoolCampusTab }      from "./tabs/SchoolCampusTab";
import { FeeConfigTab }         from "./tabs/FeeConfigTab";
import { AiConfigTab }          from "./tabs/AiConfigTab";
import { LookupConfigTab }      from "./tabs/LookupConfigTab";
import { AcademicStructureTab } from "./tabs/AcademicStructureTab";

type ConfigTab = "school"|"academic"|"fee"|"ai"|"lookup";

const TABS: { key:ConfigTab; emoji:string; label:string; desc:string }[] = [
  { key:"school",   emoji:"🏫", label:"School & campuses",    desc:"Schools, branches, departments, rooms" },
  { key:"academic", emoji:"📚", label:"Academic structure",   desc:"Years, programs, classes, sections, subjects" },
  { key:"fee",      emoji:"💰", label:"Fee configuration",    desc:"Fee types, grade structure, scholarships" },
  { key:"ai",       emoji:"🤖", label:"AI configuration",     desc:"Chatbot personas, knowledge, predictions" },
  { key:"lookup",   emoji:"🔧", label:"Lookup values",        desc:"Gender, blood groups, leave types, custom lists" },
];

export function TenantSetupPage() {
  const [tab, setTab] = useState<ConfigTab>("school");
  return (
    <>
      <PageHeader
        title="School configuration"
        subtitle="Your school, your settings. Configure everything your staff and students will use."
      />
      <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:16, alignItems:"start" }}>
        <div className="surface" style={{ padding:10 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display:"flex", gap:10, width:"100%", padding:"11px 12px",
                border:"none", borderRadius:10, cursor:"pointer", textAlign:"left",
                background: tab===t.key ? "var(--navy)" : "transparent",
                color: tab===t.key ? "#fff" : "var(--text)", marginBottom:2,
                alignItems:"flex-start",
              }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{t.emoji}</span>
              <div>
                <div style={{ fontSize:12, fontWeight:600, lineHeight:1.3 }}>{t.label}</div>
                <div style={{ fontSize:10, marginTop:2, opacity:.65, lineHeight:1.4 }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <div>
          {tab==="school"   && <SchoolCampusTab/>}
          {tab==="academic" && <AcademicStructureTab/>}
          {tab==="fee"      && <FeeConfigTab/>}
          {tab==="ai"       && <AiConfigTab/>}
          {tab==="lookup"   && <LookupConfigTab/>}
        </div>
      </div>
    </>
  );
}
