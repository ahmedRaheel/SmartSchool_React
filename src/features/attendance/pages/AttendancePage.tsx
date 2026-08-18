import { ModulePage } from "../../../components/ui/ModulePage";
import { modules } from "../../../mocks/moduleData";

export function AttendancePage() {
  return <ModulePage data={modules.attendance} />;
}
