import type { BankStatus, BankStatusEvent } from "./types";

export function asBankArray(payload: Record<string, BankStatus> | BankStatus[]): BankStatus[] {
  const values = Array.isArray(payload) ? payload : Object.values(payload || {});
  return values.filter(Boolean).sort((a, b) => {
    if (a.isNetworkSwitch !== b.isNetworkSwitch) return a.isNetworkSwitch ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function statusRank(status: string) {
  return { down: 0, degraded: 1, unknown: 2, healthy: 3 }[status] ?? 4;
}

export function statusLabel(status: string) {
  return status === "down" ? "Down" : status === "degraded" ? "Degraded" : status === "healthy" ? "Healthy" : "Unknown";
}

export function formatDate(value?: string | null) {
  if (!value) return "Never checked";
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export function formatRelative(value?: string | null) {
  if (!value) return "Never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

export function average(values: Array<number | null | undefined>) {
  const usable = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : null;
}

export function eventPresentation(event: BankStatusEvent) {
  const details = event.details;
  const isTransaction = Boolean(details?.transactionStatus || details?.transactionId);
  if (details?.countsAgainstUptime === false || details?.impact === "neutral") {
    if (details.transactionStatus === "PENDING") return { label: "Pending transaction", tone: "bg-[#a76400]" };
    if (details.transactionStatus === "REVERSED") return { label: "Reversed transaction", tone: "bg-[#8391a2]" };
    return { label: "Non-bank failure", tone: "bg-[#8391a2]" };
  }
  if (details?.success === true || details?.impact === "positive") {
    return { label: isTransaction ? "Successful transaction" : "Successful check", tone: "bg-[#16c784]" };
  }
  return { label: isTransaction ? "Bank or network failure" : "Failed uptime check", tone: "bg-[#e35149]" };
}
