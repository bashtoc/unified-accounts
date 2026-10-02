import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { ApiError, monitoringAdminApiRequest } from "../../lib/api";
import type { BusinessApplication } from "../../lib/types";
import { useAuth } from "../../context/AuthContext";

type Summary = { pending: number; active: number; rejected: number; suspended: number; total: number };
type ListResponse = { applications: BusinessApplication[]; total: number; limit: number; offset: number };
type DetailResponse = { application: BusinessApplication; reviewHistory: BusinessApplication["latestReview"][] };
type StatusFilter = "INACTIVE" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "all";
type Action = "approve" | "reject" | "suspend" | "reactivate";
type PageProps = { initialFilter?: StatusFilter; title?: string; description?: string };

const statusStyles: Record<string, string> = { INACTIVE: "bg-[#fff7e7] text-[#99670c]", ACTIVE: "bg-[#edf9f3] text-[#08784f]", REJECTED: "bg-[#fff0ef] text-[#b53f38]", SUSPENDED: "bg-[#f2efff] text-[#6752a8]", DELETED: "bg-[#f1f3f5] text-[#77818b]" };
const statusLabel: Record<string, string> = { INACTIVE: "Pending review", ACTIVE: "Active", REJECTED: "Rejected", SUSPENDED: "Suspended", DELETED: "Deleted" };

function formatDate(value?: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Never"; }

export default function MonitoringAdminBusinessApprovalsPage({ initialFilter = "INACTIVE", title = "Pending", description = "Businesses waiting for access." }: PageProps) {
  const { monitoringAdminSession } = useAuth();
  const admin = monitoringAdminSession?.admin;
  const canManage = admin?.role === "OWNER" || admin?.permissions.includes("merchant_applications.manage");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<StatusFilter>(initialFilter);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<BusinessApplication | null>(null);
  const [history, setHistory] = useState<DetailResponse["reviewHistory"]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const limit = 25;
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ status: filter, search: query, limit: String(limit), offset: String(page * limit) });
      const [nextSummary, nextList] = await Promise.all([
        monitoringAdminApiRequest<Summary>("/admin/business-applications/summary"),
        monitoringAdminApiRequest<ListResponse>(`/admin/business-applications?${params.toString()}`),
      ]);
      setSummary(nextSummary); setApplications(nextList.applications || []); setTotal(nextList.total || 0);
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "The approval queue could not be loaded."); } finally { setLoading(false); setRefreshing(false); }
  }, [filter, page, query]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPage(0); }, [filter, query]);

  const openDetail = async (application: BusinessApplication) => {
    setSelected(application); setDetailLoading(true); setError("");
    try { const result = await monitoringAdminApiRequest<DetailResponse>(`/admin/business-applications/${application.id}`); setSelected(result.application); setHistory(result.reviewHistory || []); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "The application could not be opened."); } finally { setDetailLoading(false); }
  };

  const submitAction = async () => {
    if (!selected || !action || !canManage) return;
    if ((action === "reject" || action === "suspend") && reason.trim().length < 10) { setError("Add a reason of at least 10 characters for this decision."); return; }
    setDetailLoading(true); setError("");
    try {
      await monitoringAdminApiRequest(`/admin/business-applications/${selected.id}/${action}`, { method: "POST", body: JSON.stringify({ reason: reason.trim() || undefined }) });
      setAction(null); setReason(""); await load(true); const refreshed = await monitoringAdminApiRequest<DetailResponse>(`/admin/business-applications/${selected.id}`); setSelected(refreshed.application); setHistory(refreshed.reviewHistory || []);
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "The decision could not be saved."); } finally { setDetailLoading(false); }
  };

  const stats = useMemo(() => [{ label: "Pending review", value: summary?.pending ?? "-", tone: "text-[#99670c]" }, { label: "Active merchants", value: summary?.active ?? "-", tone: "text-[#08784f]" }, { label: "Rejected", value: summary?.rejected ?? "-", tone: "text-[#b53f38]" }, { label: "Suspended", value: summary?.suspended ?? "-", tone: "text-[#6752a8]" }], [summary]);

  return <div className="monitoring-content">
    <div className="monitoring-page-heading"><div><h1>{title}</h1><p>{description}</p></div><button onClick={() => void load(true)} disabled={refreshing} className="monitoring-button monitoring-button-secondary">{refreshing ? "Refreshing..." : "Refresh"}</button></div>
    {error && <div className="monitoring-alert monitoring-alert-danger">{error}</div>}
    <div className="monitoring-stat-grid">{stats.map((stat) => <div key={stat.label} className="monitoring-stat"><div><p className="monitoring-label">{stat.label}</p><p className={`monitoring-stat-value ${stat.tone}`}>{stat.value}</p></div></div>)}</div>
    <section className="monitoring-panel mt-7 overflow-hidden"><div className="flex flex-col gap-4 border-b border-[#e4e4de] p-5 lg:flex-row lg:items-center lg:justify-between"><div><h2>Merchant applications <span className="ml-1 text-sm font-semibold text-[#8290a2]">{total}</span></h2></div><div className="flex flex-col gap-3 sm:flex-row"><label className="monitoring-search"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, email, website" /></label><select value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)} className="monitoring-select"><option value="INACTIVE">Pending review</option><option value="ACTIVE">Active</option><option value="REJECTED">Rejected</option><option value="SUSPENDED">Suspended</option><option value="all">All statuses</option></select></div></div>
      {loading ? <div className="p-8 text-sm text-[#728399]">Loading applications...</div> : applications.length === 0 ? <div className="p-10 text-center text-sm text-[#728399]">No business applications match this queue.</div> : <div className="divide-y divide-[#e4e4de]">{applications.map((application) => <button key={application.id} onClick={() => void openDetail(application)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-[#fafaf6]"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#0a0a0a] text-sm font-extrabold text-[#d2ff3c]">{application.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#15263c]">{application.name}</p><p className="mt-1 truncate text-xs text-[#8290a2]">{application.user.email || application.user.phoneNumber || "No contact email"} {application.websiteUrl ? `· ${application.websiteUrl}` : ""}</p></div><span className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline-flex ${statusStyles[application.status]}`}>{statusLabel[application.status]}</span></button>)}</div>}
      {!loading && total > 0 && <div className="flex items-center justify-between border-t border-[#e4e4de] px-5 py-4"><p className="text-xs font-semibold text-[#8290a2]">Page {page + 1} of {pageCount}</p><div className="flex gap-2"><button disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))} className="monitoring-button monitoring-button-secondary">Previous</button><button disabled={page + 1 >= pageCount} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} className="monitoring-button monitoring-button-secondary">Next</button></div></div>}
    </section>
    {selected && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"><div className="flex items-start justify-between border-b border-[#e4e4de] p-5"><div><h2 className="text-2xl font-extrabold text-[#15263c]">{selected.name}</h2><p className="mt-1 text-xs text-[#8290a2]">Submitted {formatDate(selected.createdAt)}</p></div><button aria-label="Close application" onClick={() => { setSelected(null); setAction(null); setError(""); }} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dbe3eb] text-[#617188] hover:bg-[#f7f9fb]"><X size={17} /></button></div>
      {detailLoading && !history.length ? <div className="p-8 text-sm text-[#728399]">Loading application details...</div> : <div className="space-y-5 p-5"><div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[selected.status]}`}>{statusLabel[selected.status]}</span><span className="text-xs text-[#8290a2]">Updated {formatDate(selected.updatedAt)}</span></div><div className="grid gap-4 sm:grid-cols-2"><Info label="Contact name" value={selected.user.fullName} /><Info label="Email" value={selected.user.email || "Not provided"} /><Info label="Phone" value={selected.user.phoneNumber || "Not provided"} /><Info label="Website" value={selected.websiteUrl || "Not provided"} link={Boolean(selected.websiteUrl)} /></div><div className="rounded-xl border border-[#e4eaf0] bg-[#f8fafc] p-4"><p className="text-xs font-extrabold uppercase tracking-[.08em] text-[#7f8ea0]">Credential access</p>{selected.apiKeys.map((key) => <div key={key.id} className="mt-3 flex flex-wrap items-center justify-between gap-2"><div><p className="font-mono text-sm font-bold text-[#273b54]">{key.keyPrefix}••••••</p><p className="mt-1 text-xs text-[#8290a2]">Scopes: {key.scopes.join(" · ") || "none"}</p></div><span className="text-xs font-bold text-[#08784f]">{key.revokedAt ? "Revoked" : "Server-side key"}</span></div>)}</div><div><h3 className="text-sm font-extrabold">Review history</h3>{history.length === 0 ? <p className="mt-3 text-sm text-[#8290a2]">No decisions recorded yet.</p> : <div className="mt-3 space-y-3">{history.map((review) => review && <div key={review.id} className="rounded-lg border border-[#e4eaf0] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-extrabold text-[#273b54]">{review.decision} · {review.newStatus}</p><p className="text-[11px] text-[#8290a2]">{formatDate(review.createdAt)}</p></div><p className="mt-1 text-xs text-[#728399]">Reviewed by {review.reviewerEmail || review.reviewerId}</p>{review.reason && <p className="mt-2 text-xs leading-5 text-[#52657c]">{review.reason}</p>}</div>)}</div>}</div>{canManage && <div className="border-t border-[#e4e4de] pt-5"><p className="text-xs font-bold text-[#8290a2]">Decision</p>{action ? <div className="mt-3 space-y-3"><p className="text-sm font-bold text-[#273b54]">Confirm {action}?</p>{(action === "reject" || action === "suspend") && <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} placeholder="Reason required, at least 10 characters" className="w-full rounded-lg border border-[#d8e1ed] p-3 text-sm outline-none focus:border-[#6d9cff]" />}{error && <p className="text-sm text-[#b33f37]">{error}</p>}<div className="flex gap-2"><button onClick={() => void submitAction()} disabled={detailLoading} className="monitoring-button">Confirm</button><button onClick={() => { setAction(null); setReason(""); }} className="monitoring-button monitoring-button-secondary">Cancel</button></div></div> : <div className="mt-3 flex flex-wrap gap-2">{selected.status === "INACTIVE" && <button onClick={() => setAction("approve")} className="monitoring-button">Approve</button>}{selected.status === "INACTIVE" && <button onClick={() => setAction("reject")} className="monitoring-button monitoring-button-secondary">Reject</button>}{selected.status === "ACTIVE" && <button onClick={() => setAction("suspend")} className="monitoring-button monitoring-button-secondary">Suspend</button>}{(selected.status === "SUSPENDED" || selected.status === "REJECTED") && <button onClick={() => setAction("reactivate")} className="monitoring-button">Reactivate</button>}</div>}</div>}</div>}
    </section></div>}
  </div>;
}

function Info({ label, value, link = false }: { label: string; value: string; link?: boolean }) { return <div><p className="text-[11px] font-extrabold uppercase tracking-[.07em] text-[#8a98a9]">{label}</p>{link && value !== "Not provided" ? <a href={value} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-sm font-bold text-[#0a0a0a] hover:underline">{value}</a> : <p className="mt-1 truncate text-sm font-bold text-[#273b54]">{value}</p>}</div>; }
