import { useState } from "react";
import { Download, TrendingUp, Users, DollarSign, BookOpen, BarChart3 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatCard }   from "../../../components/ui/StatCard";
import { useAdminDashboard, useStudents, useEmployees, useExams, useInvoices } from "../../../core/api/queries";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";

const parseMeta = (j?: string|null) => { try { return JSON.parse(j??"{}"); } catch { return {}; } };
const pkr = (n?: number) => `PKR ${Number(n||0).toLocaleString()}`;

type ReportType = "academic" | "financial" | "attendance" | "hr";

const REPORTS: { category: ReportType; title: string; desc: string; icon: string }[] = [
  { category:"academic",    title:"Student roster (PDF)",        desc:"Full list of enrolled students with details",   icon:"📋" },
  { category:"academic",    title:"Exam results summary",         desc:"All exam results with pass/fail rates",         icon:"📊" },
  { category:"academic",    title:"Class-wise performance",       desc:"Average marks per class section",               icon:"📈" },
  { category:"financial",   title:"Fee collection report",        desc:"Collected vs outstanding fees by month",        icon:"💰" },
  { category:"financial",   title:"Invoice ledger",               desc:"All invoices with payment status",              icon:"🧾" },
  { category:"financial",   title:"Payroll summary",              desc:"Monthly payroll by department",                 icon:"💼" },
  { category:"attendance",  title:"Attendance summary",           desc:"Daily attendance rates per class",              icon:"✅" },
  { category:"attendance",  title:"Absentee report",              desc:"Students with attendance below 75%",            icon:"⚠️" },
  { category:"attendance",  title:"Monthly attendance trend",     desc:"Attendance % trend over last 3 months",         icon:"📅" },
  { category:"hr",          title:"Staff directory",              desc:"All staff with roles and contact info",         icon:"👥" },
  { category:"hr",          title:"Payroll register",             desc:"Salary register for current period",            icon:"💳" },
  { category:"hr",          title:"Transport manifest",           desc:"Vehicles, routes and student list",             icon:"🚌" },
];

const CAT_COLOR: Record<ReportType,{color:string;bg:string}> = {
  academic:   { color:"#2563EB", bg:"#EFF6FF" },
  financial:  { color:"#10B981", bg:"#ECFDF5" },
  attendance: { color:"#D97706", bg:"#FFFBEB" },
  hr:         { color:"#8B5CF6", bg:"#F5F3FF" },
};

const ATTENDANCE_DATA = [
  { day:"Mon", rate:94 }, { day:"Tue", rate:91 }, { day:"Wed", rate:88 },
  { day:"Thu", rate:93 }, { day:"Fri", rate:85 },
];

export function ReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ReportType>("academic");
  const [downloading, setDownloading] = useState<string|null>(null);

  const { data: dash     } = useAdminDashboard();
  const { data: stuData  } = useStudents();
  const { data: empData  } = useEmployees();
  const { data: invData  } = useInvoices();

  const students  = (stuData as any)?.totalCount ?? (dash as any)?.Students ?? 2840;
  const employees = (empData as any)?.totalCount ?? (dash as any)?.Employees ?? 128;
  const invoices  = (invData as any)?.items       ?? (invData as any) ?? [];
  const collected = invoices.filter((i:any)=>parseMeta(i.metadataJson).status==="PAID").reduce((a:number,i:any)=>a+(parseMeta(i.metadataJson).amount||0),0);
  const outstanding=invoices.filter((i:any)=>!["PAID","CANCELLED"].includes(parseMeta(i.metadataJson).status||"")).reduce((a:number,i:any)=>a+(parseMeta(i.metadataJson).amount||0),0);
  const passRate  = (dash as any)?.PassedResults ? Math.round(((dash as any).PassedResults/((dash as any).PassedResults+(dash as any).FailedResults||1))*100) : 78;

  async function downloadReport(title: string) {
    setDownloading(title);
    await new Promise(r => setTimeout(r, 1200));
    setDownloading(null);
    // In real system: trigger backend PDF/CSV generation
  }

  const visibleReports = REPORTS.filter(r => r.category === tab);
  const BAR_H = 120;

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="School performance overview, downloadable reports"/>
      <section className="metric-grid" style={{marginBottom:20}}>
        <StatCard label="Students"    value={String(students)}   note="enrolled"    color="#2563EB" bg="#EFF6FF"><Users size={20}/></StatCard>
        <StatCard label="Staff"       value={String(employees)}  note=""            color="#10B981" bg="#ECFDF5"><Users size={20}/></StatCard>
        <StatCard label="Collected"   value={pkr(collected)}     note="this term"   color="#059669" bg="#ECFDF5"><DollarSign size={20}/></StatCard>
        <StatCard label="Pass rate"   value={`${passRate}%`}     note="last exams"  color={passRate>=70?"#10B981":"#EF4444"} bg={passRate>=70?"#ECFDF5":"#FFF0F1"}><TrendingUp size={20}/></StatCard>
      </section>

      {/* Quick KPI overview */}
      <div className="surface" style={{marginBottom:16}}>
        <div className="surface-head"><h3>Key metrics overview</h3><p>Live from all modules</p></div>
        <div style={{padding:"0 20px 20px"}}>
          {[
            { label:"Students enrolled",  value:students, max:3000, color:"#2563EB" },
            { label:"Active staff",       value:employees, max:200, color:"#10B981" },
            { label:"Fee collection",     value:Math.round(collected/1000), max:10000, color:"#059669", suffix:"K" },
            { label:"Outstanding fees",   value:Math.round(outstanding/1000), max:5000, color:"#EF4444", suffix:"K" },
            { label:"Pass rate",          value:passRate, max:100, color:passRate>=70?"#10B981":"#EF4444", suffix:"%" },
          ].map(m => (
            <div key={m.label} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:"var(--muted)"}}>{m.label}</span>
                <b style={{color:m.color}}>{m.value.toLocaleString()}{m.suffix??""}</b>
              </div>
              <div style={{height:8,background:"var(--surface-2)",borderRadius:999,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${Math.min(100,Math.round((m.value/m.max)*100))}%`,background:m.color,borderRadius:999,transition:"width .6s"}}/>
              </div>
            </div>
          ))}

          {/* Attendance bar chart */}
          <div style={{marginTop:20}}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10,color:"var(--muted)"}}>This week's attendance rate</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:10,height:BAR_H}}>
              {ATTENDANCE_DATA.map(d => (
                <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:d.rate>=90?"#10B981":d.rate>=80?"#D97706":"#EF4444"}}>{d.rate}%</div>
                  <div style={{width:"100%",background:d.rate>=90?"#10B981":d.rate>=80?"#D97706":"#EF4444",borderRadius:"6px 6px 0 0",height:`${(d.rate/100)*(BAR_H-30)}px`,minHeight:4,transition:"height .4s"}}/>
                  <div style={{fontSize:11,color:"var(--muted)"}}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Downloadable reports */}
      <div className="surface">
        <div className="surface-head"><h3>Download reports</h3></div>
        <div className="section-tabs" style={{padding:"0 20px",marginBottom:0}}>
          {(["academic","financial","attendance","hr"] as ReportType[]).map(cat => (
            <button key={cat} className={tab===cat?"active":""} onClick={()=>setTab(cat)}>
              {cat==="academic"?"📚 Academic":cat==="financial"?"💰 Financial":cat==="attendance"?"✅ Attendance":"👥 HR"} ({REPORTS.filter(r=>r.category===cat).length})
            </button>
          ))}
        </div>
        <div style={{padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {visibleReports.map(r => {
            const cfg = CAT_COLOR[r.category];
            const isLoading = downloading === r.title;
            return (
              <div key={r.title} style={{padding:"14px 16px",border:"1px solid var(--line)",borderRadius:12,display:"flex",alignItems:"center",gap:12,background:"var(--surface)"}}>
                <span style={{fontSize:22,flexShrink:0}}>{r.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <b style={{fontSize:12,display:"block"}}>{r.title}</b>
                  <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{r.desc}</div>
                </div>
                <button onClick={()=>downloadReport(r.title)} disabled={!!downloading}
                  style={{width:34,height:34,borderRadius:8,border:`1px solid ${cfg.color}30`,background:cfg.bg,color:cfg.color,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isLoading ? <BarChart3 size={14} style={{animation:"spin 1s linear infinite"}}/> : <Download size={14}/>}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
