import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import { asBankArray } from "../lib/monitoring";
import type { BankStatus } from "../lib/types";

export function usePublicBankStatuses(intervalMs = 15000) {
  const [banks, setBanks] = useState<BankStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const refreshKey = Date.now();
      const catalog = await apiRequest<BankStatus[]>(`/banks?refresh=${refreshKey}`, { cache: "no-store" });
      let statusById = new Map<number, BankStatus>();

      try {
        // Cloudflare may still serve an older cached response until its cache rule is deployed.
        // A per-refresh query keeps public telemetry live during that transition.
        const statusPayload = await apiRequest<Record<string, BankStatus> | BankStatus[]>(`/banks/status?refresh=${refreshKey}`, { cache: "no-store" });
        statusById = new Map(asBankArray(statusPayload).map((bank) => [bank.id, bank]));
      } catch {
        // Keep the catalog visible when telemetry is temporarily unavailable.
      }

      setBanks(catalog.map((bank) => ({ ...bank, ...(statusById.get(bank.id) || {}) })));
      setLastUpdated(new Date());
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Bank health could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh]);

  return { banks, loading, refreshing, error, lastUpdated, refresh };
}
