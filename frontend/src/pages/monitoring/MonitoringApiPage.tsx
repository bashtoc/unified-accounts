import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest, businessHeaders } from "../../lib/api";

const PRODUCTION_API_BASE = "https://signal.saference.com/api/v1";

type KeyRecord = {
  id: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
};

type Parameter = {
  name: string;
  location: "Header" | "Path" | "Query" | "Body";
  required?: boolean;
  type: string;
  description: string;
  example?: string;
};

type EndpointDoc = {
  method: "GET" | "POST";
  path: string;
  title: string;
  description: string;
  auth: string;
  parameters: Parameter[];
  request?: string;
  response: string;
  notes?: string[];
  code: string;
};

const endpointDocs: EndpointDoc[] = [
  {
    method: "GET",
    path: "/merchant/account",
    title: "Check merchant account and eligibility",
    description: "Start here after receiving an API key. This endpoint confirms the merchant identity, account status, granted scopes, and whether the key is eligible to read bank status or contribute transaction outcomes.",
    auth: "X-API-Key. Inactive accounts may call this endpoint.",
    parameters: [{ name: "X-API-Key", location: "Header", required: true, type: "string", description: "Raw merchant API key issued by Safer Signal.", example: "su_live_..." }],
    response: `{
  "success": true,
  "data": {
    "merchant": {
      "applicationId": "app_uuid",
      "name": "Acme Payments",
      "email": "ops@acme.com",
      "websiteUrl": "https://acme.com",
      "status": "ACTIVE"
    },
    "apiKey": {
      "keyPrefix": "su_live_abc123",
      "scopes": ["monitoring:read", "monitoring:write"],
      "revokedAt": null
    },
    "eligibility": {
      "verified": true,
      "canReadBankStatus": true,
      "canContributeBankStatus": true,
      "reason": "Merchant account is active and verified."
    }
  },
  "meta": {}
}`,
    code: `curl ${PRODUCTION_API_BASE}/merchant/account \\
  -H "X-API-Key: su_live_your_key"`,
  },
  {
    method: "GET",
    path: "/merchant/banks/status",
    title: "Read the current bank network",
    description: "Returns current availability, trust score, success rate, latency, transfer identifiers, and timestamps for every active bank. The NIBSS national switch signal is always included under the NIBSS key.",
    auth: "X-API-Key with an ACTIVE merchant account and monitoring:read scope.",
    parameters: [{ name: "X-API-Key", location: "Header", required: true, type: "string", description: "Raw active merchant API key.", example: "su_live_..." }],
    response: `{
  "success": true,
  "data": {
    "058": {
      "id": 1,
      "name": "Guaranty Trust Bank",
      "bankCode": "058",
      "nipInstitutionCode": "000005",
      "status": "healthy",
      "trustScore": 96,
      "successRate": 98,
      "latencyMs": 185,
      "lastCheckedAt": "2026-08-14T10:30:00.000Z",
      "statusSource": "bank-integration"
    },
    "NIBSS": {
      "name": "Nigeria Inter-Bank Settlement System (NIBSS)",
      "bankCode": "NIBSS",
      "institutionType": "network_switch",
      "isNetworkSwitch": true,
      "status": "healthy",
      "networkSignal": "positive",
      "downBankCount": 2,
      "downThreshold": 5,
      "trustScore": 100
    }
  },
  "meta": {}
}`,
    notes: ["Use bankCode as the provider transfer identifier. nipInstitutionCode is a separate NIP identifier.", "NIBSS is a derived network switch signal, not a transfer destination. It becomes negative when five or more active banks are down.", "A bank can be healthy, degraded, down, or unknown when no qualifying check exists."],
    code: `curl ${PRODUCTION_API_BASE}/merchant/banks/status \\
  -H "X-API-Key: su_live_your_key"`,
  },
  {
    method: "POST",
    path: "/banks/transaction-status",
    title: "Submit a transaction outcome",
    description: "Send a payment attempt result after your provider returns an outcome. The backend classifies it, updates the bank signal when relevant, and recalculates the aggregate NIBSS signal in the same transaction.",
    auth: "X-API-Key with an ACTIVE verified merchant account and monitoring:write scope.",
    parameters: [
      { name: "X-API-Key", location: "Header", required: true, type: "string", description: "Raw active merchant API key.", example: "su_live_..." },
      { name: "bankCode", location: "Body", required: true, type: "string", description: "Provider transfer code for the destination bank. NIBSS cannot be reported directly.", example: "058" },
      { name: "transactionId", location: "Body", required: true, type: "string", description: "Your unique payment-attempt id. Reusing it makes retries idempotent.", example: "pmt_01J5Q5Q2T8" },
      { name: "status", location: "Body", required: true, type: "enum", description: "SUCCESS, FAILED, PENDING, or REVERSED.", example: "FAILED" },
      { name: "failureCategory", location: "Body", type: "enum", description: "Required for FAILED. Use a bank/network category only when the bank was responsible.", example: "BANK_TIMEOUT" },
      { name: "latencyMs", location: "Body", type: "integer", description: "Measured provider response time. Range: 0–120000 milliseconds.", example: "12000" },
      { name: "source", location: "Body", type: "string", description: "Your integration label. Defaults to business-api.", example: "paystack-production" },
    ],
    request: `{
  "bankCode": "058",
  "transactionId": "pmt_01J5Q5Q2T8",
  "status": "FAILED",
  "failureCategory": "BANK_TIMEOUT",
  "latencyMs": 12000,
  "source": "paystack-production"
}`,
    response: `{
  "success": true,
  "data": {
    "bank": { "bankCode": "058", "status": "degraded", "trustScore": 74 },
    "nibss": {
      "bankCode": "NIBSS",
      "status": "healthy",
      "networkSignal": "positive",
      "downBankCount": 3,
      "downThreshold": 5,
      "trustScore": 100
    },
    "signal": {
      "transactionId": "pmt_01J5Q5Q2T8",
      "transactionStatus": "FAILED",
      "countsAgainstUptime": true,
      "success": false,
      "impact": "negative",
      "reason": "bank_failure",
      "duplicate": false
    },
    "eventId": "event_uuid"
  },
  "meta": {}
}`,
    notes: ["SUCCESS is a positive signal.", "BANK_UNAVAILABLE, BANK_TIMEOUT, and NETWORK_ERROR reduce the uptime signal.", "INSUFFICIENT_FUNDS, INVALID_ACCOUNT, USER_CANCELLED, BUSINESS_RULE, UNKNOWN, PENDING, and REVERSED are recorded but neutral.", "NIBSS cannot be submitted directly. Its status is derived from the current bank statuses and turns negative at five down banks.", "Use the same bankCode and transactionId when retrying a request."],
    code: `curl -X POST ${PRODUCTION_API_BASE}/banks/transaction-status \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: su_live_your_key" \\
  -d '{
    "bankCode": "058",
    "transactionId": "pmt_01J5Q5Q2T8",
    "status": "FAILED",
    "failureCategory": "BANK_TIMEOUT",
    "latencyMs": 12000,
    "source": "paystack-production"
  }'`,
  },
  {
    method: "GET",
    path: "/banks/status",
    title: "Read the public network snapshot",
    description: "Unauthenticated read-only snapshot for customer-facing routing or pre-transfer checks. Every response includes the current NIBSS status under the NIBSS key.",
    auth: "None.",
    parameters: [],
    response: "The data object is a map keyed by bankCode. NIBSS includes institutionType, isNetworkSwitch, networkSignal, downBankCount, and downThreshold in addition to the common status fields.",
    code: `curl ${PRODUCTION_API_BASE}/banks/status`,
  },
  {
    method: "GET",
    path: "/banks",
    title: "List monitored institutions",
    description: "Returns active banks and the NIBSS network switch as an array. Use each institution's id to open its detail and event history endpoints.",
    auth: "None.",
    parameters: [],
    response: "The data object is an array of BankStatus objects. NIBSS is identified by institutionType network_switch and isNetworkSwitch true; it has no transfer or NIP identifier.",
    code: `curl ${PRODUCTION_API_BASE}/banks`,
  },
  {
    method: "GET",
    path: "/banks/{bankId}",
    title: "Read one institution's current signal",
    description: "Returns the complete current status object for one tracked bank or NIBSS. The id is the Safer Signal id returned by GET /banks.",
    auth: "None.",
    parameters: [{ name: "bankId", location: "Path", required: true, type: "integer", description: "Safer Signal bank id returned by GET /banks.", example: "1" }],
    response: "The data object is one BankStatus object containing bank identifiers, status, trustScore, successRate, latencyMs, logoUrl, statusSource, and timestamps.",
    code: `curl ${PRODUCTION_API_BASE}/banks/1`,
  },
  {
    method: "GET",
    path: "/banks/{bankId}/events",
    title: "Read recent institution events",
    description: "Returns recent status checks and transaction signals for one bank, or NIBSS aggregate threshold transitions, newest first.",
    auth: "None.",
    parameters: [
      { name: "bankId", location: "Path", required: true, type: "integer", description: "Safer Signal bank id returned by GET /banks.", example: "1" },
      { name: "limit", location: "Query", type: "integer", description: "Number of events to return. Defaults to 50 and is capped at 100.", example: "25" },
    ],
    response: "The data object is an array of BankEvent objects with transactionId, status, trustScore, latencyMs, source, details, and createdAt.",
    code: `curl "${PRODUCTION_API_BASE}/banks/1/events?limit=25"`,
  },
];

function CopyButton({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return (
    <button type="button" onClick={() => onCopy(value)} className="monitoring-icon-button" aria-label={copied ? "Copied" : "Copy code"} title={copied ? "Copied" : "Copy code"}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

function CodeBlock({ value, copied, onCopy }: { value: string; copied: boolean; onCopy: (value: string) => void }) {
  return (
    <div className="relative mt-4 overflow-hidden rounded-lg bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-white/[.08] px-3 py-2">
        <span className="text-[10px] font-bold uppercase tracking-[.12em] text-[#8393a7]">Example</span>
        <CopyButton value={value} copied={copied} onCopy={onCopy} />
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 text-[#d9e4f2]"><code>{value}</code></pre>
    </div>
  );
}

function EndpointCard({ doc, copied, onCopy }: { doc: EndpointDoc; copied: boolean; onCopy: (value: string) => void }) {
  return (
    <details className="group overflow-hidden rounded-[18px] bg-white" open={doc.method === "POST"}>
      <summary className="flex cursor-pointer list-none items-start gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span className={`mt-0.5 rounded px-2 py-1 text-[10px] font-extrabold tracking-[.08em] ${doc.method === "POST" ? "bg-[#d2ff3c] text-[#0a0a0a]" : "bg-[#0a0a0a] text-white"}`}>{doc.method}</span>
        <span className="min-w-0 flex-1"><code className="break-all text-sm font-bold text-[#111827]">{doc.path}</code><span className="mt-1 block text-sm font-bold text-[#111827]">{doc.title}</span></span>
        <ChevronDown size={18} className="mt-1 shrink-0 text-[#111827] transition group-open:rotate-180" />
      </summary>
      <div className="border-t border-[#e4e4de] bg-[#fafaf6] px-5 pb-6 pt-5">
        <p className="max-w-4xl text-sm font-medium leading-6 text-[#111827]">{doc.description}</p>
        <div className="mt-5 rounded-lg border border-[#e4e4de] bg-white p-4"><p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#111827]">Authentication</p><p className="mt-1 text-xs font-semibold leading-5 text-[#111827]">{doc.auth}</p></div>
        {doc.parameters.length > 0 && <div className="mt-6"><h4 className="text-xs font-extrabold uppercase tracking-[.12em] text-[#111827]">Parameters</h4><div className="mt-2 overflow-x-auto rounded-lg border border-[#cfd9e5]"><table className="min-w-full text-left text-xs"><thead className="bg-[#edf3f8] text-[#111827]"><tr><th className="px-3 py-2 font-extrabold">Name</th><th className="px-3 py-2 font-extrabold">In</th><th className="px-3 py-2 font-extrabold">Type</th><th className="px-3 py-2 font-extrabold">Required</th><th className="px-3 py-2 font-extrabold">Description</th></tr></thead><tbody className="divide-y divide-[#dce4ed]">{doc.parameters.map((parameter) => <tr key={`${parameter.location}-${parameter.name}`}><td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-[#111827]">{parameter.name}</td><td className="px-3 py-3 text-[#111827]">{parameter.location}</td><td className="px-3 py-3 font-mono text-[#111827]">{parameter.type}</td><td className="px-3 py-3">{parameter.required ? <span className="font-bold text-[#b52f26]">Yes</span> : <span className="font-semibold text-[#111827]">No</span>}</td><td className="min-w-[220px] px-3 py-3 font-medium leading-5 text-[#111827]">{parameter.description}{parameter.example && <code className="mt-1 block text-[11px] font-semibold text-[#111827]">Example: {parameter.example}</code>}</td></tr>)}</tbody></table></div></div>}
        {doc.request && <div className="mt-6"><h4 className="text-xs font-extrabold uppercase tracking-[.12em] text-[#111827]">Request body</h4><pre className="mt-2 overflow-x-auto rounded-lg border border-[#cfd9e5] bg-white p-4 text-xs leading-6 text-[#111827]"><code>{doc.request}</code></pre></div>}
        <div className="mt-6"><h4 className="text-xs font-extrabold uppercase tracking-[.12em] text-[#111827]">Response</h4><div className="mt-2 rounded-lg border border-[#cfd9e5] bg-white p-4 text-xs leading-6 text-[#111827]"><pre className="overflow-x-auto whitespace-pre-wrap"><code>{doc.response}</code></pre></div></div>
        {doc.notes && <div className="mt-5 space-y-1 text-xs font-semibold leading-5 text-[#111827]">{doc.notes.map((note) => <p key={note}>• {note}</p>)}</div>}
        <CodeBlock value={doc.code} copied={copied} onCopy={onCopy} />
      </div>
    </details>
  );
}

export default function MonitoringApiPage() {
  const { businessSession, businessLogin } = useAuth();
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const accountInactive = businessSession?.status === "INACTIVE";

  const load = async () => {
    if (!businessSession) return;
    try { const data = await apiRequest<{ keys: KeyRecord[] }>("/business/credentials", { headers: businessHeaders(businessSession) }); setKeys(data.keys || []); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Monitoring credentials could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [businessSession]);

  const rotate = async () => {
    if (!businessSession) return;
    setRotating(true); setError(""); setNewKey("");
    try {
      const result = await apiRequest<{ apiKey: string; clientId: string }>("/business/credentials/rotate", { method: "POST", headers: businessHeaders(businessSession) });
      const nextSession = { ...businessSession, clientId: result.clientId };
      businessLogin(nextSession); setNewKey(result.apiKey);
      const refreshed = await apiRequest<{ keys: KeyRecord[] }>("/business/credentials", { headers: businessHeaders(nextSession) }); setKeys(refreshed.keys || []);
    } catch (rotateError) { setError(rotateError instanceof Error ? rotateError.message : "The monitoring key could not be rotated."); } finally { setRotating(false); }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* Clipboard access may be unavailable. */ }
    setCopied(value); window.setTimeout(() => setCopied((current) => current === value ? "" : current), 1600);
  };

  return <div className="monitoring-content monitoring-api-page">
    <div className="monitoring-page-heading"><div><h1>API</h1><p>Read bank signals and send verified transaction outcomes.</p></div></div>
    <section className="monitoring-panel mt-7 overflow-hidden"><div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.14em] text-[#111827]">Production base URL</p><code className="mt-2 block break-all text-sm font-bold text-[#111827]">{PRODUCTION_API_BASE}</code><p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-[#111827]">The public service origin is <strong>https://signal.saference.com</strong>. Every endpoint below is available under <code>/api/v1</code>.</p></div><span className="pill shrink-0 !bg-[#f5f5f1]">Server-to-server</span></div></section>
    {accountInactive && <div className="monitoring-alert">Account inactive. API access unlocks once an operator approves this account.</div>}
    {error && <div className="monitoring-alert monitoring-alert-danger">{error}</div>}
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="monitoring-panel border-[#cfd9e5] p-6 shadow-[0_8px_24px_rgba(23,43,67,.05)]"><div className="flex flex-col gap-4 border-b border-[#dce4ed] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h2>API keys</h2><p className="mt-1 text-xs font-semibold text-[#6f6f69]">Use keys only from trusted servers.</p></div><button onClick={rotate} disabled={rotating || accountInactive} className="monitoring-button monitoring-button-secondary">{rotating ? "Rotating..." : "Rotate key"}</button></div>{newKey && <div className="mt-5 rounded-lg border border-[#f2d59b] bg-[#fff9e8] p-4"><p className="text-sm font-bold text-[#7a5200]">Copy this key now</p><p className="mt-1 text-xs font-semibold text-[#7a5200]">It will not be displayed again after you leave this page.</p><code className="mt-3 block break-all rounded bg-white p-3 text-xs font-semibold text-[#111827]">{newKey}</code></div>}{loading ? <p className="py-6 text-sm font-semibold text-[#111827]">Loading credentials...</p> : <div className="mt-5 space-y-3">{keys.map((key) => <div key={key.id} className="rounded-lg border border-[#d5dee8] bg-white p-4"><div className="flex items-center justify-between gap-4"><code className="font-mono text-sm font-bold text-[#111827]">{key.keyPrefix}••••••</code><span className={`rounded px-2 py-1 text-[10px] font-bold ${key.revokedAt ? "bg-[#f1f3f5] text-[#111827]" : "bg-[#e9fbf4] text-[#087c54]"}`}>{key.revokedAt ? "REVOKED" : "ACTIVE"}</span></div><p className="mt-2 text-xs font-semibold text-[#111827]">Scopes: {(key.scopes || []).join(", ")} · Created {new Date(key.createdAt).toLocaleDateString()}</p></div>)}</div>}<p className="mt-6 text-xs font-semibold leading-5 text-[#a1251b]">Never ship keys in a browser app, mobile bundle, or public repository.</p></section>
      <aside className="monitoring-panel border-[#cfd9e5] p-6 shadow-[0_8px_24px_rgba(23,43,67,.05)]"><h2>Authentication</h2><div className="mt-5 space-y-5 text-xs font-semibold leading-5 text-[#111827]"><div><p className="font-extrabold text-[#111827]">Merchant integration</p><p className="mt-1">Send <code>X-API-Key</code> from your backend. An ACTIVE account with <code>monitoring:read</code> can read protected status; <code>monitoring:write</code> is required to submit outcomes.</p></div><div><p className="font-extrabold text-[#111827]">Business console</p><p className="mt-1">Console requests use <code>ClientID</code> and <code>Authorization: Bearer ...</code>. These are for the dashboard session, not public customer traffic.</p></div><div><p className="font-extrabold text-[#111827]">Response envelope</p><p className="mt-1">Successful responses use <code>success</code>, <code>data</code>, and <code>meta</code>. Errors include <code>error.code</code>, <code>error.message</code>, and <code>requestId</code>.</p></div></div></aside>
    </div>
    <section className="mt-7"><div className="mb-5"><h2 className="text-3xl font-black tracking-[-.045em]">Endpoints</h2></div><div className="space-y-4">{endpointDocs.map((doc) => <EndpointCard key={`${doc.method}-${doc.path}`} doc={doc} copied={copied === doc.code} onCopy={copy} />)}</div></section>
    <section className="mt-7 grid gap-6 lg:grid-cols-2"><div className="monitoring-panel border-[#cfd9e5] p-6 shadow-[0_8px_24px_rgba(23,43,67,.05)]"><h2>HTTP status codes</h2><div className="mt-4 space-y-3 text-xs font-semibold leading-5 text-[#111827]"><p><code className="font-bold text-[#087c54]">200 / 201</code> Request completed successfully.</p><p><code className="font-bold text-[#b52f26]">400</code> Invalid or incomplete parameters.</p><p><code className="font-bold text-[#b52f26]">401</code> Missing, expired, revoked, or inactive credentials.</p><p><code className="font-bold text-[#b52f26]">403</code> Valid credential without the required scope or account state.</p><p><code className="font-bold text-[#b52f26]">404</code> Bank or resource does not exist.</p><p><code className="font-bold text-[#b52f26]">409</code> Duplicate resource. Transaction retries with the same id are handled as duplicates inside the success response.</p><p><code className="font-bold text-[#b52f26]">429</code> Rate limit reached. Retry with backoff.</p></div></div><div className="monitoring-panel border-[#cfd9e5] p-6 shadow-[0_8px_24px_rgba(23,43,67,.05)]"><h2>Recommended integration flow</h2><ol className="mt-4 space-y-3 text-xs font-semibold leading-5 text-[#111827]"><li><span className="mr-2 font-bold text-[#0a0a0a]">1.</span>Call <code>/merchant/account</code> and confirm <code>eligibility.canContributeBankStatus</code> before sending writes.</li><li><span className="mr-2 font-bold text-[#0a0a0a]">2.</span>Call <code>/merchant/banks/status</code> and evaluate both the destination bank and the included <code>NIBSS</code> network switch signal.</li><li><span className="mr-2 font-bold text-[#0a0a0a]">3.</span>Execute or authorize the payment through your provider.</li><li><span className="mr-2 font-bold text-[#0a0a0a]">4.</span>POST the resulting status with a stable <code>transactionId</code>.</li><li><span className="mr-2 font-bold text-[#0a0a0a]">5.</span>Persist the returned <code>requestId</code> and <code>eventId</code> for support and reconciliation.</li></ol></div></section>
  </div>;
}
