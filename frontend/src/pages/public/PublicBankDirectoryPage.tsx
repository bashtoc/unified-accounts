import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { usePublicBankStatuses } from "../../hooks/usePublicBankStatuses";
import { statusLabel } from "../../lib/monitoring";

const PAGE_SIZE = 25;

export default function PublicBankDirectoryPage() {
  const { banks, loading, refreshing, error, lastUpdated, refresh } = usePublicBankStatuses();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return banks.filter((bank) => {
      const matchesQuery = !normalizedQuery || `${bank.name} ${bank.bankCode} ${bank.nipInstitutionCode || ""}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (filter === "all" || bank.status === filter);
    });
  }, [banks, filter, query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, query]);

  const visibleBanks = filtered.slice(0, visibleCount);
  const healthyCount = banks.filter((bank) => !bank.isNetworkSwitch && bank.status === "healthy").length;
  const hasMore = visibleCount < filtered.length;

  return <div className="site-wrap pb-24">
    <div className="page-head">
      <h1>Banks</h1>
      <div className="page-head-meta">
        <span>{loading ? "Loading..." : `${healthyCount} of ${banks.length} healthy`}{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}</span>
        <button type="button" onClick={() => void refresh()} disabled={refreshing} className="btn btn-sm btn-ghost">{refreshing ? "Refreshing..." : "Refresh"}</button>
      </div>
    </div>

    <div className="toolbar">
      <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or code" aria-label="Search banks or codes" />
      <select value={filter} onChange={(event) => setFilter(event.target.value)} className="select" aria-label="Filter bank status"><option value="all">All statuses</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="down">Down</option><option value="unknown">Unknown</option></select>
    </div>

    {error && <div className="notice notice-danger">{error}</div>}

    {loading ? <div className="empty">Loading banks...</div> : filtered.length === 0 ? <div className="empty">No banks match this search.</div> : <section className="bank-table">
      <div className="bank-table-head"><span>Bank</span><span>Status</span><span>Trust</span><span>Uptime</span><span>Latency</span></div>
      {visibleBanks.map((bank) => <Link key={bank.id} to={`/monitoring/banks/${bank.id}`} className="bank-row">
        <div className="bank-row-name">
          <BankMark name={bank.name} logoUrl={bank.logoUrl} size="sm" />
          <div className="min-w-0"><strong>{bank.name}</strong><small>{bank.isNetworkSwitch ? "National payment switch" : `NIP ${bank.nipInstitutionCode || "--"} · ${bank.bankCode}`}</small></div>
        </div>
        <span className="status-text"><span className={`dot dot-${bank.status}`} />{statusLabel(bank.status)}</span>
        <span className="num">{bank.trustScore}</span>
        <span className="num">{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</span>
        <span className="num">{bank.isNetworkSwitch ? `${bank.downBankCount ?? 0}/${bank.downThreshold ?? 5} down` : bank.latencyMs ? `${bank.latencyMs}ms` : "--"}</span>
      </Link>)}
      <div className="table-foot">
        <span>Showing {visibleBanks.length} of {filtered.length}</span>
        {hasMore && <button type="button" className="btn btn-sm" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>Load more</button>}
      </div>
    </section>}
  </div>;
}
