import { Activity, ArrowUpRight, Clock3, Gauge, RefreshCw, Server, ShieldCheck, Siren } from "lucide-react";
import { Link } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { StatusBadge, TrustBar } from "../../components/MonitoringStatus";
import { useAuth } from "../../context/AuthContext";
import { average, formatRelative, statusRank } from "../../lib/monitoring";
import { useBankStatuses } from "../../hooks/useBankStatuses";

export default function MonitoringOverviewPage() {
  const { businessSession } = useAuth();
  const { banks, loading, refreshing, error, lastUpdated, refresh } = useBankStatuses(businessSession);
  const healthy = banks.filter((bank) => bank.status === "healthy").length;
  const attention = banks.filter((bank) => bank.status === "degraded" || bank.status === "down").length;
  const averageTrust = average(banks.map((bank) => bank.trustScore));
  const averageLatency = average(banks.map((bank) => bank.latencyMs));
  const incidents = [...banks].sort((a, b) => statusRank(a.status) - statusRank(b.status)).filter((bank) => bank.status !== "healthy").slice(0, 4);
  const recent = [...banks].sort((a, b) => statusRank(a.status) - statusRank(b.status)).slice(0, 8);
  const businessBankPath = (bankId: number) => `/business/monitoring/banks/${bankId}`;

  return <div className="monitoring-content">
    <div className="monitoring-page-heading"><div><p className="monitoring-eyebrow"><Activity size={14} /> Network operations</p><h1>Bank network overview</h1><p>Make payment decisions with a current view of availability, latency, and trust.</p></div><div className="flex items-center gap-3"><span className="hidden text-xs font-semibold text-[#7a8b9f] sm:inline">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for telemetry"}</span><button onClick={() => void refresh()} disabled={refreshing} className="monitoring-button monitoring-button-secondary"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button></div></div>
    {error && <div className="monitoring-alert monitoring-alert-danger"><Siren size={18} /><div><p className="font-bold">Telemetry unavailable</p><p className="mt-1 text-xs">{error}</p></div></div>}
    <div className="monitoring-stat-grid">
      <div className="monitoring-stat"><span className="monitoring-stat-icon bg-[#eaf2ff] text-[#0b5cff]"><Server size={18} /></span><div><p className="monitoring-label">Institutions tracked</p><p className="monitoring-stat-value">{loading ? "—" : banks.length}</p><p className="monitoring-stat-detail">Across the monitored network</p></div></div>
      <div className="monitoring-stat"><span className="monitoring-stat-icon bg-[#e8fbf3] text-[#087c54]"><ShieldCheck size={18} /></span><div><p className="monitoring-label">Healthy now</p><p className="monitoring-stat-value">{loading ? "—" : healthy}</p><p className="monitoring-stat-detail">{banks.length ? `${Math.round((healthy / banks.length) * 100)}% of tracked banks` : "No telemetry yet"}</p></div></div>
      <div className="monitoring-stat"><span className="monitoring-stat-icon bg-[#fff7e8] text-[#a76400]"><Gauge size={18} /></span><div><p className="monitoring-label">Average trust</p><p className="monitoring-stat-value">{loading ? "—" : averageTrust ?? "—"}<small>/100</small></p><p className="monitoring-stat-detail">Calculated from recent checks</p></div></div>
      <div className="monitoring-stat"><span className="monitoring-stat-icon bg-[#f0edff] text-[#6654d9]"><Clock3 size={18} /></span><div><p className="monitoring-label">Average latency</p><p className="monitoring-stat-value">{loading ? "—" : averageLatency ? `${averageLatency}` : "—"}<small>{averageLatency ? "ms" : ""}</small></p><p className="monitoring-stat-detail">Across available samples</p></div></div>
    </div>

    {attention > 0 && <div className="monitoring-alert monitoring-alert-warning"><Siren size={18} /><div className="min-w-0 flex-1"><p className="font-bold">{attention} bank{attention === 1 ? " requires" : "s require"} attention</p><p className="mt-1 text-xs">Review the affected network before exposing it as a payment route.</p></div><Link to="/business/monitoring/banks" className="monitoring-text-link">Review network <ArrowUpRight size={14} /></Link></div>}

    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="monitoring-panel overflow-hidden"><div className="monitoring-panel-heading"><div><h2>Current network status</h2><p>Prioritized by operational risk.</p></div><Link to="/business/monitoring/banks" className="monitoring-text-link">View all <ArrowUpRight size={14} /></Link></div>{loading ? <div className="p-6 text-sm text-[#728399]">Loading current telemetry...</div> : recent.length === 0 ? <div className="p-6 text-sm text-[#728399]">No bank telemetry is available yet.</div> : <div className="divide-y divide-[#edf1f5]">{recent.map((bank) => <Link key={bank.id} to={businessBankPath(bank.id)} className="monitoring-row group"><BankMark name={bank.name} logoUrl={bank.logoUrl} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold text-[#15263c]">{bank.name}</p><span className="text-[11px] font-semibold text-[#8997a8]">NIP {bank.nipInstitutionCode || "—"}</span></div><p className="mt-1 text-xs text-[#8190a2]">Transfer code {bank.bankCode} · Checked {formatRelative(bank.lastCheckedAt)}</p></div><div className="hidden w-32 sm:block"><TrustBar score={bank.trustScore} /></div><div className="flex items-center gap-3"><StatusBadge status={bank.status} /><ArrowUpRight size={15} className="text-[#9ba9b9] transition group-hover:text-[#0b5cff]" /></div></Link>)}</div>}</section>
      <div className="space-y-6"><section className="monitoring-panel p-5"><div className="flex items-center gap-2"><Siren size={17} className={attention ? "text-[#d88913]" : "text-[#16a572]"} /><h2>Attention queue</h2></div>{incidents.length === 0 ? <p className="mt-4 text-sm leading-6 text-[#728399]">No degraded or down banks in the current telemetry window.</p> : <div className="mt-4 space-y-3">{incidents.map((bank) => <Link key={bank.id} to={businessBankPath(bank.id)} className="flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3"><BankMark name={bank.name} logoUrl={bank.logoUrl} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#21334b]">{bank.name}</p><p className="mt-1 text-[11px] text-[#8290a1]">Trust {bank.trustScore}/100</p></div><StatusBadge status={bank.status} /></Link>)}</div>}</section><section className="monitoring-panel p-5"><div className="flex items-center gap-2"><Activity size={17} className="text-[#0b5cff]" /><h2>Read-only monitoring</h2></div><p className="mt-3 text-sm leading-6 text-[#728399]">Review current bank availability, trust, latency, and event history here. Verified merchant services contribute signals through the API.</p><Link to="/business/monitoring/api" className="monitoring-button monitoring-button-secondary mt-5 w-full justify-center">View API access</Link></section></div>
    </div>
  </div>;
}
