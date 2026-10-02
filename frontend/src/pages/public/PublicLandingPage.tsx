import { Activity, ArrowRight, ArrowUpRight, Gauge, RefreshCw, Search, ShieldCheck, Terminal, Wifi } from "lucide-react";
import { Link } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { StatusBadge } from "../../components/MonitoringStatus";
import { usePublicBankStatuses } from "../../hooks/usePublicBankStatuses";
import { average } from "../../lib/monitoring";

function shortBankName(name: string) {
  if (name.includes("(NIBSS)")) return "NIBSS";
  return name
    .replace(" Digital Services Limited (OPay)", "")
    .replace(" Microfinance Bank", " MFB")
    .replace(" Microfinance Bank Limited", " MFB")
    .replace(" Company Limited", "")
    .replace(" Company Ltd", "");
}

export default function PublicLandingPage() {
  const { banks, loading, refreshing, error, lastUpdated, refresh } = usePublicBankStatuses();
  const healthy = banks.filter((bank) => !bank.isNetworkSwitch && bank.status === "healthy").length;
  const watch = banks.filter((bank) => bank.status === "degraded").length;
  const averageTrust = average(banks.map((bank) => bank.trustScore));
  const averageLatency = average(banks.map((bank) => bank.latencyMs));
  const featuredCandidates = banks.filter((bank) => bank.featured);
  const featured = [...(featuredCandidates.length ? featuredCandidates : banks)]
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .slice(0, 6);
  const feedBanks = featured.length ? featured.slice(0, 5) : banks.slice(0, 5);

  return <div className="public-monitoring-content public-cronconut-page">
    <section className="public-cron-hero">
      <div className="public-cron-grid" />
      <div className="public-cron-hero-inner">
        <div className="public-cron-hero-copy">
          <p className="public-cron-kicker"><span className="public-cron-kicker-dot" /> Bank network monitoring</p>
          <h1><span>NETWORKS</span><span>READY <em>WHEN IT MATTERS.</em></span></h1>
          <p className="public-cron-lede">Check the signal before money moves. Safer Signal gives teams a clear, public view of bank availability, latency, trust, and recent network events.</p>
          <div className="public-cron-actions">
            <Link to="/monitoring" className="public-cron-primary"><Search size={16} /> Browse banks <ArrowRight size={15} /></Link>
            <Link to="/login" className="public-cron-secondary"><Terminal size={15} /> Business console</Link>
          </div>
          <div className="public-cron-live-note"><span className="public-cron-pulse" /> Read-only public telemetry <span className="public-cron-divider" /> No account required</div>
        </div>

        <div className="public-cron-hero-visual" aria-label="Live bank network status preview">
          <div className="public-cron-feed-heading"><div><p>Live network feed</p><span>Current public telemetry</span></div><span className="public-cron-live-chip"><span /> Live</span></div>
          <div className="public-cron-feed-stats">
            <div><span>Tracked</span><strong>{loading ? "--" : banks.length}</strong><small>institutions</small></div>
            <div><span>Ready now</span><strong>{loading ? "--" : healthy}</strong><small>healthy routes</small></div>
            <div><span>Trust avg.</span><strong>{loading ? "--" : averageTrust ?? "--"}</strong><small>out of 100</small></div>
          </div>
          <div className="public-cron-feed-list">
            {loading ? <div className="public-cron-feed-empty">Loading network signal...</div> : feedBanks.map((bank, index) => <Link key={bank.id} to={`/monitoring/banks/${bank.id}`} className={`public-cron-feed-row public-cron-feed-row-${index}`}>
              <BankMark name={bank.name} logoUrl={bank.logoUrl} size="sm" />
              <div className="public-cron-feed-name"><strong>{shortBankName(bank.name)}</strong><code>{bank.isNetworkSwitch ? "NATIONAL SWITCH" : bank.nipInstitutionCode || bank.bankCode}</code></div>
              <span className={`public-cron-status public-cron-status-${bank.status}`}><span />{bank.status}</span>
              <ArrowUpRight size={14} />
            </Link>)}
          </div>
          <div className="public-cron-feed-footer"><span>Updated {lastUpdated ? lastUpdated.toLocaleTimeString() : "waiting"}</span><button onClick={() => void refresh()} disabled={refreshing} aria-label="Refresh public telemetry"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /></button></div>
        </div>
      </div>
    </section>

    <section className="public-cron-proof">
      <div className="public-cron-proof-copy"><p className="public-cron-label"><Wifi size={13} /> Before the transfer</p><h2>Clarity for every route.</h2><p>Know when a bank is ready, when it is slowing down, and when it needs attention. Use the same signal across operations, payments, and customer support.</p><Link to="/monitoring" className="public-cron-inline-link">Explore the network <ArrowRight size={14} /></Link></div>
      <div className="public-cron-metrics"><div><strong>{loading ? "--" : healthy}</strong><span>healthy now</span></div><div><strong>{loading ? "--" : watch}</strong><span>on watch</span></div><div><strong>{loading ? "--" : averageLatency ? `${averageLatency}ms` : "--"}</strong><span>avg. latency</span></div><div><strong>{loading ? "--" : "100%"}</strong><span>catalog coverage</span></div></div>
    </section>

    <section className="public-cron-banks">
      <div className="public-cron-section-top"><div><p className="public-cron-label"><Gauge size={13} /> Popular routes</p><h2>Pick a bank. Read the signal.</h2><p>Open a live report for the institutions teams check most often.</p></div><Link to="/monitoring" className="public-cron-inline-link">See all banks <ArrowRight size={14} /></Link></div>
      {error && <div className="monitoring-alert monitoring-alert-danger mt-6"><Activity size={17} />{error}</div>}
      {loading ? <div className="public-cron-loading">Loading bank network...</div> : <div className="public-cron-bank-grid">{featured.map((bank) => <Link key={bank.id} to={`/monitoring/banks/${bank.id}`} className="public-cron-bank-card">
        <div className="public-cron-bank-card-head"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><span className={`public-cron-status public-cron-status-${bank.status}`}><span />{bank.status}</span></div>
        <div className="public-cron-bank-card-name"><strong>{shortBankName(bank.name)}</strong><code>{bank.isNetworkSwitch ? "National payment switch" : `NIP ${bank.nipInstitutionCode || "--"}`}</code></div>
        <div className="public-cron-bank-card-foot"><span>{bank.isNetworkSwitch ? "Network signal" : "Uptime signal"}</span><strong>{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</strong><ArrowUpRight size={15} /></div>
      </Link>)}</div>}
    </section>

    <section className="public-cron-final-cta"><div><p className="public-cron-label"><ShieldCheck size={13} /> Built for decisions</p><h2>Make the next payment with more signal.</h2><p>Public reports for everyone. Deeper telemetry for teams that need to act before a failed transaction becomes a customer issue.</p></div><div className="public-cron-final-actions"><Link to="/monitoring" className="public-cron-primary">View reports <ArrowRight size={15} /></Link><Link to="/login" className="public-cron-secondary">Open console</Link></div></section>
  </div>;
}
