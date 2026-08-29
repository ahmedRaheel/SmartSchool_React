import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight, BarChart3, BookOpenCheck, Bot, BrainCircuit,
  CheckCircle2, GraduationCap, ShieldCheck, Sparkles,
} from "lucide-react";
import { useAuth } from "../auth";

const DEMO_ROLES = [
  { role: "SuperAdmin",   email: "superadmin@smartschool.local",   label: "Super Admin",    emoji: "🌐" },
  { role: "Tenant",       email: "owner@alnoor.edu.pk",            label: "School Owner",   emoji: "🏫" },
  { role: "Principal",    email: "principal@alnoor.edu.pk",        label: "Principal",      emoji: "👔" },
  { role: "Admin",        email: "admin@alnoor.edu.pk",            label: "Admin Officer",  emoji: "🗂️" },
  { role: "Teacher",      email: "teacher@alnoor.edu.pk",          label: "Teacher",        emoji: "👩‍🏫" },
  { role: "Student",      email: "student@alnoor.edu.pk",          label: "Student",        emoji: "🎓" },
  { role: "Parent",       email: "parent@alnoor.edu.pk",           label: "Parent",         emoji: "👨‍👩‍👧" },
  { role: "Driver",       email: "driver@alnoor.edu.pk",           label: "Driver",         emoji: "🚌" },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail]         = useState("superadmin@smartschool.local");
  const [password, setPassword]   = useState("ChangeMe@123456");
  const [error, setError]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  function pickRole(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("ChangeMe@123456");
    setError("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await login({ email, password });
    setSubmitting(false);
    if (!result.success) { setError(result.message ?? "Unable to sign in."); return; }
    const from = (location.state as { from?: string } | null)?.from ?? "/";
    navigate(from, { replace: true });
  }

  return (
    <main className="login-page">
      {/* ── Left showcase ── */}
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark"><Bot size={24} /></span>
          <span>Smart<b>School</b> Aside</span>
        </div>

        <div className="login-copy">
          <span className="eyebrow light"><Sparkles size={14} /> AI-powered school ERP</span>
          <h1>One premium workspace for your entire school community.</h1>
          <p>
            Academics, HR, Finance, Admissions, Transport, Library and AI-assisted
            student success — all from a single connected platform.
          </p>
          <div className="login-benefits">
            <div>
              <span className="login-perk-icon"><BrainCircuit size={16} /></span>
              <span><b>AI predictions</b><small>Dropout risk, grade forecasts, fee default alerts</small></span>
            </div>
            <div>
              <span className="login-perk-icon"><BarChart3 size={16} /></span>
              <span><b>Role-specific dashboards</b><small>9 actor types, each with personalised views</small></span>
            </div>
            <div>
              <span className="login-perk-icon"><ShieldCheck size={16} /></span>
              <span><b>Multi-tenant SaaS</b><small>Isolated data per school, enterprise-grade security</small></span>
            </div>
          </div>
        </div>

        <div className="login-proof">
          <BookOpenCheck size={16} />
          <span>Supporting Matric, O-Level, A-Level and Cambridge programmes</span>
        </div>
      </section>

      {/* ── Right panel ── */}
      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="mobile-login-brand">
            <span className="brand-mark"><Bot size={22} /></span>
            <b>SmartSchool Aside</b>
          </div>

          <span className="eyebrow"><CheckCircle2 size={13} /> Secure portal</span>
          <h2>Welcome back</h2>
          <p className="muted" style={{ marginBottom: 18 }}>Sign in or pick a demo role below.</p>

          {/* Role quick-select */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: .7, marginBottom: 8 }}>
              Quick demo access
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {DEMO_ROLES.map(r => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => pickRole(r.email)}
                  style={{
                    padding: "8px 4px", border: `1.5px solid ${email === r.email ? "var(--navy)" : "var(--line)"}`,
                    borderRadius: 9, background: email === r.email ? "#EEF2FF" : "#fff",
                    cursor: "pointer", textAlign: "center", transition: "all .13s",
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{r.emoji}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{r.label}</div>
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "14px 0" }} />

          <label className="form-label">
            Email address
            <input
              className="form-control"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={{ marginTop: 6 }}
            />
          </label>

          <label className="form-label" style={{ marginTop: 12 }}>
            Password
            <input
              className="form-control"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ marginTop: 6 }}
            />
          </label>

          <div className="login-options" style={{ marginTop: 10 }}>
            <label className="check-row">
              <input type="checkbox" defaultChecked /> Keep me signed in
            </label>
            <button type="button" className="text-button">Forgot password?</button>
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="primary login-button" disabled={submitting} style={{ marginTop: 14 }}>
            {submitting ? "Signing in…" : "Sign in"} <ArrowRight size={16} />
          </button>

          <div className="demo-credentials" style={{ marginTop: 16 }}>
            <b>Default password for all demo roles:</b>
            <span>ChangeMe@123456</span>
          </div>
        </form>
      </section>
    </main>
  );
}
