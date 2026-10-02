import { FormEvent, useState } from "react";
import { Activity, AlertCircle, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
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
    <div className="monitoring-auth flex min-h-screen items-center justify-center bg-[#071019] px-4 py-5 sm:px-8">
      <div className="w-full max-w-[560px] rounded-2xl bg-white p-6 shadow-2xl sm:p-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#63758b] hover:text-[#0b5cff]"><ArrowLeft size={16} /> Back to public monitor</Link>
        <div className="mt-10 flex items-center gap-3"><img src="/safericon.png" alt="" className="h-11 w-11 rounded-xl" /><div><p className="text-xl font-extrabold text-[#14263d]">Safer Signal<span className="text-[#4d8aff]">.</span></p><p className="mt-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#8191a6]">Operator access</p></div></div>
        <div className="mt-10 flex items-start gap-3 rounded-xl border border-[#dbe8df] bg-[#f3fbf5] p-4"><ShieldCheck size={19} className="mt-0.5 shrink-0 text-[#16a968]" /><p className="text-sm leading-6 text-[#4f6c58]">Only provisioned Signal operators can access business approvals. A one-time code will be sent to your authorized email.</p></div>
        {step === "email" ? <form onSubmit={requestOtp} className="mt-8 space-y-4"><label className="field-label">Operator email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="operator@saference.com" autoComplete="email" /></label>{error && <ErrorMessage message={error} />}<button disabled={loading} className="monitoring-button w-full">{loading ? "Sending code..." : "Send operator code"}</button></form> : <form onSubmit={verifyOtp} className="mt-8 space-y-4">{message && <div className="flex items-start gap-2 rounded-lg bg-[#f3fbf5] p-3 text-sm leading-5 text-[#267245]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{message}</div>}<label className="field-label">Six-digit code<input required autoFocus inputMode="numeric" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} className="otp-input" placeholder="000000" /></label>{error && <ErrorMessage message={error} />}<button disabled={loading || otp.length !== 6} className="monitoring-button w-full">{loading ? "Verifying..." : "Open approvals"}</button><button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); }} className="w-full text-center text-sm font-bold text-[#687b92] hover:text-[#0b5cff]">Use a different email</button></form>}
        <p className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-[#8191a6]"><Activity size={14} className="text-[#16a968]" /> Signal admin authentication</p>
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) { return <div className="rounded-lg bg-[#fff1ef] p-3 text-sm text-[#b33f37]"><AlertCircle size={16} className="mr-2 inline" />{message}</div>; }
