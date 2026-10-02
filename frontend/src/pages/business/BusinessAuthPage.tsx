import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../lib/constants";

export default function BusinessAuthPage() {
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "register">(location.pathname === "/register" ? "register" : "login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const { businessLogin } = useAuth();
  const navigate = useNavigate();

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true); setError(""); setSuccessMsg("");
    try {
      let response: Response;
      if (mode === "register") {
        response = await fetch(`${API_URL}/business/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, websiteUrl }) });
      } else {
        response = await fetch(`${API_URL}/business/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "The access request failed.");
      const data = payload.data ?? payload;
      setSuccessMsg(data.message || "Access code sent to your email.");
      setStep("otp");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The access request failed.");
    } finally { setLoading(false); }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (otp.length < 6) return;
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API_URL}/business/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || payload.error || "Verification failed.");
      const result = payload.data ?? payload;
      businessLogin({ clientId: result.clientId, secretKey: result.secretKey || result.accessToken, refreshToken: result.refreshToken, applicationId: result.applicationId, name: result.name || email, websiteUrl: result.websiteUrl, email, status: result.status, canContributeBankStatus: result.canContributeBankStatus });
      navigate("/business/monitoring");
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally { setLoading(false); }
  };

  const switchMode = () => { setMode(mode === "login" ? "register" : "login"); setError(""); setStep("form"); };

  const heading = step === "otp" ? "Check your email." : mode === "register" ? "Create a workspace." : "Sign in.";
  const subtext = step === "otp" ? `Enter the six-digit code sent to ${email}.` : mode === "register" ? "Monitor bank networks for your business." : "We'll email you a one-time code.";

  return (
    <div className="auth">
      <div className="auth-top"><Link to="/" className="wordmark" aria-label="Safer Signal home">Safer Signal<span>.</span></Link><Link to="/monitoring">Browse banks</Link></div>
      <div className="auth-body">
        <div className="auth-card">
          <h1>{heading}</h1>
          <p>{subtext}</p>
          {step === "form" ? (
            <form onSubmit={requestOtp} className="auth-form">
              {mode === "register" && <label className="field">Business name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your business name" /></label>}
              {mode === "register" && <label className="field">Website<input required type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbusiness.com" /></label>}
              <label className="field">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@business.com" /></label>
              {error && <div className="notice notice-danger !mt-0">{error}</div>}
              <button type="submit" disabled={loading} className="btn">{loading ? "Please wait..." : mode === "register" ? "Create workspace" : "Send code"}</button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="auth-form">
              {successMsg && <div className="notice notice-success !mt-0">{successMsg}</div>}
              <label className="field">Code<input required autoFocus inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} className="otp-input" placeholder="000000" /></label>
              {error && <div className="notice notice-danger !mt-0">{error}</div>}
              <button type="submit" disabled={loading || otp.length < 6} className="btn">{loading ? "Verifying..." : "Continue"}</button>
            </form>
          )}

          {step === "form" && <div className="auth-switch">{mode === "register" ? <>Have a workspace? <button type="button" onClick={switchMode}>Sign in</button></> : <>New here? <button type="button" onClick={switchMode}>Create a workspace</button></>}</div>}
          {step === "otp" && <div className="auth-switch"><button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); }}>Use a different email</button></div>}
        </div>
      </div>
    </div>
  );
}
