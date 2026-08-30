import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { DepartmentsTab }  from "./tabs/DepartmentsTab";
import { FeeTypesTab }     from "./tabs/FeeTypesTab";
import { LookupTab }       from "./tabs/LookupTab";
import { SubjectsTab }     from "./tabs/SubjectsTab";
import { RoomsTab }        from "./tabs/RoomsTab";

type SettingsTab = "departments"|"feetypes"|"lookups"|"subjects"|"rooms";

const TABS: { key: SettingsTab; label: string }[] = [
  { key:"departments", label:"🏢 Departments"   },
  { key:"feetypes",    label:"💰 Fee Types"      },
  { key:"lookups",     label:"🔧 Lookup values"  },
  { key:"subjects",    label:"📖 Subjects"       },
  { key:"rooms",       label:"🚪 Rooms"          },
];

export function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("departments");
  return (
    <>
      <PageHeader title="Settings" subtitle="School configuration — departments, fee types, lookup values"/>
      <div className="section-tabs" style={{ marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} className={tab===t.key?"active":""} onClick={()=>setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {tab==="departments" && <DepartmentsTab/>}
      {tab==="feetypes"    && <FeeTypesTab/>}
      {tab==="lookups"     && <LookupTab/>}
      {tab==="subjects"    && <SubjectsTab/>}
      {tab==="rooms"       && <RoomsTab/>}
    </>
  );
}
