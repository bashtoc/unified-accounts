import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { StatusBadge } from "../../components/MonitoringStatus";
import { useAuth } from "../../context/AuthContext";
import { apiRequest, businessHeaders } from "../../lib/api";
import { eventPresentation, formatDate } from "../../lib/monitoring";
import type { BankStatus, BankStatusEvent } from "../../lib/types";

export default function MonitoringBankDetailsPage() {
  const { bankId } = useParams();
  const { businessSession } = useAuth();
  const [bank, setBank] = useState<BankStatus | null>(null);
  const [events, setEvents] = useState<BankStatusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    if (!businessSession || !bankId) return;
    setLoading(true);
    setError("");
    try {
      const headers = businessHeaders(businessSession);
      const [bankData, eventData] = await Promise.all([
        apiRequest<BankStatus>(`/banks/${bankId}`, { headers }),
        apiRequest<BankStatusEvent[]>(`/banks/${bankId}/events?limit=50`, { headers }),
      ]);
      setBank(bankData);
      setEvents(eventData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Bank details could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [businessSession, bankId]);

  const backLink = <Link to="/business/monitoring/banks" className="monitoring-back-link">← All banks</Link>;

  if (loading) return <div className="monitoring-content"><p className="text-sm text-[#6f6f69]">Loading...</p></div>;
  if (error || !bank) return <div className="monitoring-content">{backLink}<div className="monitoring-alert monitoring-alert-danger mt-6">{error || "Bank not found."}</div></div>;

  return (
    <div className="monitoring-content">
      {backLink}
      <div className="monitoring-page-heading mt-6">
        <div><div className="flex items-center gap-3"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><StatusBadge status={bank.status} /></div><h1 className="mt-5">{bank.name}</h1><p>{bank.isNetworkSwitch ? `National payment switch · Negative at ${bank.downThreshold ?? 5} banks down` : `NIP ${bank.nipInstitutionCode || "--"} · Transfer code ${bank.bankCode}`} · Source {bank.statusSource || "system"} · Checked {formatDate(bank.lastCheckedAt)}</p></div>
        <button onClick={() => void load()} className="monitoring-button monitoring-button-secondary">Refresh</button>
      </div>
      <div className="metric-grid">
        <div className="metric metric-dark"><p>Trust score</p><strong>{bank.trustScore}<small>/100</small></strong></div>
        <div className="metric"><p>{bank.isNetworkSwitch ? "Network signal" : "Success rate"}</p><strong>{bank.isNetworkSwitch ? bank.networkSignal || "--" : bank.successRate === null || bank.successRate === undefined ? "--" : `${bank.successRate}%`}</strong></div>
        <div className="metric"><p>{bank.isNetworkSwitch ? "Banks down" : "Latency"}</p><strong>{bank.isNetworkSwitch ? <>{bank.downBankCount ?? 0}<small>/{bank.downThreshold ?? 5}</small></> : bank.latencyMs ? <>{bank.latencyMs}<small>ms</small></> : "--"}</strong></div>
      </div>
      <section className="event-list">
        <div className="event-list-head"><h2>Events</h2><span>{events.length}</span></div>
        {events.length === 0 ? <div className="event-row text-sm font-semibold text-[#6f6f69]">No events yet.</div> : events.map((event) => { const presentation = eventPresentation(event); return <div key={event.id} className="event-row">
          <span className={`monitoring-event-dot ${presentation.tone}`} />
          <div className="event-row-main"><p>{presentation.label}</p><small>{formatDate(event.createdAt)} · {event.source}{event.details?.transactionId ? ` · ${event.details.transactionId}` : ""}{event.details?.downBankCount !== undefined ? ` · ${event.details.downBankCount}/${event.details.downThreshold ?? 5} banks down` : ""}</small></div>
          <div className="event-row-side">{event.trustScore}/100{event.latencyMs ? ` · ${event.latencyMs}ms` : ""}</div>
        </div>; })}
      </section>
    </div>
  );
}
