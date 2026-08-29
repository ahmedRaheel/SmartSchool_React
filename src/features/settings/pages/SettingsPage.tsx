import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { DepartmentsTab }  from "./tabs/DepartmentsTab";
import { FeeTypesTab }     from "./tabs/FeeTypesTab";
import { SubjectsTab }     from "./tabs/SubjectsTab";
import { RoomsTab }        from "./tabs/RoomsTab";
import { LookupTab }       from "./tabs/LookupTab";
import { FeeStructureTab } from "./tabs/FeeStructureTab";

type Tab = "departments" | "fee-types" | "fee-structure" | "subjects" | "rooms" | "lookup";

const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: "departments",   label: "Departments",    emoji: "🏛️" },
  { key: "subjects",      label: "Subjects",       emoji: "📚" },
  { key: "fee-types",     label: "Fee Types",      emoji: "💳" },
  { key: "fee-structure", label: "Fee Structure",  emoji: "💰" },
  { key: "rooms",         label: "Rooms",          emoji: "🚪" },
  { key: "lookup",        label: "Lookup Values",  emoji: "🔧" },
];

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("departments");

  return (
    <>
      <PageHeader title="Master Setup" subtitle="Configure departments, subjects, fee types, rooms and lookup values" />

      <div className="section-tabs" style={{ marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {tab === "departments"   && <DepartmentsTab />}
      {tab === "subjects"      && <SubjectsTab />}
      {tab === "fee-types"     && <FeeTypesTab />}
      {tab === "fee-structure" && <FeeStructureTab />}
      {tab === "rooms"         && <RoomsTab />}
      {tab === "lookup"        && <LookupTab />}
    </>
  );
}
