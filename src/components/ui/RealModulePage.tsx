import axios from "axios";
import { Building2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { env } from "../../config/env";
import { api } from "../../core/api/ApiClient";
import { getErrorMessage } from "../../core/api/errorMessage";
import { useAuth } from "../../features/auth/auth";
import { Modal, useUi } from "./InteractiveUi";
import { PageHeader } from "./PageHeader";

type Row = Record<string, unknown>;
type OpenApiOperation = { requestBody?: unknown; responses?: unknown };
type OpenApiPath = Record<string, OpenApiOperation>;
type OpenApiSchema = { type?: string; format?: string; properties?: Record<string, OpenApiSchema>; required?: string[]; $ref?: string; enum?: unknown[]; nullable?: boolean };
type OpenApiSpec = { paths: Record<string, OpenApiPath>; components?: { schemas?: Record<string, OpenApiSchema> } };

const SYSTEM_FIELDS = new Set(["id", "tenantId", "rowVersion", "createdAt", "updatedAt", "isActive"]);

function pretty(value: string): string { return value.replaceAll("-", " ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, value => value.toUpperCase()); }
function unwrap(data: any): Row[] { const value = data?.value ?? data; return value?.items ?? value?.Items ?? (Array.isArray(value) ? value : []); }
function display(value: unknown): string { if (value === null || value === undefined || value === "") return "—"; if (typeof value === "boolean") return value ? "Yes" : "No"; return typeof value === "object" ? JSON.stringify(value) : String(value); }
function isTechnicalIdentifier(key: string): boolean {
  const normalized = key.toLowerCase();
  return normalized === "id" || normalized === "tenantid" || normalized === "userid" || normalized.endsWith("id");
}

function rowId(row: Row): string | undefined { const value = row.id ?? Object.entries(row).find(([key]) => key.toLowerCase().endsWith("id"))?.[1]; return value ? String(value) : undefined; }

/** Generic live-data workspace used by database-backed SmartSchool modules. */
export function RealModulePage({ module, initialResource, title, subtitle }: { module: string; initialResource?: string; title?: string; subtitle?: string }) {
  const { notify, beginBusy, confirm } = useUi(); const { user } = useAuth();
  const [spec, setSpec] = useState<OpenApiSpec | null>(null); const [resource, setResource] = useState(initialResource ?? "");
  const [rows, setRows] = useState<Row[]>([]); const [query, setQuery] = useState(""); const [selected, setSelected] = useState<Row | null>(null);
  const [editing, setEditing] = useState(false); const [draft, setDraft] = useState<Row>({}); const [loading, setLoading] = useState(false);
  const [tenants, setTenants] = useState<Row[]>([]); const isSuperAdmin = user?.roles.includes("SuperAdmin") ?? false;
  const sessionTenant = sessionStorage.getItem("tenant_id") || env.tenantId;
  const [selectedTenant, setSelectedTenant] = useState(sessionStorage.getItem("selected_tenant_id") || sessionTenant);

  useEffect(() => { axios.get<OpenApiSpec>(`${env.apiBaseUrl}/openapi/v1.json`).then(response => setSpec(response.data))
    .catch(error => notify({ kind: "error", title: "API contract unavailable", message: getErrorMessage(error, "OpenAPI could not be loaded.") })); }, []);

  const resources = useMemo(() => {
    if (!spec) return [];
    const prefix = `/api/${module}/`;
    return [...new Set(Object.keys(spec.paths).filter(path => path.startsWith(prefix) && !path.includes("{")).map(path => path.slice(prefix.length)).filter(Boolean))].sort();
  }, [spec, module]);
  useEffect(() => { if (resources.length && !resources.includes(resource)) setResource(initialResource && resources.includes(initialResource) ? initialResource : resources[0]); }, [resources, resource, initialResource]);

  const basePath = resource ? `/api/${module}/${resource}` : "";
  const operations = spec?.paths[basePath] ?? {};
  const canCreate = Boolean(operations.post); const canRead = Boolean(operations.get);
  const itemPath = basePath ? `${basePath}/{id}` : ""; const itemOperations = spec?.paths[itemPath] ?? {};
  const canUpdate = Boolean(itemOperations.put || itemOperations.patch); const canDelete = Boolean(itemOperations.delete);

  async function load(): Promise<void> {
    if (!basePath || !canRead) return;
    setLoading(true); const endBusy = beginBusy(`Loading ${pretty(resource || module)}…`);
    try { const { data } = await api.get(basePath, { params: { tenantId: selectedTenant, page: 1, pageSize: 100 } }); setRows(unwrap(data)); }
    catch (error) { setRows([]); notify({ kind: "error", title: `Unable to load ${pretty(resource)}`, message: getErrorMessage(error) }); }
    finally { setLoading(false); endBusy(); }
  }
  useEffect(() => { void load(); }, [basePath, selectedTenant]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    api.get("/api/tenancy/tenant", { params: { tenantId: sessionTenant, page: 1, pageSize: 250 } })
      .then(response => setTenants(unwrap(response.data))).catch(() => setTenants([]));
  }, [isSuperAdmin, sessionTenant]);

  const filtered = useMemo(() => rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const columns = useMemo(() => rows[0] ? Object.keys(rows[0]).filter(key => !isTechnicalIdentifier(key) && !["photo", "rowVersion", "content"].includes(key)).slice(0, 7) : [], [rows]);
  const requestSchema = useMemo(() => { const operation = (selected ? (itemOperations.put || itemOperations.patch) : operations.post) as any; const schema = operation?.requestBody?.content?.["application/json"]?.schema as OpenApiSchema | undefined; return schema?.$ref ? spec?.components?.schemas?.[schema.$ref.split("/").at(-1) ?? ""] : schema; }, [selected, itemOperations.put, itemOperations.patch, operations.post, spec]);
  const requestFields = useMemo(() => Object.keys(requestSchema?.properties ?? {}).filter(key => !SYSTEM_FIELDS.has(key)), [requestSchema]);
  const editableFields = useMemo(() => { const source = selected ?? rows[0]; const contractFields = requestFields.length ? requestFields : (source ? Object.keys(source) : []); return contractFields.filter(key => !SYSTEM_FIELDS.has(key) && key.toLowerCase() !== "code").slice(0, 40); }, [selected, rows, requestFields]);
  const requiredFields = new Set(requestSchema?.required ?? []);
  function fieldSchema(field: string): OpenApiSchema { const raw=requestSchema?.properties?.[field] ?? {}; return raw.$ref ? (spec?.components?.schemas?.[raw.$ref.split("/").at(-1) ?? ""] ?? raw) : raw; }
  function updateField(field: string, value: unknown): void {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function updateFileField(field: string, file: File | null): Promise<void> {
    if (!file) {
      updateField(field, null);
      return;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    bytes.forEach((value) => { binary += String.fromCharCode(value); });
    updateField(field, btoa(binary));

    if (field.toLowerCase() === "photo") {
      setDraft((current) => ({
        ...current,
        photo: btoa(binary),
        photoContentType: file.type || "application/octet-stream",
        photoFileName: file.name,
      }));
    }
  }

  function renderField(field:string) { const schema=fieldSchema(field); const value=draft[field]; const label=<span>{pretty(field)}{requiredFields.has(field) && <i className="required-mark"> *</i>}</span>; if(schema.enum?.length) return <label className="human-field" key={field}>{label}<select value={String(value ?? "")} onChange={e=>updateField(field,e.target.value)}><option value="">Select {pretty(field)}</option>{schema.enum.map(option=><option key={String(option)} value={String(option)}>{pretty(String(option))}</option>)}</select></label>; if(schema.format==="byte" || field.toLowerCase()==="photo") return <label className="human-field field-wide" key={field}>{label}<input type="file" accept={field.toLowerCase()==="photo" ? "image/*" : undefined} onChange={e=>void updateFileField(field,e.target.files?.[0] ?? null)}/>{draft[`${field}FileName`] && <small>{String(draft[`${field}FileName`])}</small>}</label>; if(schema.type==="boolean") return <label className="human-field checkbox-field" key={field}>{label}<input type="checkbox" checked={Boolean(value)} onChange={e=>updateField(field,e.target.checked)}/></label>; const lower=field.toLowerCase(); if(lower.includes("description")||lower.includes("notes")||lower.includes("reason")||lower.includes("instructions")||lower.includes("metadata")) return <label className="human-field field-wide" key={field}>{label}<textarea value={String(value??"")} onChange={e=>updateField(field,e.target.value)} placeholder={`Enter ${pretty(field).toLowerCase()}`}/></label>; const type=schema.format==="date"||lower.endsWith("date")?"date":schema.format==="date-time"||lower.endsWith("at")?"datetime-local":schema.format==="email"||lower.includes("email")?"email":lower.includes("phone")?"tel":schema.type==="integer"||schema.type==="number"?"number":"text"; return <label className="human-field" key={field}>{label}<input required={requiredFields.has(field)} type={type} value={String(value??"")} onChange={e=>updateField(field,type==="number"?(e.target.value===""?null:Number(e.target.value)):e.target.value)} placeholder={`Enter ${pretty(field).toLowerCase()}`}/></label>; }

  function selectTenant(value: string): void { setSelectedTenant(value); sessionStorage.setItem("selected_tenant_id", value); }
  function create(): void { setSelected(null); setDraft({ tenantId: selectedTenant }); setEditing(true); }
  function edit(row: Row): void { setSelected(row); setDraft({ ...row, tenantId: selectedTenant }); setEditing(true); }

  async function save(): Promise<void> {
    const missing=editableFields.filter(field=>requiredFields.has(field) && (draft[field]===undefined || draft[field]===null || String(draft[field]).trim()==="")); if(missing.length){notify({kind:"error",title:"Required information missing",message:`Complete: ${missing.map(pretty).join(", ")}.`});return;}
    const endBusy = beginBusy(selected ? "Saving changes…" : "Creating record…");
    try {
      const id = selected ? rowId(selected) : undefined; const body = { ...draft, tenantId: selectedTenant };
      if (id) await api.put(`${basePath}/${id}`, body); else await api.post(basePath, body);
      notify({ kind: "success", title: id ? "Changes saved" : "Record created", message: `${pretty(resource)} was saved successfully.` });
      setEditing(false); setSelected(null); await load();
    } catch (error) { notify({ kind: "error", title: "Save failed", message: getErrorMessage(error) }); } finally { endBusy(); }
  }

  async function remove(row: Row): Promise<void> {
    const id = rowId(row); if (!id) return; const approved = await confirm({ title: `Delete ${pretty(resource)}`, message: "This action cannot be undone. The selected record will be permanently removed.", confirmText: "Delete", danger: true }); if (!approved) return;
    const endBusy = beginBusy("Deleting record…"); try { await api.delete(`${basePath}/${id}`, { params: { tenantId: selectedTenant } }); notify({ kind: "success", title: "Record deleted", message: "The record was removed successfully." }); await load(); }
    catch (error) { notify({ kind: "error", title: "Delete failed", message: getErrorMessage(error) }); } finally { endBusy(); }
  }

  return <>
    <PageHeader title={title ?? pretty(module)} subtitle={subtitle ?? (isSuperAdmin ? "Operate within the selected tenant using the live backend contract" : "Live school operations and records")}
      action={<div className="page-actions">{isSuperAdmin && <label className="tenant-context"><Building2 size={16}/><span>Tenant</span><select value={selectedTenant} onChange={e => selectTenant(e.target.value)}>{!tenants.length && <option value={selectedTenant}>{selectedTenant}</option>}{tenants.map(tenant => { const id = String(tenant.id ?? tenant.tenantId ?? ""); return <option key={id} value={id}>{display(tenant.name ?? tenant.code ?? id)}</option>; })}</select></label>}{canCreate && <button className="primary" onClick={create}><Plus size={16}/> Add {pretty(resource || "record")}</button>}</div>} />
    <section className="surface data-surface"><div className="surface-head"><div><h3>{pretty(resource || module)}</h3><p>{resources.length} backend resources available in this module</p></div><button className="icon-button" title="Refresh" onClick={() => void load()}><RefreshCw size={16}/></button></div>
      <div className="data-toolbar"><select className="filter-select" value={resource} onChange={e => setResource(e.target.value)}>{resources.map(value => <option key={value} value={value}>{pretty(value)}</option>)}</select><label className="search-box"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search current records"/></label></div>
      <div className="table-wrap"><table className="premium-table"><thead><tr>{columns.map(column => <th key={column}>{pretty(column)}</th>)}{(canUpdate || canDelete) && <th>Actions</th>}</tr></thead><tbody>{filtered.map((row,index) => <tr key={rowId(row) ?? index} onClick={() => setSelected(row)}>{columns.map(column => <td key={column}>{display(row[column])}</td>)}{(canUpdate || canDelete) && <td className="row-actions">{canUpdate && <button className="icon-button" title="Edit" onClick={event => { event.stopPropagation(); edit(row); }}><Pencil size={14}/></button>}{canDelete && <button className="icon-button" title="Delete" onClick={event => { event.stopPropagation(); void remove(row); }}><Trash2 size={14}/></button>}</td>}</tr>)}{!filtered.length && <tr><td colSpan={Math.max(1, columns.length + 1)}><div className="empty-state">{loading ? "Loading live data…" : resources.length ? "No records found." : "No compatible API resources are exposed for this module."}</div></td></tr>}</tbody></table></div><div className="table-footer">{filtered.length} live records</div>
    </section>
    <Modal open={!!selected && !editing} title={pretty(resource)} onClose={() => setSelected(null)}>{selected && <div className="detail-grid">{Object.entries(selected).filter(([key]) => !isTechnicalIdentifier(key)).map(([key,value]) => <div key={key}><span>{pretty(key)}</span><b>{display(value)}</b></div>)}</div>}</Modal>
    <Modal open={editing} title={`${selected ? "Edit" : "Add"} ${pretty(resource)}`} onClose={() => setEditing(false)}><div className="human-form">{isSuperAdmin && <div className="form-context"><Building2 size={18}/><div><b>Tenant context</b><span>{selectedTenant}</span></div></div>}<div className="human-form-grid">{editableFields.map(renderField)}</div></div><div className="modal-actions"><button className="secondary" onClick={() => setEditing(false)}>Cancel</button><button className="primary" onClick={() => void save()}>{selected ? "Save changes" : "Create record"}</button></div></Modal>
  </>;
}
