import { PageHeader } from "../../../components/ui/PageHeader";
import { AiConfigTab } from "./tabs/AiConfigTab";

export function AiConfigPage() {
  return (
    <>
      <PageHeader
        title="AI Configuration"
        subtitle="Manage knowledge bases, LLM models, chatbot personas and AI feature settings"
      />
      <AiConfigTab />
    </>
  );
}
