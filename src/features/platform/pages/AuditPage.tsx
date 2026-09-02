import { useState } from "react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useQuery } from "@tanstack/react-query";
import * as A from "../../../core/api/apiAdapter";
import { env } from "../../../config/env";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

// Mock audit data since endpoint returns empty in mock mode
const MOCK_AUDIT_LOGS = [
  { id:"al1", code:"AUD-001", name:"Student enrolled", metadataJson: JSON.stringify({ actor:"admin@alnoor.edu", action:"CreateStudent", entity:"Student", entityId:"22222222-2222-2222-2222-222222222222", ipAddress:"192.168.1.1", timestamp:"2026-08-30T14:32:00Z", status:"Success" }) },
  { id:"al2", code:"AUD-002", name:"Payment recorded", metadataJson: JSON.stringify({ actor:"accountant@alnoor.edu", action:"CreatePayment", entity:"Invoice", entityId:"inv1", ipAddress:"192.168.1.2", timestamp:"2026-08-30T14:15:00Z", status:"Success" }) },
  { id:"al3", code:"AUD-003", name:"Staff added",      metadataJson: JSON.stringify({ actor:"admin@alnoor.edu", action:"CreateEmployee", entity:"Employee", entityId:"33333333-3333-3333-3333-333333333333", ipAddress:"192.168.1.1", timestamp:"2026-08-30T13:00:00Z", status:"Success" }) },
  { id:"al4", code:"AUD-004", name:"Login attempt",    metadataJson: JSON.stringify({ actor:"unknown@email.com", action:"Login", entity:"User", entityId:null, ipAddress:"203.0.113.42", timestamp:"2026-08-30T11:00:00Z", status:"Failed" }) },
  { id:"al5", code:"AUD-005", name:"Fee type created", metadataJson: JSON.stringify({ actor:"admin@alnoor.edu", action:"CreateFeeType", entity:"FeeType", entityId:"ft1", ipAddress:"192.168.1.1", timestamp:"2026-08-29T09:00:00Z", status:"Success" }) },
];

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function AuditPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey:["audit-logs",tid], queryFn: () => A.getAuditLogs(tid) });
  const rawItems = (data as any)?.items ?? (data as any) ?? [];
  const items    = rawItems.length === 0 && env.useMocks ? MOCK_AUDIT_LOGS : rawItems;
  const filtered = items.filter((l:any) => `${l.name} ${l.code}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="Audit Log" subtitle="Complete system activity trail"/>
      <div className="surface">
        <div className="surface-head">
          <label className="search-box" style={{ maxWidth:300 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search audit logs…"/>
          </label>
        </div>
        {isLoading ? <div style={{ padding:48, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Ref</th><th>Action</th><th>Actor</th><th>Entity</th><th>IP</th><th>Time</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((l:any) => {
                  const meta = parseMeta(l.metadataJson);
                  return (
                    <tr key={l.id}>
                      <td><code style={{ fontSize:10 }}>{l.code}</code></td>
                      <td><b style={{ fontSize:11 }}>{meta.action ?? l.name}</b></td>
                      <td style={{ fontSize:11 }}>{meta.actor ?? "—"}</td>
                      <td style={{ fontSize:11 }}>{meta.entity ?? "—"}{meta.entityId && <span style={{ color:"var(--muted)" }}> ···{String(meta.entityId).slice(-6)}</span>}</td>
                      <td><code style={{ fontSize:10 }}>{meta.ipAddress ?? "—"}</code></td>
                      <td style={{ fontSize:10, color:"var(--muted)" }}>{meta.timestamp ? new Date(meta.timestamp).toLocaleString() : "—"}</td>
                      <td><span className={`status-pill ${meta.status==="Success"?"success":"danger"}`} style={{ fontSize:9 }}>{meta.status ?? "—"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer"><span>{filtered.length} audit entries</span></div>
      </div>
    </>
  );
}
