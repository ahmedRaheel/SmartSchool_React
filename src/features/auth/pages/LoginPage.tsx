import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { env } from "../../../config/env";

const DEMO_ROLES = [
  { role: "SuperAdmin",  email: "superadmin@smartschool.local",  label: "Super Admin",   icon: "🌐", color: "var(--indigo)", bg: "var(--indigo-soft)" },
  { role: "Tenant",      email: "owner@alnoor.edu.pk",           label: "School Owner",  icon: "🏫", color: "var(--navy)",   bg: "var(--surface-3)" },
  { role: "Principal",   email: "principal@alnoor.edu.pk",       label: "Principal",     icon: "👔", color: "var(--info)",   bg: "var(--info-bg)" },
  { role: "Admin",       email: "admin@alnoor.edu.pk",           label: "Admin Officer", icon: "🗂️", color: "var(--success)", bg: "var(--success-bg)" },
  { role: "Teacher",     email: "teacher@alnoor.edu.pk",         label: "Teacher",       icon: "👩‍🏫", color: "var(--purple)", bg: "var(--purple-soft)" },
  { role: "Student",     email: "student@alnoor.edu.pk",         label: "Student",       icon: "🎓", color: "var(--indigo)", bg: "var(--indigo-soft)" },
  { role: "Parent",      email: "parent@alnoor.edu.pk",          label: "Parent",        icon: "👨‍👩‍👧", color: "var(--warning)", bg: "var(--warning-bg)" },
  { role: "Driver",      email: "driver@alnoor.edu.pk",          label: "Driver",        icon: "🚌", color: "var(--danger)",  bg: "var(--danger-bg)" },
  { role: "Accountant",  email: "accountant@alnoor.edu.pk",      label: "Accountant",    icon: "💰", color: "var(--accent)",  bg: "var(--accent-soft)" },
  { role: "HRManager",   email: "hrmanager@alnoor.edu.pk",       label: "HR Manager",    icon: "👥", color: "var(--teal)",    bg: "var(--teal-soft)" },
  { role: "Examiner",    email: "examiner@alnoor.edu.pk",         label: "Examiner",      icon: "📋", color: "var(--warning)", bg: "var(--warning-bg)" },
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
  const [email, setEmail]           = useState(env.useMocks ? "superadmin@smartschool.local" : "");
  const [password, setPassword]     = useState(env.useMocks ? "demo" : "");
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [activeRole, setActiveRole] = useState("SuperAdmin");

  const searchParams = new URLSearchParams(location.search);
  const returnTo = searchParams.get("returnTo");
  const reason   = searchParams.get("reason");

  if (user) {
    const dest = returnTo ? decodeURIComponent(returnTo) : "/";
    return <Navigate to={dest} replace />;
  }

  function pickRole(r: typeof DEMO_ROLES[0]) {
    setActiveRole(r.role);
    setEmail(r.email);
    setPassword("demo");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const result = await login({ email, password });
    setLoading(false);
    if (!result.success) { setError(result.message ?? "Unable to sign in."); return; }
    const dest = returnTo ? decodeURIComponent(returnTo) : (location.state as any)?.from ?? "/";
    navigate(dest, { replace: true });
  }

  return (
    <div className="login-wrap">

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <div className="login-left">
        {/* Decorative blobs */}
        <div className="login-blob" style={{ top:-120, right:-120, width:400, height:400, background:"rgba(99,102,241,0.14)" }}/>
        <div className="login-blob" style={{ bottom:-80, left:-80, width:300, height:300, background:"rgba(59,130,246,0.10)" }}/>
        <div className="login-blob" style={{ top:"40%", left:"60%", width:200, height:200, background:"rgba(139,92,246,0.09)" }}/>

        <div style={{ position:"relative", zIndex:1 }}>
          <div className="login-brand">
            <div className="login-brand-mark">🎓</div>
            <div>
              <div className="login-brand-name">Smart<span style={{ color:"#38BDF8" }}>School</span></div>
              <div className="login-brand-sub">AI-Powered School ERP</div>
            </div>
          </div>

          <div className="login-hero">
            <div className="login-tag">
              <span>✨</span>
              <span>Powered by Ollama · RAG · ML Predictions</span>
            </div>
            <h1 className="login-h1">
              One premium workspace<br/>
              <span className="login-h1-accent">for your entire school.</span>
            </h1>
            <p className="login-sub">
              Academics, HR, Finance, Admissions, Transport, Library and AI-assisted student success — all from a single connected platform.
            </p>

            <div className="login-features">
              {FEATURES.map(f => (
                <div key={f.title} className="login-feature">
                  <span style={{ fontSize:20, flexShrink:0, marginTop:1 }}>{f.icon}</span>
                  <div>
                    <div className="login-feature-title">{f.title}</div>
                    <div className="login-feature-desc">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="login-stats">
          {STATS.map((s, i) => (
            <div key={s.label} className="login-stat" style={{ borderRight: i < STATS.length-1 ? "1px solid rgba(255,255,255,.07)" : "none" }}>
              <div className="login-stat-val">{s.value}</div>
              <div className="login-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrap">

          {/* Session banners */}
          {reason === "expired" && (
            <div className="login-session-banner expired">
              <span style={{ fontSize:18, flexShrink:0 }}>⏱</span>
              <div>
                <b style={{ fontSize:12, color:"var(--warning)" }}>Your session has expired</b>
                <span style={{ fontSize:12, color:"var(--text-2)" }}>For your security, you were signed out after being inactive. Please sign in again to continue.</span>
              </div>
            </div>
          )}
          {!reason && returnTo && (
            <div className="login-session-banner redirect">
              <span style={{ fontSize:18, flexShrink:0 }}>🔒</span>
              <div>
                <b style={{ fontSize:12, color:"var(--info)" }}>Sign in required</b>
                <span style={{ fontSize:12, color:"var(--text-2)" }}>Please sign in to access that page. You'll be redirected automatically.</span>
              </div>
            </div>
          )}

          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-sub">{env.useMocks ? "Sign in or pick a demo role below." : "Sign in with your SmartSchool account."}</p>

          {env.useMocks && (
            <>
              <div style={{ marginBottom:28 }}>
                <div style={{ fontSize:10, fontWeight:700, color:"var(--muted-2)", letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 }}>Quick demo access</div>
                <div className="demo-grid">
                  {DEMO_ROLES.map(r => {
                    const active = activeRole === r.role;
                    return (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => pickRole(r)}
                        className={`demo-role-btn ${active ? "active" : ""}`}
                        style={active ? { borderColor: r.color } : undefined}
                      >
                        <span>{r.icon}</span>
                        <b>{r.label}</b>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="login-divider">
                <hr/><span>or sign in with credentials</span><hr/>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div className="human-field">
              <span>Email address</span>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" placeholder="you@school.edu.pk"
              />
            </div>
            <div className="human-field">
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span>Password</span>
                <Link to="/forgot-password" style={{ fontSize:11, color:"var(--indigo)", fontWeight:600 }}>Forgot password?</Link>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="••••••••"
              />
            </div>

            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", userSelect:"none", fontSize:12.5, color:"var(--muted)" }}>
              <input type="checkbox" defaultChecked style={{ width:15, height:15, accentColor:"var(--indigo)" }}/>
              Keep me signed in
            </label>

            {error && (
              <div className="form-error">⚠️ {error}</div>
            )}

            <button type="submit" className="login-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width:16, height:16 }}/>
                  Signing in…
                </>
              ) : "Sign in →"}
            </button>
          </form>

          {(env.useMocks || (import.meta as any).env?.DEV) && (
            <div className="login-dev-box">
              <div style={{ fontWeight:700, color:"var(--text-2)", marginBottom:6, textTransform:"uppercase", fontSize:10, letterSpacing:.8 }}>Development API mode</div>
              {env.useMocks ? "Mock data is enabled." : `API: ${env.apiBaseUrl}`}
            </div>
          )}

          <p className="login-footer">
            &copy; {new Date().getFullYear()} SmartSchool · Enterprise School ERP
          </p>
        </div>
      </div>
    </div>
  );
}
