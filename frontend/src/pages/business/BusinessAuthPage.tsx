import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, AlertCircle, ArrowLeft, CheckCircle2, Gauge, Radio, ShieldCheck } from "lucide-react";
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

  return (
    <div className="monitoring-auth min-h-screen bg-[#0b0e0d] px-4 py-6 sm:px-8 sm:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl overflow-hidden rounded-[24px] bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
        <div className="relative hidden overflow-hidden bg-[#0b0e0d] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="absolute inset-0 monitoring-grid opacity-50" />
          <div className="relative">
            <Link to="/" aria-label="Safer Signal home" className="group flex w-fit items-center gap-3"><img src="/safericon.png" alt="" className="h-10 w-10 rounded-xl" /><div><span className="block text-lg font-extrabold">Safer Signal<span className="text-[#72bf65]">.</span></span><span className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7f9281]">Network monitor</span></div></Link>
            <div className="mt-24 max-w-md"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#80bf77]"><Radio size={14} /> Operational intelligence</p><h1 className="mt-5 text-5xl font-extrabold leading-[1.02] tracking-[-.04em]">Know which bank networks are ready.</h1><p className="mt-6 text-base leading-7 text-[#9cac9a]">Monitor availability, response time, and trust signals before your team makes a payment decision.</p></div>
          </div>
          <div className="relative grid grid-cols-3 gap-3"><div className="rounded-xl border border-white/10 bg-white/[.05] p-4"><Gauge size={17} className="text-[#72bf65]" /><p className="mt-8 text-xs font-semibold text-[#9cac9a]">Trust scores</p></div><div className="rounded-xl border border-white/10 bg-white/[.05] p-4"><Activity size={17} className="text-[#72bf65]" /><p className="mt-8 text-xs font-semibold text-[#9cac9a]">Live status</p></div><div className="rounded-xl border border-white/10 bg-white/[.05] p-4"><ShieldCheck size={17} className="text-[#d4a44c]" /><p className="mt-8 text-xs font-semibold text-[#9cac9a]">Audit trail</p></div></div>
        </div>

        <div className="monitoring-auth-form-panel flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          <Link to="/login" className="monitoring-auth-back mb-12 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-[#5c6d84] hover:text-[#0b5cff]"><ArrowLeft size={15} /> Monitoring sign in</Link>
          <Link to="/" aria-label="Safer Signal home" className="monitoring-auth-mobile-brand flex w-fit items-center gap-3 lg:hidden"><img src="/safericon.png" alt="" className="h-10 w-10 rounded-xl" /><div><span className="block text-lg font-extrabold text-[#0e1c31]">Safer Signal<span className="text-[#0b5cff]">.</span></span><span className="text-[10px] font-bold uppercase tracking-[.16em] text-[#8191a6]">Network monitor</span></div></Link>
          {step === "form" ? (
            <form onSubmit={requestOtp} className="monitoring-auth-form mt-8 space-y-4">
              {mode === "register" && <label className="field-label">Business name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your business name" /></label>}
              {mode === "register" && <label className="field-label">Website URL<input required type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbusiness.com" /></label>}
              <label className="field-label">Business email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@business.com" /></label>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600"><AlertCircle size={16} className="mr-2 inline" />{error}</div>}
              <button type="submit" disabled={loading} className="monitoring-button mt-5 w-full justify-center">{loading ? "Please wait..." : mode === "register" ? "Create monitoring workspace" : "Send access code"}</button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="monitoring-auth-form mt-8 space-y-4">
              {successMsg && <div className="flex items-center gap-2 rounded-lg bg-[#f0fdf4] p-3 text-sm text-[#15803d]"><CheckCircle2 size={16} />{successMsg}</div>}
              <label className="field-label">Six-digit access code<input required autoFocus value={otp} onChange={(event) => setOtp(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} className="otp-input" placeholder="000000" /></label>
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600"><AlertCircle size={16} className="mr-2 inline" />{error}</div>}
              <button type="submit" disabled={loading || otp.length < 6} className="monitoring-button mt-6 w-full justify-center">{loading ? "Verifying..." : "Open console"}</button>
            </form>
          )}

          {step === "form" && <div className="monitoring-auth-switch mt-6 text-center text-sm text-[#617188]">{mode === "register" ? <>Already have a workspace? <button type="button" onClick={switchMode} className="font-semibold text-[#0b5cff] hover:underline">Sign in</button></> : <>Need a workspace? <button type="button" onClick={switchMode} className="font-semibold text-[#0b5cff] hover:underline">Create one</button></>}</div>}
          {step === "otp" && <button type="button" onClick={() => { setStep("form"); setOtp(""); setError(""); }} className="mt-6 w-full text-center text-sm font-semibold text-[#617188] hover:text-[#0b5cff]">Use a different email</button>}
        </div>
      </div>
    </div>
  );
}
