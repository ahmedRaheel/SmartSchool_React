import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, CheckCircle2, GraduationCap, ShieldCheck, Sparkles, } from "lucide-react";
import { useAuth } from "../auth";
export function LoginPage() {
    const { user, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("admin@smartschool.demo");
    const [password, setPassword] = useState("SmartSchool@2026");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    if (user)
        return <Navigate to="/" replace/>;
    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        const success = await login(email, password);
        setSubmitting(false);
        if (!success) {
            setError("Enter both email and password.");
            return;
        }
        const from = (location.state as {
            from?: string;
        } | null)?.from ?? "/";
        navigate(from, { replace: true });
    }
    return (<main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark">
<GraduationCap size={26}/>
</span>
          <span>SmartSchool</span>
        </div>
        <div className="login-copy">
          <span className="eyebrow light">
<Sparkles size={15}/> Intelligent school operations</span>
          <h1>One premium workspace for the entire school community.</h1>
          <p>
            Run academics, people, finance, communication and AI-assisted student
            success from a calm, connected experience.
          </p>
          <div className="login-benefits">
            <div>
<BrainCircuit />
<span>
<b>AI-powered insights</b>
<small>Predictions, tutoring and smart workflows</small>
</span>
</div>
            <div>
<BarChart3 />
<span>
<b>Real-time visibility</b>
<small>Actionable dashboards across every module</small>
</span>
</div>
            <div>
<ShieldCheck />
<span>
<b>Role-aware access</b>
<small>Built for administrators, teachers, parents and students</small>
</span>
</div>
          </div>
        </div>
        <div className="login-proof">
          <BookOpenCheck size={18}/>
          <span>Designed for Cambridge, Matric and blended school programs</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={handleSubmit}>
          <div className="mobile-login-brand">
            <span className="brand-mark">
<GraduationCap size={23}/>
</span>
            <b>SmartSchool</b>
          </div>
          <span className="eyebrow">
<CheckCircle2 size={14}/> Secure portal</span>
          <h2>Welcome back</h2>
          <p className="muted">Sign in to your SmartSchool workspace.</p>
          <label className="form-label">
            Email address
            <input className="form-control" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email"/>
          </label>
          <label className="form-label">
            Password
            <input className="form-control" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password"/>
          </label>
          <div className="login-options">
            <label className="check-row">
<input type="checkbox" defaultChecked/> Keep me signed in</label>
            <button type="button" className="text-button">Forgot password?</button>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button className="primary login-button" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"} <ArrowRight size={17}/>
          </button>
          <div className="demo-credentials">
            <b>Demo access</b>
            <span>Use the pre-filled credentials. Authentication is mocked for this UI build.</span>
          </div>
        </form>
      </section>
    </main>);
}

