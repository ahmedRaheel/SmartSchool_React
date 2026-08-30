/** Fee structure view — reads from /api/finance/fee-structure */
import { useAuth } from "../../../auth/auth";
import { effectiveTenantId } from "../../../../core/tenant/tenantContext";
import { useQuery } from "@tanstack/react-query";
import * as A from "../../../../core/api/apiAdapter";

export function FeeStructureTab() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user);
  const { data, isLoading } = useQuery({ queryKey:["fee-structure",tid], queryFn: () => A.getFeeStructure(tid) });
  const items = Array.isArray(data) ? data : (data as any)?.items ?? [];

  return (
    <div className="surface">
      <div className="surface-head"><div><h3>Fee structure</h3><p>Per-grade fee assignments</p></div></div>
      {isLoading ? <div style={{padding:20,color:"var(--muted)"}}>Loading…</div> : (
        items.length===0 ? (
          <div style={{ padding:24, color:"var(--muted)", fontSize:12, textAlign:"center" }}>No fee structures defined yet. Configure fee types first, then assign them per grade.</div>
        ) : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>Name</th><th>Code</th><th>Details</th></tr></thead>
              <tbody>
                {items.map((fs:any)=>{
                  let meta:any={}; try{meta=JSON.parse(fs.metadataJson??"{}") }catch{}
                  return <tr key={fs.id}><td><b>{fs.name}</b></td><td><code style={{fontSize:11}}>{fs.code}</code></td><td style={{fontSize:11,color:"var(--muted)"}}>{JSON.stringify(meta).slice(0,80)}</td></tr>
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
