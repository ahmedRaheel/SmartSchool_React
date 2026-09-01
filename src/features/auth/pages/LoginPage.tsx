import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

const DEMO_ROLES = [
  { role: "SuperAdmin", email: "superadmin@smartschool.local", label: "Super Admin",   icon: "🌐", color: "#6366F1", bg: "#EEF2FF" },
  { role: "Tenant",     email: "owner@alnoor.edu.pk",          label: "School Owner",  icon: "🏫", color: "#0F2241", bg: "#E8EDF5" },
  { role: "Principal",  email: "principal@alnoor.edu.pk",      label: "Principal",     icon: "👔", color: "#0369A1", bg: "#E0F2FE" },
  { role: "Admin",      email: "admin@alnoor.edu.pk",          label: "Admin Officer", icon: "🗂️", color: "#059669", bg: "#ECFDF5" },
  { role: "Teacher",    email: "teacher@alnoor.edu.pk",        label: "Teacher",       icon: "👩‍🏫", color: "#7C3AED", bg: "#F5F3FF" },
  { role: "Student",    email: "student@alnoor.edu.pk",        label: "Student",       icon: "🎓", color: "#2563EB", bg: "#EFF6FF" },
  { role: "Parent",     email: "parent@alnoor.edu.pk",         label: "Parent",        icon: "👨‍👩‍👧", color: "#D97706", bg: "#FFFBEB" },
  { role: "Driver",     email: "driver@alnoor.edu.pk",         label: "Driver",        icon: "🚌", color: "#DC2626", bg: "#FFF0F1" },
];

const FEATURES = [
  { icon: "🧠", title: "AI Predictions", desc: "Dropout risk, grade forecasts, fee default alerts" },
  { icon: "📊", title: "Role Dashboards", desc: "9 actor types, each with personalised live data" },
  { icon: "🔒", title: "Multi-tenant SaaS", desc: "Isolated data per school, enterprise-grade security" },
  { icon: "🤖", title: "AI Tutor & RAG", desc: "LLM-powered tutoring and school knowledge chatbots" },
];

const STATS = [
  { value: "2,840+", label: "Students" },
  { value: "128",    label: "Staff" },
  { value: "99.9%",  label: "Uptime" },
  { value: "9",      label: "Actor roles" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail]       = useState("superadmin@smartschool.local");
  const [password, setPassword] = useState("ChangeMe@123456");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [activeRole, setActiveRole] = useState("SuperAdmin");

  if (user) return <Navigate to="/" replace />;

  function pickRole(r: typeof DEMO_ROLES[0]) {
    setActiveRole(r.role);
    setEmail(r.email);
    setPassword("ChangeMe@123456");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await login({ email, password });
    setLoading(false);
    if (!result.success) { setError(result.message ?? "Unable to sign in."); return; }
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  }

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── LEFT PANEL ────────────────────────────────────────────────────── */}
      <div style={{
        flex:"0 0 52%", background:"linear-gradient(145deg,#0F2241 0%,#1a3a6e 45%,#0d3460 100%)",
        display:"flex", flexDirection:"column", justifyContent:"space-between",
        padding:"48px 56px", position:"relative", overflow:"hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{ position:"absolute", top:-120, right:-120, width:400, height:400, borderRadius:"50%", background:"rgba(99,102,241,0.15)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-80, left:-80, width:300, height:300, borderRadius:"50%", background:"rgba(59,130,246,0.12)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", top:"40%", left:"60%", width:200, height:200, borderRadius:"50%", background:"rgba(139,92,246,0.1)", pointerEvents:"none" }}/>

        {/* Brand */}
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:56 }}>
            <div style={{ width:44, height:44, borderRadius:14, background:"linear-gradient(135deg,#6366F1,#8B5CF6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 4px 16px rgba(99,102,241,.4)" }}>
              🎓
            </div>
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:18, letterSpacing:-.3 }}>Smart<span style={{ color:"#818CF8" }}>School</span> Aside</div>
              <div style={{ color:"#93C5FD", fontSize:10, fontWeight:600, letterSpacing:1.2, textTransform:"uppercase" }}>AI-Powered School ERP</div>
            </div>
          </div>

          <div style={{ marginBottom:48 }}>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, background:"rgba(99,102,241,0.25)", border:"1px solid rgba(99,102,241,0.4)", marginBottom:20 }}>
              <span style={{ fontSize:10 }}>✨</span>
              <span style={{ color:"#C7D2FE", fontSize:11, fontWeight:600, letterSpacing:.5 }}>Powered by Ollama · RAG · ML Predictions</span>
            </div>
            <h1 style={{ color:"#fff", fontSize:38, fontWeight:800, lineHeight:1.18, margin:"0 0 18px", letterSpacing:-.8 }}>
              One premium workspace<br/>
              <span style={{ background:"linear-gradient(90deg,#818CF8,#C084FC)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                for your entire school.
              </span>
            </h1>
            <p style={{ color:"#94A3B8", fontSize:15, lineHeight:1.65, margin:0, maxWidth:440 }}>
              Academics, HR, Finance, Admissions, Transport, Library and AI-assisted student success — all from a single connected platform.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:48 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"14px 16px", borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(8px)" }}>
                <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{f.icon}</span>
                <div>
                  <div style={{ color:"#E2E8F0", fontWeight:700, fontSize:12, marginBottom:2 }}>{f.title}</div>
                  <div style={{ color:"#64748B", fontSize:11, lineHeight:1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ position:"relative", zIndex:1, display:"flex", gap:0, borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ flex:1, textAlign:"center", padding:"16px 8px", background:"rgba(255,255,255,0.05)", borderRight: i < STATS.length-1 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <div style={{ color:"#fff", fontWeight:800, fontSize:20, letterSpacing:-.4 }}>{s.value}</div>
              <div style={{ color:"#64748B", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:.8, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ───────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"48px 40px", background:"#FAFBFC", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:440 }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:26, fontWeight:800, color:"#0F2241", margin:"0 0 6px", letterSpacing:-.5 }}>Welcome back</h2>
            <p style={{ color:"#64748B", fontSize:14, margin:0 }}>Sign in or pick a demo role below.</p>
          </div>

          {/* Demo role grid */}
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#94A3B8", letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>Quick demo access</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:8 }}>
              {DEMO_ROLES.map(r => {
                const active = activeRole === r.role;
                return (
                  <button key={r.role} onClick={() => pickRole(r)}
                    style={{
                      display:"flex", flexDirection:"column", alignItems:"center", gap:6,
                      padding:"14px 8px", border:`2px solid ${active ? r.color : "#E2E8F0"}`,
                      borderRadius:14, background: active ? r.bg : "#fff",
                      cursor:"pointer", transition:"all .15s", boxShadow: active ? `0 0 0 3px ${r.color}20` : "none",
                    }}
                    onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = r.color; (e.currentTarget as HTMLElement).style.background = r.bg; } }}
                    onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLElement).style.background = "#fff"; } }}>
                    <span style={{ fontSize:22 }}>{r.icon}</span>
                    <span style={{ fontSize:10, fontWeight:700, color: active ? r.color : "#475569", textAlign:"center", lineHeight:1.3 }}>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
            <div style={{ flex:1, height:1, background:"#E2E8F0" }}/>
            <span style={{ color:"#94A3B8", fontSize:11, fontWeight:600 }}>or sign in with credentials</span>
            <div style={{ flex:1, height:1, background:"#E2E8F0" }}/>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#374151", marginBottom:6 }}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"
                style={{ width:"100%", height:46, padding:"0 14px", border:"1.5px solid #D1D5DB", borderRadius:12, background:"#fff", fontSize:13, color:"#0F2241", boxSizing:"border-box", outline:"none", transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor="#6366F1"}
                onBlur={e => e.target.style.borderColor="#D1D5DB"}
              />
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:12, fontWeight:600, color:"#374151" }}>Password</label>
                <a href="#" style={{ fontSize:11, color:"#6366F1", fontWeight:600, textDecoration:"none" }}>Forgot password?</a>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                style={{ width:"100%", height:46, padding:"0 14px", border:"1.5px solid #D1D5DB", borderRadius:12, background:"#fff", fontSize:13, color:"#0F2241", boxSizing:"border-box", outline:"none", transition:"border-color .15s" }}
                onFocus={e => e.target.style.borderColor="#6366F1"}
                onBlur={e => e.target.style.borderColor="#D1D5DB"}
              />
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none" }}>
              <input type="checkbox" defaultChecked style={{ width:16, height:16, accentColor:"#6366F1", cursor:"pointer" }}/>
              <span style={{ fontSize:12, color:"#6B7280" }}>Keep me signed in</span>
            </label>

            {error && (
              <div style={{ padding:"10px 14px", background:"#FFF0F1", border:"1px solid #fecdd3", borderRadius:10, fontSize:12, color:"#B91C1C", fontWeight:500 }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                height:48, borderRadius:12, border:"none", cursor:"pointer",
                background: loading ? "#94A3B8" : "linear-gradient(135deg,#0F2241,#1a3a6e)",
                color:"#fff", fontSize:14, fontWeight:700, letterSpacing:.2,
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                boxShadow:"0 4px 16px rgba(15,34,65,.3)", transition:"all .2s",
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}>
              {loading ? (
                <>
                  <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 1s linear infinite", display:"inline-block" }}/>
                  Signing in…
                </>
              ) : "Sign in →"}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop:32, padding:"16px 18px", background:"#F1F5F9", borderRadius:12, border:"1px solid #E2E8F0" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:.8 }}>API mode</div>
            <div style={{ fontSize:11, color:"#64748B", lineHeight:1.6 }}>
              Currently in <code style={{ background:"#E2E8F0", padding:"1px 6px", borderRadius:4, fontFamily:"monospace" }}>
                {import.meta.env.VITE_USE_MOCKS === "true" ? "MOCK" : "REAL API"}
              </code> mode.{" "}
              {import.meta.env.VITE_USE_MOCKS === "false"
                ? "Set VITE_USE_MOCKS=false in .env for real backend."
                : `API: ${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:7001"}`}
            </div>
          </div>

          <p style={{ textAlign:"center", color:"#94A3B8", fontSize:11, marginTop:24 }}>
            &copy; {new Date().getFullYear()} SmartSchool Aside · Enterprise School ERP
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
