import { ModulePage } from "../../../components/ui/ModulePage";
import { modules } from "../../../mocks/moduleData";

export function SettingsPage() {
  return <ModulePage data={modules.settings} />;
}
