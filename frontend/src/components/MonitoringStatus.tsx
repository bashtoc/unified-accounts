import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";
import { statusLabel } from "../lib/monitoring";

const styles: Record<string, string> = {
  healthy: "bg-[#e8fbf3] text-[#087c54] border-[#b9ead7]",
  degraded: "bg-[#fff7e8] text-[#a76400] border-[#f4d69d]",
  down: "bg-[#fff0ef] text-[#ba3a34] border-[#f0c0bd]",
  unknown: "bg-[#eef2f6] text-[#68798d] border-[#d7e0e9]",
};

export function StatusBadge({ status }: { status: string }) {
  const Icon = status === "healthy" ? CheckCircle2 : status === "down" ? XCircle : status === "degraded" ? AlertTriangle : CircleHelp;
  return <span className={`monitoring-status-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[status] || styles.unknown}`}><Icon size={13} />{statusLabel(status)}</span>;
}

export function TrustBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-[#16c784]" : score >= 50 ? "bg-[#f0ae36]" : "bg-[#e35149]";
  return <div className="flex items-center gap-2"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e8edf2]"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div><span className="text-xs font-extrabold text-[#1d2e44]">{score}</span></div>;
}
