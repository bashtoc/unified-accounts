import { useCallback, useEffect, useState } from "react";
import { apiRequest, businessHeaders } from "../lib/api";
import { asBankArray } from "../lib/monitoring";
import type { BankStatus, BusinessSession } from "../lib/types";

export function useBankStatuses(session: BusinessSession | null, intervalMs = 15000) {
  const [banks, setBanks] = useState<BankStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    setRefreshing(true);
    try {
      const payload = await apiRequest<Record<string, BankStatus>>("/business/banks/status", { headers: businessHeaders(session) });
      setBanks(asBankArray(payload));
      setLastUpdated(new Date());
      setError("");
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Bank health could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
    if (!session) return undefined;
    const timer = window.setInterval(() => void refresh(), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, refresh, session]);

  return { banks, loading, refreshing, error, lastUpdated, refresh };
}
