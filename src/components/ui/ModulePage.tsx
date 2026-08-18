import {useMemo,useState,type FormEvent} from "react";
import {ArrowUpRight,ChevronRight,Download,Filter,Lightbulb,Search,Sparkles} from "lucide-react";
import type {ModuleData,ModuleRecord} from "../../mocks/moduleData";
import {Modal,useUi} from "./InteractiveUi";
import {PageHeader} from "./PageHeader";

export function ModulePage({data}:{data:ModuleData}){
 const{notify}=useUi();const[records,setRecords]=useState(data.records);const[query,setQuery]=useState("");const[status,setStatus]=useState("All");
 const[selected,setSelected]=useState<ModuleRecord|null>(null);const[createOpen,setCreateOpen]=useState(false);const[insightsOpen,setInsightsOpen]=useState(false);
 const statuses=useMemo(()=>["All",...Array.from(new Set(records.map(x=>x.status)))],[records]);
 const filtered=useMemo(()=>records.filter(x=>[x.title,x.subtitle,x.meta,x.status,x.value].join(" ").toLowerCase().includes(query.toLowerCase())&&(status==="All"||x.status===status)),[records,query,status]);
 function create(event:FormEvent<HTMLFormElement>){event.preventDefault();const f=new FormData(event.currentTarget);const title=String(f.get("title"));
  setRecords(v=>[{id:crypto.randomUUID(),title,subtitle:String(f.get("subtitle")),meta:String(f.get("meta")||`MOCK-${v.length+1}`),status:"Active",value:String(f.get("value")||"Ready")},...v]);setCreateOpen(false);notify(`${title} added to mock data.`)}
 function exportCsv(){const csv=[data.columns.join(","),...filtered.map(x=>[x.title,x.subtitle,x.meta,x.status,x.value].map(v=>`"${String(v).replaceAll('"','""')}"`).join(","))].join("\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));const a=document.createElement("a");a.href=url;a.download=`${data.title.replaceAll(" ","-")}.csv`;a.click();URL.revokeObjectURL(url);notify("Current view exported.")}
 return <>
  <PageHeader title={data.title} subtitle={data.subtitle} action={<button className="primary" onClick={()=>setCreateOpen(true)}>+ {data.action}</button>}/>
  <section className="metric-grid">{data.metrics.map(m=><button className="metric-card metric-button" key={m.label} onClick={()=>notify(`${m.label}: ${m.value} — ${m.note}`)}><div className="metric-label">{m.label}</div><div className="metric-value">{m.value}</div><div className={`metric-note ${m.trend??"neutral"}`}>{m.trend==="up"&&<ArrowUpRight size={14}/>} {m.note}</div></button>)}</section>
  <section className="module-layout"><article className="surface data-surface">
   <div className="surface-head"><div><h3>Overview</h3><p>Click any record to open details</p></div><button className="icon-button" onClick={exportCsv}><Download size={18}/></button></div>
   <div className="data-toolbar"><label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`Search ${data.title.toLowerCase()}...`}/></label>
    <label className="filter-select"><Filter size={16}/><select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(x=><option key={x}>{x}</option>)}</select></label></div>
   <div className="table-wrap"><table className="premium-table clickable-table"><thead><tr>{data.columns.map(c=><th key={c}>{c}</th>)}</tr></thead><tbody>
    {filtered.map(x=><tr key={x.id} tabIndex={0} onClick={()=>setSelected(x)} onKeyDown={e=>e.key==="Enter"&&setSelected(x)}><td><b>{x.title}</b><small>{x.subtitle}</small></td><td>{x.subtitle}</td><td>{x.meta}</td><td><span className={`status-pill ${x.status.toLowerCase().replaceAll(" ","-")}`}>{x.status}</span></td><td><span className="table-value">{x.value}</span><ChevronRight size={15}/></td></tr>)}
    {!filtered.length&&<tr><td colSpan={5}><div className="empty-state">No records found.</div></td></tr>}
   </tbody></table></div><div className="table-footer"><span>Showing {filtered.length} of {records.length} mock records</span><button className="text-button" onClick={exportCsv}>Export</button></div>
  </article><aside className="surface insight-panel"><div className="insight-icon"><Sparkles size={20}/></div><span className="eyebrow">Smart insights</span><h3>What needs attention</h3><p className="muted">Interactive mock intelligence.</p>
   <div className="insight-list">{data.insights.map(i=><button className="insight-item insight-button" key={i} onClick={()=>notify(i)}><Lightbulb size={17}/><span>{i}</span></button>)}</div>
   <button className="soft-button" onClick={()=>setInsightsOpen(true)}>View recommendations <ArrowUpRight size={15}/></button></aside></section>
  <Modal open={!!selected} title={selected?.title??"Record"} onClose={()=>setSelected(null)}>{selected&&<div className="detail-body"><div className="detail-grid"><div><span>Detail</span><b>{selected.subtitle}</b></div><div><span>Reference</span><b>{selected.meta}</b></div><div><span>Status</span><b>{selected.status}</b></div><div><span>Value</span><b>{selected.value}</b></div></div><div className="detail-note">Backend-ready mock detail view.</div><div className="modal-actions"><button className="secondary" onClick={()=>notify("Edit action ready.")}>Edit</button><button className="primary" onClick={()=>{notify("Mock record saved.");setSelected(null)}}>Save</button></div></div>}</Modal>
  <Modal open={createOpen} title={data.action} onClose={()=>setCreateOpen(false)}><form className="mock-form" onSubmit={create}><label>Title<input name="title" required/></label><label>Detail<input name="subtitle" required/></label><div className="form-grid"><label>Reference<input name="meta"/></label><label>Value<input name="value"/></label></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setCreateOpen(false)}>Cancel</button><button className="primary">Save mock record</button></div></form></Modal>
  <Modal open={insightsOpen} title={`${data.title} recommendations`} onClose={()=>setInsightsOpen(false)}><div className="recommendation-list">{data.insights.map((i,n)=><div key={i}><span>{n+1}</span><div><b>{i}</b><p>Action is ready for backend workflow binding.</p></div></div>)}</div></Modal>
 </>;
}
