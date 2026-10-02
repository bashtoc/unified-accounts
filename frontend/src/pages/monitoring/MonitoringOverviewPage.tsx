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
  const recent = [...banks].sort((a, b) => statusRank(a.status) - statusRank(b.status)).slice(0, 8);
  const businessBankPath = (bankId: number) => `/business/monitoring/banks/${bankId}`;

  return <div className="monitoring-content">
    <div className="monitoring-page-heading"><h1>Overview</h1><div className="flex items-center gap-4"><span className="monitoring-meta hidden sm:inline">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}</span><button onClick={() => void refresh()} disabled={refreshing} className="monitoring-button monitoring-button-secondary">{refreshing ? "Refreshing..." : "Refresh"}</button></div></div>
    {error && <div className="monitoring-alert monitoring-alert-danger">{error}</div>}
    <div className="monitoring-stat-grid">
      <div className="monitoring-stat"><p className="monitoring-label">Healthy now</p><p className="monitoring-stat-value">{loading ? "--" : healthy}<small>/{banks.length}</small></p></div>
      <div className="monitoring-stat"><p className="monitoring-label">Need attention</p><p className="monitoring-stat-value">{loading ? "--" : attention}</p></div>
      <div className="monitoring-stat"><p className="monitoring-label">Average trust</p><p className="monitoring-stat-value">{loading ? "--" : averageTrust ?? "--"}<small>/100</small></p></div>
      <div className="monitoring-stat"><p className="monitoring-label">Average latency</p><p className="monitoring-stat-value">{loading || !averageLatency ? "--" : averageLatency}<small>{averageLatency ? "ms" : ""}</small></p></div>
    </div>

    <section className="monitoring-panel mt-6 overflow-hidden"><div className="monitoring-panel-heading"><h2>Riskiest first</h2><Link to="/business/monitoring/banks" className="monitoring-text-link">All banks</Link></div>{loading ? <div className="p-6 text-sm text-[#6f6f69]">Loading...</div> : recent.length === 0 ? <div className="p-6 text-sm text-[#6f6f69]">No data yet.</div> : <div className="divide-y divide-[#e4e4de]">{recent.map((bank) => <Link key={bank.id} to={businessBankPath(bank.id)} className="monitoring-row"><BankMark name={bank.name} logoUrl={bank.logoUrl} size="sm" /><div className="min-w-0 flex-1"><p className="truncate font-bold">{bank.name}</p><p className="mt-1 text-xs text-[#9a9a93]">{bank.isNetworkSwitch ? "National switch" : `${bank.bankCode} · NIP ${bank.nipInstitutionCode || "--"}`} · {formatRelative(bank.lastCheckedAt)}</p></div><div className="hidden w-32 sm:block"><TrustBar score={bank.trustScore} /></div><StatusBadge status={bank.status} /></Link>)}</div>}</section>
  </div>;
}
