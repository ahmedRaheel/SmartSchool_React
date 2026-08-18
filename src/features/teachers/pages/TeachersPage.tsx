import { ModulePage } from "../../../components/ui/ModulePage";
import { modules } from "../../../mocks/moduleData";

export function TeachersPage() {
  return <ModulePage data={modules.teachers} />;
}
