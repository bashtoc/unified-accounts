import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL } from "../../lib/constants";
import { useAuth } from "../../context/AuthContext";
import type { MonitoringAdminSession } from "../../lib/types";

async function post(path: string, body: unknown) {
  const response = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "The request could not be completed.");
  return payload?.data ?? payload;
}

export default function MonitoringAdminAuthPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { monitoringAdminLogin } = useAuth();
  const navigate = useNavigate();

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError("");
    try { const result = await post("/admin/auth/request-otp", { email }); setMessage(result.message); setStep("otp"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "The request could not be completed."); } finally { setLoading(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault(); if (otp.length !== 6) return; setLoading(true); setError("");
    try { const result = await post("/admin/auth/verify-otp", { email, otp }) as MonitoringAdminSession; monitoringAdminLogin(result); navigate("/admin/business-applications"); } catch (verifyError) { setError(verifyError instanceof Error ? verifyError.message : "The code could not be verified."); } finally { setLoading(false); }
  };

  return (
    <div className="auth">
      <div className="auth-top"><Link to="/" className="wordmark" aria-label="Safer Signal home">Safer Signal<span>.</span></Link><Link to="/">Public site</Link></div>
      <div className="auth-body">
        <div className="auth-card">
          <h1>{step === "email" ? "Operator sign in." : "Check your email."}</h1>
          <p>{step === "email" ? "Provisioned operators only." : `Enter the six-digit code sent to ${email}.`}</p>
          {step === "email" ? <form onSubmit={requestOtp} className="auth-form"><label className="field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="operator@saference.com" autoComplete="email" /></label>{error && <ErrorMessage message={error} />}<button disabled={loading} className="btn">{loading ? "Sending..." : "Send code"}</button></form> : <form onSubmit={verifyOtp} className="auth-form">{message && <div className="notice notice-success !mt-0">{message}</div>}<label className="field">Code<input required autoFocus inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="otp-input" placeholder="000000" /></label>{error && <ErrorMessage message={error} />}<button disabled={loading || otp.length !== 6} className="btn">{loading ? "Verifying..." : "Continue"}</button></form>}
          {step === "otp" && <div className="auth-switch"><button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }}>Use a different email</button></div>}
        </div>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) { return <div className="notice notice-danger !mt-0">{message}</div>; }
