import axios from "axios";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { env } from "../../../config/env";

const identityUrl = (path: string) => `${env.identityBaseUrl}${path}`;

function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#F5F7FB", padding: 24 }}>
      <div style={{ width: "min(460px, 100%)", background: "#fff", border: "1px solid #E2E8F0", borderRadius: 18, padding: 30, boxShadow: "0 18px 50px rgba(15,34,65,.10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#6366F1,#8B5CF6)", display: "grid", placeItems: "center", color: "white", fontSize: 20 }}>🎓</div>
          <div><strong style={{ color: "#0F2241" }}>SmartSchool</strong><div style={{ fontSize: 11, color: "#94A3B8" }}>Secure account recovery</div></div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
      <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#0F2241" }}>Forgot password</h1>
      <p style={{ margin: "0 0 22px", color: "#64748B", fontSize: 13 }}>Enter your account email. If it exists, we will send a secure reset link.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151" }}>Email address
          <input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} style={{ height: 44, border: "1.5px solid #D1D5DB", borderRadius: 10, padding: "0 12px" }} />
        </label>
        {message && <div style={{ padding: 12, borderRadius: 10, background: "#ECFDF5", color: "#047857", fontSize: 12 }}>{message}</div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: "#FFF1F2", color: "#B91C1C", fontSize: 12 }}>{error}</div>}
        <button disabled={loading} type="submit" style={{ height: 44, border: 0, borderRadius: 10, background: "#0F2241", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "Sending…" : "Send reset link"}</button>
      </form>
      <div style={{ marginTop: 18, textAlign: "center" }}><Link to="/login" style={{ color: "#6366F1", fontSize: 12, fontWeight: 600 }}>Back to sign in</Link></div>
    </AuthCard>
  );
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const email = useMemo(() => params.get("email") ?? "", [params]);
  const token = useMemo(() => params.get("token") ?? "", [params]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email || !token) { setError("This reset link is incomplete or invalid."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 10) { setError("Use a password with at least 10 characters."); return; }
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
      <h1 style={{ margin: "0 0 8px", fontSize: 24, color: "#0F2241" }}>Reset password</h1>
      <p style={{ margin: "0 0 22px", color: "#64748B", fontSize: 13 }}>Choose a new password for {email || "your SmartSchool account"}.</p>
      {success ? (
        <div>
          <div style={{ padding: 14, borderRadius: 10, background: "#ECFDF5", color: "#047857", fontSize: 13, marginBottom: 18 }}>Your password has been reset successfully.</div>
          <Link to="/login" style={{ display: "block", textAlign: "center", padding: 12, borderRadius: 10, background: "#0F2241", color: "#fff", textDecoration: "none", fontWeight: 700 }}>Sign in</Link>
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151" }}>New password
            <input type="password" required autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} style={{ height: 44, border: "1.5px solid #D1D5DB", borderRadius: 10, padding: "0 12px" }} />
          </label>
          <label style={{ display: "grid", gap: 6, fontSize: 12, fontWeight: 600, color: "#374151" }}>Confirm password
            <input type="password" required autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} style={{ height: 44, border: "1.5px solid #D1D5DB", borderRadius: 10, padding: "0 12px" }} />
          </label>
          {error && <div style={{ padding: 12, borderRadius: 10, background: "#FFF1F2", color: "#B91C1C", fontSize: 12 }}>{error}</div>}
          <button disabled={loading} type="submit" style={{ height: 44, border: 0, borderRadius: 10, background: "#0F2241", color: "#fff", fontWeight: 700, cursor: "pointer" }}>{loading ? "Updating…" : "Reset password"}</button>
        </form>
      )}
      {!success && <div style={{ marginTop: 18, textAlign: "center" }}><Link to="/login" style={{ color: "#6366F1", fontSize: 12, fontWeight: 600 }}>Back to sign in</Link></div>}
    </AuthCard>
  );
}
