import { useState } from "react";

const ROLES = ["Teacher","Student","Parent","Admin Officer","Principal","Driver"];
const COLLECTIONS = ["School handbook","Syllabus guide","Fee policy","Exam calendar","Transport schedule","HR policy"];

interface ChatbotConfig { role:string; persona:string; systemPrompt:string; collections:string[]; }

const DEFAULT_CONFIGS: ChatbotConfig[] = [
  { role:"Student",   persona:"Friendly AI Tutor",          systemPrompt:"You are the Al-Noor AI Tutor. Help students understand their subjects with clear, encouraging explanations. Always relate to the school curriculum.", collections:["Syllabus guide","Exam calendar"] },
  { role:"Parent",    persona:"Helpful Parent Assistant",   systemPrompt:"You are the Al-Noor Parent Assistant. Answer queries about your child's progress, fees, transport, and school events warmly and accurately.", collections:["Fee policy","Transport schedule"] },
  { role:"Teacher",   persona:"Professional Teacher AI",    systemPrompt:"You are the Al-Noor Teacher Assistant. Help with lesson planning, student analysis, attendance insights, and grade book queries.", collections:["Syllabus guide","School handbook"] },
  { role:"Admin Officer",persona:"Efficient Admin AI",      systemPrompt:"You are the Al-Noor Admin Assistant. Answer queries about students, fees, admissions, timetables, and operations concisely.", collections:["Fee policy","School handbook"] },
];

export function AiConfigTab() {
  const [configs, setConfigs] = useState<ChatbotConfig[]>(DEFAULT_CONFIGS);
  const [selected, setSelected] = useState<ChatbotConfig>(configs[0]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  async function save() {
    setSaving(true);
    await new Promise(r=>setTimeout(r,600));
    setConfigs(p=>p.map(c=>c.role===selected.role?selected:c));
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false),2000);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div className="surface" style={{padding:20}}>
        <div style={{marginBottom:14}}>
          <h3 style={{fontSize:14,fontWeight:700,margin:"0 0 4px"}}>AI chatbot configuration</h3>
          <p style={{fontSize:12,color:"var(--muted)",margin:0}}>Configure the AI persona and knowledge base for each user role. The AI will only answer questions within the selected knowledge collections.</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"180px 1fr",gap:14}}>
          {/* Role selector */}
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {configs.map(c=>(
              <button
                key={c.role}
                onClick={()=>setSelected(c)}
                style={{
                  padding:"10px 12px", borderRadius:9, border:"1.5px solid var(--line)",
                  background:selected.role===c.role?"var(--navy)":"var(--surface)",
                  color:selected.role===c.role?"#fff":"var(--text)",
                  fontSize:12,fontWeight:600,cursor:"pointer",textAlign:"left",
                }}
              >
                {c.role}
              </button>
            ))}
          </div>

          {/* Config form */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <label className="human-field">
              <span>Persona name</span>
              <input value={selected.persona} onChange={e=>setSelected(p=>({...p,persona:e.target.value}))}/>
            </label>
            <label className="human-field">
              <span>System prompt</span>
              <textarea
                value={selected.systemPrompt}
                onChange={e=>setSelected(p=>({...p,systemPrompt:e.target.value}))}
                style={{minHeight:120}}
              />
            </label>
            <div>
              <span style={{fontSize:12,fontWeight:700,color:"var(--text)",display:"block",marginBottom:8}}>Knowledge collections</span>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {COLLECTIONS.map(col => {
                  const active = selected.collections.includes(col);
                  return (
                    <button
                      key={col}
                      onClick={()=>setSelected(p=>({...p,collections:active?p.collections.filter(c=>c!==col):[...p.collections,col]}))}
                      style={{
                        padding:"5px 12px",borderRadius:20,fontSize:11,fontWeight:600,cursor:"pointer",
                        border:`1.5px solid ${active?"var(--navy)":"var(--line)"}`,
                        background:active?"var(--navy)":"var(--surface)",
                        color:active?"#fff":"var(--muted)",
                      }}
                    >
                      {col}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button className="primary" onClick={save} disabled={saving}>
                {saving?"Saving…":saved?"Saved ✓":"Save configuration"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prediction models */}
      <div className="surface">
        <div className="surface-head"><div><h3>Prediction models</h3><p>AI models active for your school</p></div></div>
        <div style={{padding:"0 20px 20px"}}>
          {[
            {name:"Dropout Risk v3",type:"DROPOUT_RISK",acc:"91.4%",status:"Active"},
            {name:"Fee Default Predictor",type:"FEE_DEFAULT",acc:"87.2%",status:"Active"},
            {name:"Grade Predictor v2",type:"PERFORMANCE",acc:"88.9%",status:"Active"},
          ].map(m=>(
            <div key={m.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--surface-2)",fontSize:12}}>
              <div><div style={{fontWeight:600}}>{m.name}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:2}}>{m.type} · Accuracy {m.acc}</div></div>
              <span className="status-pill success">{m.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
