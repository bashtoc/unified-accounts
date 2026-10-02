import { Link } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { usePublicBankStatuses } from "../../hooks/usePublicBankStatuses";
import { average, statusLabel } from "../../lib/monitoring";

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
  const { banks, loading, error } = usePublicBankStatuses();
  const healthy = banks.filter((bank) => !bank.isNetworkSwitch && bank.status === "healthy").length;
  const averageTrust = average(banks.map((bank) => bank.trustScore));
  const averageLatency = average(banks.map((bank) => bank.latencyMs));
  const featuredCandidates = banks.filter((bank) => bank.featured);
  const featured = [...(featuredCandidates.length ? featuredCandidates : banks)]
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
    .slice(0, 6);
  const show = (value: number | string | null) => (loading || value === null ? "--" : value);

  return <>
    <section className="hero">
      <h1>Is the bank <em>up?</em></h1>
      <p>Live availability, latency and trust for every bank in the network. Check before money moves.</p>
      <div className="hero-actions">
        <Link to="/monitoring" className="btn">Browse banks</Link>
        <Link to="/login" className="btn btn-ghost">Business sign in</Link>
      </div>
    </section>

    <section className="stats-band" aria-label="Network summary">
      <div className="stats">
        <div className="stats-accent"><strong>{show(healthy)}</strong><span>Healthy now</span></div>
        <div><strong>{show(banks.length)}</strong><span>Banks tracked</span></div>
        <div><strong>{show(averageTrust)}</strong><span>Average trust</span></div>
        <div><strong>{show(averageLatency)}{!loading && averageLatency !== null && <small>ms</small>}</strong><span>Average latency</span></div>
      </div>
    </section>

    <section className="section">
      <div className="section-head"><h2>Popular banks</h2><Link to="/monitoring" className="link-strong">All banks</Link></div>
      {error && <div className="notice notice-danger">{error}</div>}
      {loading ? <div className="empty">Loading banks...</div> : <div className="bank-grid">{featured.map((bank) => <Link key={bank.id} to={`/monitoring/banks/${bank.id}`} className="bank-card">
        <div className="bank-card-top"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><span className="status-text"><span className={`dot dot-${bank.status}`} />{statusLabel(bank.status)}</span></div>
        <h3>{shortBankName(bank.name)}</h3>
        <div className="bank-card-figure">
          <strong>{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</strong>
          <span>{bank.isNetworkSwitch ? "signal" : "uptime"}</span>
        </div>
      </Link>)}</div>}
    </section>
  </>;
}
