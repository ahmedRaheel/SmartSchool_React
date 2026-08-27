import { useEffect, useState } from "react";
import axios from "axios";
import { Clock3, PlayCircle, Workflow } from "lucide-react";
import { env } from "../../../config/env";
import { useUi } from "../../../components/ui/InteractiveUi";

type WorkflowDefinition = { code: string; name: string; initiators: string[]; approvers: string[]; steps: string[] };

function readWorkflowItems(payload: unknown): WorkflowDefinition[] {
  if (Array.isArray(payload)) return payload as WorkflowDefinition[];
  const envelope = payload as { items?: unknown; value?: unknown } | null;
  if (Array.isArray(envelope?.items)) return envelope.items as WorkflowDefinition[];
  const value = envelope?.value as { items?: unknown } | unknown[] | undefined;
  if (Array.isArray(value)) return value as WorkflowDefinition[];
  if (value && !Array.isArray(value) && Array.isArray((value as { items?: unknown }).items)) return (value as { items: WorkflowDefinition[] }).items;
  return [];
}

export function WorkflowCenterPage() {
  const [items, setItems] = useState<WorkflowDefinition[]>([]);
  const [error, setError] = useState("");
  const { notify } = useUi();

  useEffect(() => {
    const token = localStorage.getItem("access_token") ?? sessionStorage.getItem("access_token") ?? "";
    axios.get(`${env.apiBaseUrl}/api/workflows/catalog`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => setItems(readWorkflowItems(response.data)))
      .catch(error => { setError(error?.message ?? "Unable to load workflows"); notify({ kind: "error", title: "Workflow unavailable", message: "The workflow catalog could not be loaded." }); });
  }, [notify]);

  function start(workflow: WorkflowDefinition) { notify({ kind: "success", title: `${workflow.name} started`, message: "Request created and sent to the next workflow step." }); }

  return <div className="page-stack"><header className="page-header"><div><span className="eyebrow">Governed operations</span><h1>Workflow Center</h1><p>Admissions, academic operations, leave and approval processes in one workspace.</p></div></header>{error && <div className="form-error">{error}</div>}<div className="workflow-cards">{items.map(workflow => <article className="workflow-card" key={workflow.code}><div className="workflow-card-title"><span className="entity-icon"><Workflow size={18}/></span><div><span className="eyebrow">{workflow.code}</span><h3>{workflow.name}</h3></div></div><div className="workflow-meta"><span><b>Initiators</b>{workflow.initiators?.join(", ") || "—"}</span><span><b>Approvers</b>{workflow.approvers?.join(", ") || "—"}</span></div><div className="workflow-steps">{(workflow.steps ?? []).slice(0, 6).map((step, index) => <span key={`${workflow.code}-${index}`}><i>{index + 1}</i>{step}</span>)}</div><div className="workflow-actions"><button className="button primary" onClick={() => start(workflow)}><PlayCircle size={16}/> Start workflow</button><button className="button secondary" onClick={() => notify({ kind: "info", title: workflow.name, message: `${workflow.steps?.length ?? 0} governed steps.` })}><Clock3 size={16}/> View process</button></div></article>)}</div></div>;
}
