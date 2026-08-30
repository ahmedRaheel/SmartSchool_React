import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { useTenants } from "../../../core/api/queries";
import { DollarSign } from "lucide-react";

function parseMeta(json?: string|null) { try { return JSON.parse(json ?? "{}"); } catch { return {}; } }

export function SubscriptionsPage() {
  const { data, isLoading } = useTenants();
  const tenants = (data as any)?.items ?? (data as any) ?? [];

  const PLANS: Record<string,{price:number;color:string;bg:string}> = {
    Starter:    { price:  99, color:"#6B7280", bg:"#F9FAFB" },
    Pro:        { price: 249, color:"#2563EB", bg:"#EFF6FF" },
    Enterprise: { price: 799, color:"#7C3AED", bg:"#F5F3FF" },
    Trial:      { price:   0, color:"#D97706", bg:"#FFFBEB" },
  };

  const mrr = tenants.reduce((a:number, t:any) => {
    const meta = parseMeta(t.metadataJson);
    const plan = PLANS[meta.subscriptionPlan ?? "Starter"];
    return a + (meta.status==="ACTIVE" ? (plan?.price ?? 0) : 0);
  }, 0);

  return (
    <>
      <PageHeader title="Subscriptions" subtitle="SaaS subscription and billing management"/>
      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Monthly MRR"   value={`$${mrr.toLocaleString()}`} note="Active plans" color="#10B981" bg="#ECFDF5"><DollarSign size={20}/></StatCard>
        <StatCard label="Active schools" value={String(tenants.filter((t:any)=>parseMeta(t.metadataJson).status==="ACTIVE").length)} note="" color="#2563EB" bg="#EFF6FF"><DollarSign size={20}/></StatCard>
        <StatCard label="Trial"         value={String(tenants.filter((t:any)=>parseMeta(t.metadataJson).status==="TRIAL").length)} note="" color="#D97706" bg="#FFFBEB"><DollarSign size={20}/></StatCard>
        <StatCard label="Total tenants" value={String(tenants.length)} note="" color="#0F2241" bg="#EEF2FF"><DollarSign size={20}/></StatCard>
      </section>

      <div className="surface">
        <div className="surface-head"><h3>Subscription plans</h3></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, padding:"0 20px 20px" }}>
          {Object.entries(PLANS).map(([plan, cfg]) => {
            const count = tenants.filter((t:any) => parseMeta(t.metadataJson).subscriptionPlan === plan).length;
            return (
              <div key={plan} style={{ padding:"16px 18px", borderRadius:12, border:`1.5px solid ${cfg.color}30`, background:cfg.bg }}>
                <div style={{ fontSize:11, color:cfg.color, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>{plan}</div>
                <div style={{ fontSize:22, fontWeight:800, color:cfg.color }}>{count}<span style={{ fontSize:12, fontWeight:400, color:"var(--muted)" }}> schools</span></div>
                <div style={{ fontSize:13, fontWeight:700, color:cfg.color, marginTop:4 }}>${cfg.price}<span style={{ fontSize:11, fontWeight:400 }}>/mo</span></div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:4 }}>MRR contribution: <b>${(cfg.price*count).toLocaleString()}</b></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="surface">
        <div className="surface-head"><h3>All subscriptions</h3></div>
        {isLoading ? <div style={{ padding:30, textAlign:"center", color:"var(--muted)" }}>Loading…</div> : (
          <div className="table-wrap">
            <table className="premium-table">
              <thead><tr><th>School</th><th>Plan</th><th>Students</th><th>MRR</th><th>Status</th></tr></thead>
              <tbody>
                {tenants.map((t:any) => {
                  const meta = parseMeta(t.metadataJson);
                  const plan = PLANS[meta.subscriptionPlan ?? "Starter"] ?? PLANS["Starter"];
                  return (
                    <tr key={t.id}>
                      <td><b>{t.name}</b><div style={{fontSize:10,color:"var(--muted)"}}>{meta.city}</div></td>
                      <td><span style={{ padding:"2px 8px", borderRadius:5, fontSize:10, fontWeight:600, background:plan.bg, color:plan.color }}>{meta.subscriptionPlan ?? "Starter"}</span></td>
                      <td>{meta.studentCount?.toLocaleString() ?? "—"}</td>
                      <td><b>${plan.price}/mo</b></td>
                      <td><span className={`status-pill ${meta.status==="ACTIVE"?"success":meta.status==="TRIAL"?"warning":"gray"}`}>{meta.status ?? "ACTIVE"}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
