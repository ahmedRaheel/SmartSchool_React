import { useEffect, useState } from "react";
import axios from "axios";
import { env } from "../../../config/env";

type W={code:string;name:string;initiators:string[];approvers:string[];steps:string[]};

export function WorkflowCenterPage(){
 const [items,setItems]=useState<W[]>([]); const [error,setError]=useState("");
 useEffect(()=>{axios.get(`${env.apiBaseUrl}/api/workflows/catalog`,
 {headers:{Authorization:`Bearer ${sessionStorage.getItem("access_token")??""}`}})
 .then(r=>setItems(r.data)).catch(e=>setError(e?.message??"Unable to load workflows"));},[]);
 return <div><div className="page-header"><div><span className="eyebrow">Governed operations</span>
 <h1>Workflow Center</h1><p>Admissions, assignments, leave, examinations and operational approvals.</p></div></div>
 {error&&<div className="empty-state">{error}</div>}
 <div className="card-grid">{items.map(w=><section className="panel" key={w.code}><h3>{w.name}</h3>
 <small>{w.code}</small><p><b>Initiators:</b> {w.initiators.join(", ")}</p>
 <p><b>Approvers:</b> {w.approvers.join(", ")}</p>
 <div>{w.steps.map((s,i)=><span key={s} className="badge">{i+1}. {s}</span>)}</div></section>)}</div></div>;
}
