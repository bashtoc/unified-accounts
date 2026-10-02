import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { StatusBadge } from "../../components/MonitoringStatus";
import { apiRequest } from "../../lib/api";
import { eventPresentation, formatDate } from "../../lib/monitoring";
import type { BankStatus, BankStatusEvent } from "../../lib/types";

export default function PublicBankDetailsPage() {
  const { bankId } = useParams();
  const [bank, setBank] = useState<BankStatus | null>(null);
  const [events, setEvents] = useState<BankStatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!bankId) return;
    setRefreshing(true);
    setError("");
    try {
      const [bankData, eventData] = await Promise.all([apiRequest<BankStatus>(`/banks/${bankId}`), apiRequest<BankStatusEvent[]>(`/banks/${bankId}/events?limit=50`)]);
      setBank(bankData);
      setEvents(eventData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The bank report could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [bankId]);

  const backLink = <Link to="/monitoring" className="back-link">← All banks</Link>;

  if (loading) return <div className="site-wrap pb-24"><div className="empty">Loading...</div></div>;
  if (error || !bank) return <div className="site-wrap pb-24">{backLink}<div className="notice notice-danger">{error || "Bank not found."}</div></div>;

  return <div className="site-wrap pb-24">
    {backLink}
    <div className="detail-head">
      <div>
        <div className="flex items-center gap-3"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><StatusBadge status={bank.status} /></div>
        <h1>{bank.name}</h1>
        <p>{bank.isNetworkSwitch ? `National payment switch · Negative at ${bank.downThreshold ?? 5} banks down` : `NIP ${bank.nipInstitutionCode || "--"} · Transfer code ${bank.bankCode}`} · Checked {formatDate(bank.lastCheckedAt)}</p>
      </div>
      <button onClick={() => void load()} disabled={refreshing} className="btn btn-sm btn-ghost">{refreshing ? "Refreshing..." : "Refresh"}</button>
    </div>

    <div className="metric-grid">
      <div className="metric metric-dark"><p>Trust score</p><strong>{bank.trustScore}<small>/100</small></strong></div>
      <div className="metric"><p>{bank.isNetworkSwitch ? "Network signal" : "Uptime"}</p><strong>{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</strong></div>
      <div className="metric"><p>{bank.isNetworkSwitch ? "Banks down" : "Latency"}</p><strong>{bank.isNetworkSwitch ? <>{bank.downBankCount ?? 0}<small>/{bank.downThreshold ?? 5}</small></> : bank.latencyMs ? <>{bank.latencyMs}<small>ms</small></> : "--"}</strong></div>
    </div>

    <section className="event-list">
      <div className="event-list-head"><h2>Recent events</h2><span>{events.length}</span></div>
      {events.length === 0 ? <div className="event-row text-sm font-semibold text-[#6f6f69]">No events yet.</div> : events.map((event) => { const presentation = eventPresentation(event); return <div key={event.id} className="event-row">
        <span className={`monitoring-event-dot ${presentation.tone}`} />
        <div className="event-row-main"><p>{presentation.label}</p><small>{formatDate(event.createdAt)} · {event.source}{event.details?.transactionId ? ` · ${event.details.transactionId}` : ""}{event.details?.downBankCount !== undefined ? ` · ${event.details.downBankCount}/${event.details.downThreshold ?? 5} banks down` : ""}</small></div>
        <div className="event-row-side">{event.trustScore}/100{event.latencyMs ? ` · ${event.latencyMs}ms` : ""}</div>
      </div>; })}
    </section>
  </div>;
}
