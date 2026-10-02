import { useEffect, useState } from "react";
import { Activity, ArrowLeft, Clock3, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import BankMark from "../../components/BankMark";
import { StatusBadge, TrustBar } from "../../components/MonitoringStatus";
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

  const backLink = <Link to="/business/monitoring/banks" className="monitoring-back-link"><ArrowLeft size={15} /> Back to bank network</Link>;

  if (loading) return <div className="monitoring-content"><p className="text-sm text-[#728399]">Loading bank details...</p></div>;
  if (error || !bank) return <div className="monitoring-content">{backLink}<div className="monitoring-alert monitoring-alert-danger mt-6">{error || "Bank not found."}</div></div>;

  return (
    <div className="monitoring-content">
      {backLink}
      <div className="monitoring-page-heading mt-6">
        <div className="flex items-start gap-4"><BankMark name={bank.name} logoUrl={bank.logoUrl} /><div><p className="monitoring-eyebrow"><Activity size={14} /> {bank.isNetworkSwitch ? "Network switch detail" : "Institution detail"}</p><h1>{bank.name}</h1><p>{bank.isNetworkSwitch ? `National payment switch · Signal turns negative when ${bank.downThreshold ?? 5} banks are down` : `NIP code ${bank.nipInstitutionCode || "not published"} · Transfer code ${bank.bankCode}`} · Last checked {formatDate(bank.lastCheckedAt)}</p></div></div>
        <button onClick={() => void load()} className="monitoring-button monitoring-button-secondary"><RefreshCw size={15} /> Refresh</button>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3"><StatusBadge status={bank.status} /><span className="text-sm font-semibold text-[#6f8095]">Source: {bank.statusSource || "system"}</span>{bank.isNetworkSwitch && <span className="text-sm font-semibold text-[#6f8095]">{bank.downBankCount ?? 0} banks currently down</span>}</div>
      <div className="monitoring-detail-grid mt-6">
        <div className="monitoring-detail-metric"><ShieldCheck size={18} className="text-[#0b5cff]" /><p>Trust score</p><strong>{bank.trustScore}<small>/100</small></strong><TrustBar score={bank.trustScore} /></div>
        <div className="monitoring-detail-metric"><Zap size={18} className="text-[#16a572]" /><p>{bank.isNetworkSwitch ? "Network signal" : "Success rate"}</p><strong>{bank.isNetworkSwitch ? bank.networkSignal || "—" : bank.successRate === null || bank.successRate === undefined ? "—" : `${bank.successRate}%`}</strong><span>{bank.isNetworkSwitch ? "Derived from all active banks" : "From recent checks"}</span></div>
        <div className="monitoring-detail-metric"><Clock3 size={18} className="text-[#a76400]" /><p>{bank.isNetworkSwitch ? "Outage threshold" : "Average latency"}</p><strong>{bank.isNetworkSwitch ? <>{bank.downBankCount ?? 0}<small>/{bank.downThreshold ?? 5}</small></> : bank.latencyMs ? <>{bank.latencyMs}<small>ms</small></> : "—"}</strong><span>{bank.isNetworkSwitch ? "Banks currently down" : "Across available samples"}</span></div>
      </div>
      <section className="monitoring-panel mt-6 overflow-hidden">
        <div className="monitoring-panel-heading"><div><h2>{bank.isNetworkSwitch ? "Network switch history" : "Event history"}</h2><p>{bank.isNetworkSwitch ? "Events are recorded whenever the aggregate NIBSS signal crosses the five-bank outage threshold." : "Successful transactions and bank or network failures contribute to the uptime score. Other outcomes are recorded without changing it."}</p></div><span className="text-xs font-bold text-[#8391a2]">{events.length} events</span></div>
        {events.length === 0 ? <div className="p-6 text-sm text-[#728399]">No status transitions have been recorded for this institution yet.</div> : <div className="divide-y divide-[#edf1f5]">{events.map((event) => { const presentation = eventPresentation(event); return <div key={event.id} className="monitoring-event-row"><span className={`monitoring-event-dot ${presentation.tone}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-bold text-[#22344a]">{presentation.label}</p><span className="rounded bg-[#f1f4f7] px-2 py-1 text-[10px] font-bold uppercase tracking-[.06em] text-[#74859a]">{event.source}</span></div><p className="mt-1 text-xs text-[#8391a2]">{formatDate(event.createdAt)}{event.details?.transactionId ? ` · ${event.details.transactionId}` : ""}{event.details?.downBankCount !== undefined ? ` · ${event.details.downBankCount}/${event.details.downThreshold ?? 5} banks down` : ""}</p></div><div className="text-right"><p className="text-xs font-bold text-[#344961]">{event.trustScore}/100</p><p className="mt-1 text-[11px] text-[#8391a2]">{event.latencyMs ? `${event.latencyMs}ms` : "No latency"}</p></div><StatusBadge status={event.status} /></div>; })}</div>}
      </section>
    </div>
  );
}
