import axios from "axios";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { env } from "../../../config/env";

const identityUrl = (path: string) => `${env.identityBaseUrl}${path}`;

function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight:"100vh", display:"grid", placeItems:"center", background:"var(--bg)", padding:24 }}>
      <div style={{ width:"min(460px,100%)", background:"var(--surface)", border:"1px solid var(--line)", borderRadius:"var(--r-xl)", padding:32, boxShadow:"var(--shadow-lg)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ width:42, height:42, borderRadius:"var(--r-lg)", background:"linear-gradient(135deg,var(--indigo),var(--purple))", display:"grid", placeItems:"center", color:"#fff", fontSize:20 }}>🎓</div>
          <div>
            <strong style={{ color:"var(--text)", fontSize:15, fontWeight:800 }}>SmartSchool</strong>
            <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>Secure account recovery</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError]     = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await axios.post(identityUrl("/api/account/forgot-password"), { email });
      setMessage(response.data?.message ?? "If the account exists, password reset instructions will be sent.");
    } catch (exception: any) {
      setError(exception?.response?.data?.message ?? "Unable to request password reset. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <AuthCard>
      <h1 style={{ margin:"0 0 8px", fontSize:24, color:"var(--text)", fontWeight:800, letterSpacing:"-.5px" }}>Forgot password</h1>
      <p style={{ margin:"0 0 24px", color:"var(--muted)", fontSize:13, lineHeight:1.6 }}>Enter your account email. If it exists, we will send a secure reset link.</p>

      <form onSubmit={submit} style={{ display:"grid", gap:14 }}>
        <div className="human-field">
          <span>Email address</span>
          <input type="email" required autoComplete="email" value={email}
            onChange={event => setEmail(event.target.value)} placeholder="you@school.edu.pk" />
        </div>
        {message && <div className="success-callout">{message}</div>}
        {error   && <div className="form-error">{error}</div>}
        <button disabled={loading} type="submit" className="login-submit-btn">
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <div style={{ marginTop:18, textAlign:"center" }}>
        <Link to="/login" style={{ color:"var(--indigo)", fontSize:12, fontWeight:600 }}>← Back to sign in</Link>
      </div>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const email    = useMemo(() => params.get("email") ?? "", [params]);
  const token    = useMemo(() => params.get("token") ?? "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email || !token)        { setError("This reset link is incomplete or invalid."); return; }
    if (password !== confirm)    { setError("Passwords do not match."); return; }
    if (password.length < 10)    { setError("Use a password with at least 10 characters."); return; }
    setLoading(true);
    try {
      await axios.post(identityUrl("/api/account/reset-password"), { email, token, newPassword: password });
      setSuccess(true);
    } catch (exception: any) {
      const detail = exception?.response?.data?.errors;
      const validationMessage = detail && typeof detail === "object"
        ? Object.values(detail as Record<string, string[]>).flat().join(" ")
        : undefined;
      setError(validationMessage || exception?.response?.data?.message || "Unable to reset password. The link may have expired.");
    } finally { setLoading(false); }
  }

  return (
    <AuthCard>
      <h1 style={{ margin:"0 0 8px", fontSize:24, color:"var(--text)", fontWeight:800, letterSpacing:"-.5px" }}>Reset password</h1>
      <p style={{ margin:"0 0 24px", color:"var(--muted)", fontSize:13, lineHeight:1.6 }}>
        Choose a new password for <b>{email || "your SmartSchool account"}</b>.
      </p>

      {success ? (
        <div>
          <div className="success-callout" style={{ marginBottom:18 }}>
            ✓ Your password has been reset successfully.
          </div>
          <Link to="/login" className="login-submit-btn" style={{ display:"block", textAlign:"center", textDecoration:"none" }}>
            Sign in →
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display:"grid", gap:14 }}>
          <div className="human-field">
            <span>New password</span>
            <input type="password" required autoComplete="new-password" value={password}
              onChange={event => setPassword(event.target.value)} placeholder="At least 10 characters" />
          </div>
          <div className="human-field">
            <span>Confirm password</span>
            <input type="password" required autoComplete="new-password" value={confirm}
              onChange={event => setConfirm(event.target.value)} placeholder="Repeat new password" />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button disabled={loading} type="submit" className="login-submit-btn">
            {loading ? "Updating…" : "Reset password"}
          </button>
        </form>
      )}

      {!success && (
        <div style={{ marginTop:18, textAlign:"center" }}>
          <Link to="/login" style={{ color:"var(--indigo)", fontSize:12, fontWeight:600 }}>← Back to sign in</Link>
        </div>
      )}
    </AuthCard>
  );
}
