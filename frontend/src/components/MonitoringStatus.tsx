import { statusLabel } from "../lib/monitoring";

const styles: Record<string, string> = {
  healthy: "bg-[#e3f8ec] text-[#0b6b3a]",
  degraded: "bg-[#fff4d6] text-[#7a4f00]",
  down: "bg-[#ffe4e1] text-[#a1251b]",
  unknown: "bg-[#efefea] text-[#5f5f59]",
};

export function StatusBadge({ status }: { status: string }) {
  return <span className={`monitoring-status-badge inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${styles[status] || styles.unknown}`}><span className={`dot dot-${status}`} />{statusLabel(status)}</span>;
}

export function TrustBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-[#12b76a]" : score >= 50 ? "bg-[#f59e0b]" : "bg-[#ef4444]";
  return <div className="flex items-center gap-3"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#ecece6]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div><span className="text-sm font-extrabold tabular-nums">{score}</span></div>;
}
