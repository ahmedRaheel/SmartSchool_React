/**
 * SettingsPage — School-level feature toggles and preferences.
 * NOT configuration data (that lives in Setup). This is about enabling/
 * disabling features and setting school-wide preferences.
 */
import { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { useAuth } from "../../auth/auth";
import { effectiveTenantId } from "../../../core/tenant/tenantContext";
import { env } from "../../../config/env";
import * as A from "../../../core/api/apiAdapter";

// ── Feature toggle types ───────────────────────────────────────────────────────
interface Toggle {
  key:      string;
  label:    string;
  desc:     string;
  default:  boolean;
  group:    string;
  badge?:   string;
}

const TOGGLES: Toggle[] = [
  // AI & Chatbots
  { key:"ai.ragAssistant",     label:"RAG Knowledge Assistant",    desc:"School-wide AI chatbot that answers from uploaded documents (fees, policies, timetables).",                   default:true,  group:"AI & Chatbots", badge:"Requires knowledge base" },
  { key:"ai.tutor",            label:"AI Tutor",                   desc:"Personalised subject-by-subject tutoring for students powered by the LLM.",                                  default:true,  group:"AI & Chatbots" },
  { key:"ai.quiz",             label:"AI Quiz Generator",          desc:"Auto-generates practice quizzes from any topic for students and teachers.",                                  default:true,  group:"AI & Chatbots" },
  { key:"ai.predictions",      label:"Predictive Analytics",       desc:"Machine-learning dropout, attendance, grade, and fee-default risk predictions.",                             default:true,  group:"AI & Chatbots", badge:"Requires ML model" },
  { key:"ai.agent",            label:"AI Agent (autonomous tasks)",desc:"Allow teachers and admins to delegate multi-step school management tasks to the AI agent.",                  default:false, group:"AI & Chatbots", badge:"Beta" },
  { key:"ai.parentChatbot",    label:"Parent Chatbot",             desc:"Parents can ask questions about their child's attendance, fees, and results via AI.",                        default:true,  group:"AI & Chatbots" },

  // Communication
  { key:"comm.internalChat",   label:"Internal messaging",         desc:"Real-time chat between staff, teachers, students and parents within the portal.",                            default:true,  group:"Communication" },
  { key:"comm.notifications",  label:"Push notifications",         desc:"Send bell notifications to all actors for events (leave approval, results, fee reminders).",                default:true,  group:"Communication" },
  { key:"comm.broadcast",      label:"Broadcast announcements",    desc:"Allow admins and principal to send system-wide announcements to all users.",                                 default:true,  group:"Communication" },
  { key:"comm.parentPortal",   label:"Parent portal",              desc:"Parents can view their child's attendance, results, fee, and activities.",                                   default:true,  group:"Communication" },

  // Students & Learning
  { key:"learn.assignments",   label:"Assignments & homework",     desc:"Teachers can create assignments; students can submit files and view grades.",                                default:true,  group:"Learning" },
  { key:"learn.leaveApply",    label:"Student leave applications",  desc:"Students can apply for leave directly through the portal.",                                                  default:true,  group:"Learning" },
  { key:"learn.library",       label:"Library catalogue & loans",  desc:"Enable the library module — book catalogue, loan tracking, and return management.",                         default:true,  group:"Learning" },

  // Finance
  { key:"finance.onlinePay",   label:"Online payment gateway",     desc:"Allow parents and students to pay fees directly through the portal (requires payment integration).",        default:false, group:"Finance", badge:"Integration required" },
  { key:"finance.feeReminders",label:"Automatic fee reminders",    desc:"Send automated reminders to parents when fees are due or overdue.",                                         default:true,  group:"Finance" },
  { key:"finance.receipts",    label:"Digital fee receipts",       desc:"Generate and email payment receipts automatically when a payment is recorded.",                             default:true,  group:"Finance" },

  // HR & Attendance
  { key:"hr.selfLeave",        label:"Staff self-service leave",   desc:"Staff can apply for leave through the portal without going through paper forms.",                           default:true,  group:"HR & Attendance" },
  { key:"hr.biometric",        label:"Biometric attendance sync",  desc:"Sync with biometric devices for automatic staff attendance (requires device integration).",                 default:false, group:"HR & Attendance", badge:"Device integration required" },
  { key:"attend.qrCode",       label:"QR-code student attendance", desc:"Allow teachers to mark attendance by scanning student QR codes.",                                           default:false, group:"HR & Attendance", badge:"Beta" },

  // Security & Access
  { key:"sec.twoFactor",       label:"Two-factor authentication",  desc:"Require staff and teachers to verify their identity with a second factor when logging in.",                 default:false, group:"Security" },
  { key:"sec.sessionTimeout",  label:"Session auto-logout (30 min)","desc":"Automatically log users out after 30 minutes of inactivity.",                                            default:true,  group:"Security" },
  { key:"sec.ipRestrict",      label:"IP address restriction",     desc:"Restrict portal access to specific IP addresses or ranges (e.g. school network only).",                    default:false, group:"Security", badge:"Contact support" },
];

type Section = {
  label:     string;
  note?:     string;
  key:       string;
  options?:  { value: string; label: string }[];
  default?:  string;
}

const SCHOOL_SETTINGS: Section[] = [
  { label:"Academic year start month", key:"acad.startMonth", options:[{value:"1",label:"January"},{value:"4",label:"April"},{value:"7",label:"July"},{value:"9",label:"September"}], default:"4" },
  { label:"Default language",          key:"lang.default",    options:[{value:"en",label:"English"},{value:"ur",label:"Urdu"},{value:"en-ur",label:"English + Urdu"}], default:"en" },
  { label:"Date format",               key:"date.format",     options:[{value:"DD/MM/YYYY",label:"DD/MM/YYYY"},{value:"MM/DD/YYYY",label:"MM/DD/YYYY"},{value:"YYYY-MM-DD",label:"YYYY-MM-DD"}], default:"DD/MM/YYYY" },
  { label:"Time zone",                 key:"tz",              options:[{value:"Asia/Karachi",label:"Pakistan (UTC+5)"},{value:"UTC",label:"UTC"}], default:"Asia/Karachi" },
  { label:"School week starts",        key:"week.start",      options:[{value:"0",label:"Sunday"},{value:"1",label:"Monday"}], default:"1" },
  { label:"Fee default warning (days before due)", key:"finance.warnDays", options:[{value:"3",label:"3 days"},{value:"5",label:"5 days"},{value:"7",label:"7 days"},{value:"14",label:"14 days"}], default:"5" },
];

function Toggle({ toggle, enabled, onChange }: { toggle: Toggle; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20,
      padding: "16px 20px", borderBottom: "1px solid var(--surface-3)", transition: "background .12s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--surface-2)"}
      onMouseLeave={e => e.currentTarget.style.background = ""}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <b style={{ fontSize: 13, color: "var(--text)" }}>{toggle.label}</b>
          {toggle.badge && (
            <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 20, background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid var(--warning-border)", fontWeight: 700 }}>
              {toggle.badge}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{toggle.desc}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        aria-label={enabled ? "Disable" : "Enable"}
        style={{
          width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
          background: enabled ? "var(--success)" : "var(--line-2)",
          position: "relative", transition: "background .2s", flexShrink: 0, marginTop: 2,
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 3,
          left: enabled ? 23 : 3,
          transition: "left .2s",
          boxShadow: "0 1px 4px rgba(0,0,0,.2)",
        }} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const tid = effectiveTenantId(user) ?? "";

  // Initialise from localStorage if available
  const storageKey = `ss_settings_${tid}`;
  const stored = (() => { try { return JSON.parse(localStorage.getItem(storageKey) ?? "{}"); } catch { return {}; } })();

  const [toggles, setToggles] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    TOGGLES.forEach(t => { init[t.key] = stored[t.key] ?? t.default; });
    return init;
  });
  const [selects, setSelects] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    SCHOOL_SETTINGS.forEach(s => { init[s.key] = stored[`select_${s.key}`] ?? s.default ?? ""; });
    return init;
  });
  const [saved, setSaved]   = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!env.useMocks);

  useEffect(() => {
    if (env.useMocks || !tid) return;
    let active = true;
    setLoading(true);
    A.getTenantSettings(tid)
      .then((response: any) => {
        if (!active) return;
        const x = response?.value ?? response;
        if (!x) return;
        setSelects({
          "acad.startMonth": String(x.academicYearStartMonth ?? 4),
          "lang.default": x.defaultLanguage ?? "en",
          "date.format": x.dateFormat ?? "DD/MM/YYYY",
          "tz": x.timeZone ?? "Asia/Karachi",
          "week.start": String(x.weekStart ?? 1),
          "finance.warnDays": String(x.feeWarningDays ?? 5),
        });
        setToggles({
          "ai.ragAssistant": x.aiRagAssistant, "ai.tutor": x.aiTutor, "ai.quiz": x.aiQuiz, "ai.predictions": x.aiPredictions, "ai.agent": x.aiAgent, "ai.parentChatbot": x.aiParentChatbot,
          "comm.internalChat": x.internalChat, "comm.notifications": x.notifications, "comm.broadcast": x.broadcast, "comm.parentPortal": x.parentPortal,
          "learn.assignments": x.assignments, "learn.leaveApply": x.studentLeaveApply, "learn.library": x.library,
          "finance.onlinePay": x.onlinePayment, "finance.feeReminders": x.feeReminders, "finance.receipts": x.digitalReceipts,
          "hr.selfLeave": x.staffSelfLeave, "hr.biometric": x.biometricAttendance, "attend.qrCode": x.qrAttendance,
          "sec.twoFactor": x.twoFactor, "sec.sessionTimeout": x.sessionTimeout, "sec.ipRestrict": x.ipRestriction,
        });
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [tid]);

  const groups = [...new Set(TOGGLES.map(t => t.group))];

  async function save() {
    setSaving(true);
    try {
      const data: Record<string, any> = {};
      Object.entries(toggles).forEach(([k,v]) => { data[k] = v; });
      Object.entries(selects).forEach(([k,v]) => { data[`select_${k}`] = v; });
      if (!env.useMocks) {
        await A.saveTenantSettings({
          tenantId: tid,
          academicYearStartMonth: Number(selects["acad.startMonth"]),
          defaultLanguage: selects["lang.default"],
          dateFormat: selects["date.format"],
          timeZone: selects["tz"],
          weekStart: Number(selects["week.start"]),
          feeWarningDays: Number(selects["finance.warnDays"]),
          aiRagAssistant: toggles["ai.ragAssistant"], aiTutor: toggles["ai.tutor"], aiQuiz: toggles["ai.quiz"], aiPredictions: toggles["ai.predictions"], aiAgent: toggles["ai.agent"], aiParentChatbot: toggles["ai.parentChatbot"],
          internalChat: toggles["comm.internalChat"], notifications: toggles["comm.notifications"], broadcast: toggles["comm.broadcast"], parentPortal: toggles["comm.parentPortal"],
          assignments: toggles["learn.assignments"], studentLeaveApply: toggles["learn.leaveApply"], library: toggles["learn.library"],
          onlinePayment: toggles["finance.onlinePay"], feeReminders: toggles["finance.feeReminders"], digitalReceipts: toggles["finance.receipts"],
          staffSelfLeave: toggles["hr.selfLeave"], biometricAttendance: toggles["hr.biometric"], qrAttendance: toggles["attend.qrCode"],
          twoFactor: toggles["sec.twoFactor"], sessionTimeout: toggles["sec.sessionTimeout"], ipRestriction: toggles["sec.ipRestrict"],
        });
      }
      localStorage.setItem(storageKey, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* toast */ }
    setSaving(false);
  }

  return (
    <>
      <PageHeader
        title="School Settings"
        subtitle="Enable or disable features, and configure school-wide preferences"
        action={
          <button className="primary" onClick={save} disabled={saving || loading} style={{ display:"flex", alignItems:"center", gap:6 }}>
            {saving ? <RefreshCw size={14} style={{animation:"spin 1s linear infinite"}}/> : <Save size={14}/>}
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save settings"}
          </button>
        }
      />

      {/* School preferences */}
      <div className="surface" style={{ marginBottom: 16 }}>
        <div className="surface-head">
          <div><h3>School preferences</h3><p>General configuration applied school-wide</p></div>
        </div>
        <div style={{ padding: "8px 0" }}>
          {SCHOOL_SETTINGS.map(s => (
            <div key={s.key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:20, padding:"12px 20px", borderBottom:"1px solid var(--surface-3)" }}>
              <label style={{ fontSize:13, fontWeight:600, color:"var(--text)", flex:1 }}>{s.label}</label>
              <select
                value={selects[s.key] ?? s.default}
                onChange={e => setSelects(p => ({...p, [s.key]: e.target.value}))}
                style={{ height:34, padding:"0 12px", border:"1.5px solid var(--line)", borderRadius:9, background:"var(--surface)", fontSize:12, minWidth:200 }}
              >
                {s.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Feature toggles grouped */}
      {groups.map(group => (
        <div key={group} className="surface" style={{ marginBottom: 16 }}>
          <div className="surface-head">
            <div>
              <h3>{group}</h3>
              <p>Enable or disable {group.toLowerCase()} features for all users in your school</p>
            </div>
            <span style={{ fontSize:11, color:"var(--muted)" }}>
              {TOGGLES.filter(t => t.group===group && toggles[t.key]).length}/{TOGGLES.filter(t=>t.group===group).length} enabled
            </span>
          </div>
          <div style={{ padding:"4px 0" }}>
            {TOGGLES.filter(t => t.group===group).map(toggle => (
              <Toggle
                key={toggle.key}
                toggle={toggle}
                enabled={toggles[toggle.key] ?? toggle.default}
                onChange={v => { setToggles(p => ({...p, [toggle.key]: v})); setSaved(false); }}
              />
            ))}
          </div>
        </div>
      ))}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}
