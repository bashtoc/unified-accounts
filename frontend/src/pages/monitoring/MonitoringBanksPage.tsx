import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import BankMark from "../../components/BankMark";
import { StatusBadge, TrustBar } from "../../components/MonitoringStatus";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatRelative } from "../../lib/monitoring";
import { useBankStatuses } from "../../hooks/useBankStatuses";

const PAGE_SIZE = 25;

export default function MonitoringBanksPage() {
  const { businessSession } = useAuth();
  const { banks, loading, refreshing, error, lastUpdated, refresh } = useBankStatuses(businessSession);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => banks.filter((bank) => `${bank.name} ${bank.bankCode} ${bank.nipInstitutionCode || ""}`.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || bank.status === filter)), [banks, filter, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filter, query]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleBanks = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const firstVisible = filtered.length === 0 ? 0 : pageStart + 1;
  const lastVisible = Math.min(pageStart + PAGE_SIZE, filtered.length);

  return (
    <div className="monitoring-content">
      <div className="monitoring-page-heading">
        <div>
          <p className="monitoring-eyebrow"><SlidersHorizontal size={14} /> Coverage inventory</p>
          <h1>Bank network</h1>
          <p>Inspect every tracked institution and open its event history.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-semibold text-[#7a8b9f] sm:inline">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for telemetry"}</span>
          <button onClick={() => void refresh()} disabled={refreshing} className="monitoring-button monitoring-button-secondary"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
        </div>
      </div>
      {error && <div className="monitoring-alert monitoring-alert-danger">{error}</div>}
      <section className="monitoring-panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#edf1f5] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2>Tracked institutions <span className="ml-1 text-sm font-semibold text-[#8290a2]">{filtered.length}/{banks.length}</span></h2><p className="mt-1 text-xs text-[#8290a2]">Batch {page} of {totalPages} · Showing {firstVisible}-{lastVisible} · Auto-refreshing every 15 seconds</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><label className="monitoring-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search banks or codes" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="monitoring-select"><option value="all">All statuses</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="down">Down</option><option value="unknown">Unknown</option></select></div>
        </div>
        {loading ? <div className="p-6 text-sm text-[#728399]">Loading bank inventory...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-[#728399]">No institutions match the current filters.</div> : <div className="divide-y divide-[#edf1f5]">{visibleBanks.map((bank) => <Link key={bank.id} to={`/business/monitoring/banks/${bank.id}`} className="monitoring-bank-row group"><div className="flex min-w-0 items-center gap-3"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><div className="min-w-0"><p className="truncate font-bold text-[#15263c]">{bank.name}</p><p className="mt-1 text-xs font-semibold text-[#8a98a9]">{bank.isNetworkSwitch ? "National payment switch" : `NIP code ${bank.nipInstitutionCode || "not published"}`}</p><p className="mt-1 text-[11px] text-[#9aa6b4]">{bank.isNetworkSwitch ? `Negative at ${bank.downThreshold ?? 5} banks down` : `Transfer code ${bank.bankCode}`}</p></div></div><StatusBadge status={bank.status} /><div className="hidden md:block"><TrustBar score={bank.trustScore} /></div><div className="hidden text-right lg:block"><p className="text-xs font-bold text-[#344961]">{bank.isNetworkSwitch ? bank.networkSignal || "—" : bank.successRate === null || bank.successRate === undefined ? "—" : `${bank.successRate}% success`}</p><p className="mt-1 text-[11px] text-[#8a98a9]">{bank.isNetworkSwitch ? `${bank.downBankCount ?? 0}/${bank.downThreshold ?? 5} banks down` : bank.latencyMs ? `${bank.latencyMs}ms latency` : "No latency sample"}</p></div><div className="hidden text-right xl:block"><p className="text-xs font-semibold text-[#52657c]">{formatRelative(bank.lastCheckedAt)}</p><p className="mt-1 text-[11px] text-[#9aa6b4]">{formatDate(bank.lastCheckedAt)}</p></div><span className="text-[#a1adbb] transition group-hover:text-[#0b5cff]">→</span></Link>)}</div>}
        {!loading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-[#edf1f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold text-[#8290a2]">Batch {page} of {totalPages}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous batch" className="monitoring-button monitoring-button-secondary"><ChevronLeft size={15} /> Previous</button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next batch" className="monitoring-button monitoring-button-secondary">Next <ChevronRight size={15} /></button></div></div>}
      </section>
    </div>
  );
}
