import { useState } from "react";
import { RealModulePage } from "../../../components/ui/RealModulePage";
import { AcademicSetupPage } from "./AcademicSetupPage";

type AcademicWorkspace = "setup" | "subject" | "course-offering" | "teacher-assignment" | "timetable";

const workspaces: ReadonlyArray<{ key: AcademicWorkspace; label: string }> = [
  { key: "setup", label: "Academic setup" },
  { key: "subject", label: "Subjects" },
  { key: "course-offering", label: "Courses" },
  { key: "teacher-assignment", label: "Teacher assignments" },
  { key: "timetable", label: "Timetables" },
];

export function AcademicsPage() {
  const [workspace, setWorkspace] = useState<AcademicWorkspace>("setup");

  return (
    <div className="page-stack">
      <nav className="workspace-tabs" aria-label="Academic workspaces">
        {workspaces.map((item) => (
          <button
            key={item.key}
            type="button"
            className={workspace === item.key ? "active" : ""}
            onClick={() => setWorkspace(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {workspace === "setup" ? (
        <AcademicSetupPage embedded />
      ) : (
        <RealModulePage
          module="academics"
          initialResource={workspace}
          key={workspace}
          title={workspaces.find((item) => item.key === workspace)?.label ?? "Academics"}
          subtitle="School academic setup and timetable management"
        />
      )}
    </div>
  );
}
