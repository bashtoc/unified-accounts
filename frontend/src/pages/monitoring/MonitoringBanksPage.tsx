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
          <h1>Banks</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="monitoring-meta hidden sm:inline">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : ""}</span>
          <button onClick={() => void refresh()} disabled={refreshing} className="monitoring-button monitoring-button-secondary">{refreshing ? "Refreshing..." : "Refresh"}</button>
        </div>
      </div>
      {error && <div className="monitoring-alert monitoring-alert-danger">{error}</div>}
      <section className="monitoring-panel mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-[#e4e4de] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div><h2>{filtered.length} of {banks.length}</h2><p className="mt-1 text-xs text-[#9a9a93]">Showing {firstVisible}-{lastVisible}</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><label className="monitoring-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search banks or codes" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="monitoring-select"><option value="all">All statuses</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="down">Down</option><option value="unknown">Unknown</option></select></div>
        </div>
        {loading ? <div className="p-6 text-sm text-[#6f6f69]">Loading bank inventory...</div> : filtered.length === 0 ? <div className="p-10 text-center text-sm text-[#6f6f69]">No institutions match the current filters.</div> : <div className="divide-y divide-[#e4e4de]">{visibleBanks.map((bank) => <Link key={bank.id} to={`/business/monitoring/banks/${bank.id}`} className="monitoring-bank-row group"><div className="flex min-w-0 items-center gap-3"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><div className="min-w-0"><p className="truncate font-bold">{bank.name}</p><p className="mt-1 text-xs text-[#9a9a93]">{bank.isNetworkSwitch ? "National payment switch" : `${bank.bankCode} · NIP ${bank.nipInstitutionCode || "--"}`}</p></div></div><StatusBadge status={bank.status} /><div><TrustBar score={bank.trustScore} /></div><div className="text-right"><p className="text-sm font-bold">{bank.isNetworkSwitch ? bank.networkSignal || "—" : bank.successRate === null || bank.successRate === undefined ? "—" : `${bank.successRate}%`}</p><p className="mt-1 text-xs text-[#9a9a93]">{bank.isNetworkSwitch ? `${bank.downBankCount ?? 0}/${bank.downThreshold ?? 5} down` : bank.latencyMs ? `${bank.latencyMs}ms` : "--"}</p></div><div className="text-right text-xs font-semibold text-[#9a9a93]" title={formatDate(bank.lastCheckedAt)}>{formatRelative(bank.lastCheckedAt)}</div></Link>)}</div>}
        {!loading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t border-[#e4e4de] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs font-semibold text-[#9a9a93]">Page {page} of {totalPages}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Previous page" className="monitoring-button monitoring-button-secondary">Previous</button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Next page" className="monitoring-button monitoring-button-secondary">Next</button></div></div>}
      </section>
    </div>
  );
}
