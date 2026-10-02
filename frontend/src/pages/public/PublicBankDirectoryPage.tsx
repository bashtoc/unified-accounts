import { Activity, ArrowLeft, ArrowRight, ArrowUpRight, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { usePublicBankStatuses } from "../../hooks/usePublicBankStatuses";
import { average, formatDate, statusLabel } from "../../lib/monitoring";

const PAGE_SIZE = 25;

function statusTone(status: string) {
  if (status === "healthy") return "public-cron-directory-status-healthy";
  if (status === "degraded") return "public-cron-directory-status-degraded";
  if (status === "down") return "public-cron-directory-status-down";
  return "public-cron-directory-status-unknown";
}

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
  const watchCount = banks.filter((bank) => bank.status === "degraded" || bank.status === "down").length;
  const trustAverage = average(banks.map((bank) => bank.trustScore));
  const hasMore = visibleCount < filtered.length;

  return <div className="public-cron-directory-page">
    <div className="public-cron-directory-grid" aria-hidden="true" />
    <div className="public-cron-directory-inner">
      <Link to="/" className="public-cron-directory-back"><ArrowLeft size={14} /> Back to network overview</Link>

      <div className="public-cron-directory-heading">
        <div className="public-cron-directory-copy">
          <p className="public-cron-label"><SlidersHorizontal size={14} /> Public network monitor</p>
          <h1>Select a bank.<br /><em>Read the signal.</em></h1>
          <p>Browse live availability, trust, and response data for every institution in the network. No account is required to view a report.</p>
        </div>
        <div className="public-cron-directory-actions">
          <button type="button" onClick={() => void refresh()} disabled={refreshing} className="public-cron-directory-refresh"><RefreshCw size={15} className={refreshing ? "animate-spin" : ""} /> Refresh network</button>
          <span className="public-cron-directory-live"><span /> Read-only telemetry <i /> {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for telemetry"}</span>
        </div>
      </div>

      <div className="public-cron-directory-metrics" aria-label="Network summary">
        <div><span>Tracked</span><strong>{loading ? "--" : banks.length}</strong><small>institutions</small></div>
        <div><span>Healthy now</span><strong>{loading ? "--" : healthyCount}</strong><small>available routes</small></div>
        <div><span>On watch</span><strong>{loading ? "--" : watchCount}</strong><small>need attention</small></div>
        <div><span>Trust average</span><strong>{loading ? "--" : trustAverage ?? "--"}</strong><small>out of 100</small></div>
      </div>

      {error && <div className="public-cron-directory-error"><Activity size={16} /> {error}</div>}

      <section className="public-cron-directory-panel">
        <div className="public-cron-directory-toolbar">
          <div>
            <p className="public-cron-label">Bank network</p>
            <h2>All institutions</h2>
            <span>{loading ? "Loading current signal..." : `Showing ${visibleBanks.length} of ${filtered.length} matching ${banks.length === 1 ? "institution" : "institutions"}`}</span>
          </div>
          <div className="public-cron-directory-controls">
            <label className="public-cron-directory-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search banks or codes" aria-label="Search banks or codes" /></label>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className="public-cron-directory-select" aria-label="Filter bank status"><option value="all">All statuses</option><option value="healthy">Healthy</option><option value="degraded">Degraded</option><option value="down">Down</option><option value="unknown">Unknown</option></select>
          </div>
        </div>

        {loading ? <div className="public-cron-directory-empty">Loading current bank signal...</div> : filtered.length === 0 ? <div className="public-cron-directory-empty">No banks match this search or status filter.</div> : <div className="public-cron-directory-list">
          {visibleBanks.map((bank) => <Link key={bank.id} to={`/monitoring/banks/${bank.id}`} className="public-cron-directory-row">
            <div className="public-cron-directory-bank">
              <BankMark name={bank.name} logoUrl={bank.logoUrl} />
              <div><strong>{bank.name}</strong><code>{bank.isNetworkSwitch ? `National payment switch · negative at ${bank.downThreshold ?? 5} banks down` : `NIP ${bank.nipInstitutionCode || "not published"} · transfer ${bank.bankCode}`}</code></div>
            </div>
            <div className={`public-cron-directory-status ${statusTone(bank.status)}`}><span />{statusLabel(bank.status)}</div>
            <div className="public-cron-directory-trust"><span>Trust</span><div><i style={{ width: `${Math.max(0, Math.min(100, bank.trustScore))}%` }} /></div><strong>{bank.trustScore}</strong></div>
            <div className="public-cron-directory-signal"><strong>{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</strong><span>{bank.isNetworkSwitch ? "network signal" : "uptime"}</span></div>
            <div className="public-cron-directory-signal"><strong>{bank.isNetworkSwitch ? `${bank.downBankCount ?? 0}/${bank.downThreshold ?? 5}` : bank.latencyMs ? `${bank.latencyMs}ms` : "--"}</strong><span>{bank.isNetworkSwitch ? "banks down" : bank.lastCheckedAt ? formatDate(bank.lastCheckedAt) : "no sample"}</span></div>
            <ArrowUpRight size={16} />
          </Link>)}
        </div>}

        {!loading && filtered.length > 0 && <div className="public-cron-directory-footer">
          <span>{hasMore ? `${filtered.length - visibleBanks.length} more institutions in this result` : "End of matching institutions"}</span>
          {hasMore && <button type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}><span>Load 25 more</span><ArrowRight size={15} /></button>}
        </div>}
      </section>
    </div>
  </div>;
}
