import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard } from "../../../components/ui/StatCard";
import { CreditCard, TrendingUp, Users, Zap } from "lucide-react";

const PLANS = [
  { name:"Starter",    price:"$240/mo",  students:"Up to 500",   modules:["Students","Finance","HR","Attendance"],          tenants:4  },
  { name:"Pro",        price:"$960/mo",  students:"Up to 2,000", modules:["All Starter + Admissions, Library, Transport, AI Chatbot"], tenants:18 },
  { name:"Enterprise", price:"$3,200/mo",students:"Unlimited",   modules:["All Pro + AI Tutor, Predictions, Custom RAG, Priority Support"], tenants:5 },
];

export function SubscriptionsPage() {
  return (
    <>
      <PageHeader title="Subscription Plans" subtitle="Manage SaaS plans, billing and module access gates"/>

      <section className="metric-grid" style={{ marginBottom:20 }}>
        <StatCard label="Monthly Recurring Revenue" value="$52.4K" note="↑ 14% YoY"        color="#10B981" bg="#ECFDF5"><TrendingUp size={20}/></StatCard>
        <StatCard label="Active subscriptions"       value="27"    note="Across all plans"  color="#2563EB" bg="#EFF6FF"><CreditCard size={20}/></StatCard>
        <StatCard label="Trial accounts"             value="5"     note="Conversion pipeline"color="#D97706" bg="#FFFBEB"><Users size={20}/></StatCard>
        <StatCard label="Annual run rate"            value="$628K" note="Projected"          color="#8B5CF6" bg="#F5F3FF"><Zap size={20}/></StatCard>
      </section>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:20 }}>
        {PLANS.map(p => (
          <div key={p.name} className="surface" style={{ padding:20 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{p.name}</div>
            <div style={{ fontSize:22, fontWeight:800, color:"var(--navy)", marginBottom:8 }}>{p.price}</div>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:12 }}>{p.students} students</div>
            <div style={{ fontSize:11, color:"var(--text-secondary)", lineHeight:1.65, marginBottom:14 }}>{p.modules[0]}</div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:12, fontWeight:600 }}>{p.tenants} active schools</span>
              <button className="primary" style={{ fontSize:11 }}>Manage</button>
            </div>
          </div>
        ))}
      </div>

      <div className="surface">
        <div className="surface-head"><h3>Revenue trend</h3><p>Monthly MRR over the last 6 months</p></div>
        <div style={{ padding:"0 20px 20px" }}>
          {[
            {month:"Mar",mrr:38400},{month:"Apr",mrr:41200},{month:"May",mrr:44800},
            {month:"Jun",mrr:47600},{month:"Jul",mrr:50100},{month:"Aug",mrr:52400},
          ].map(m => (
            <div key={m.month} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <span style={{ width:32, fontSize:11, color:"var(--muted)", fontWeight:600 }}>{m.month}</span>
              <div style={{ flex:1, height:12, borderRadius:6, background:"var(--surface-2)", overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(m.mrr/52400)*100}%`, background:"#10B981", borderRadius:6, transition:"width .4s" }}/>
              </div>
              <span style={{ width:56, fontSize:11, fontWeight:700, textAlign:"right" }}>${(m.mrr/1000).toFixed(1)}K</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
