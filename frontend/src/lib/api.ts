import { API_URL } from "./constants";
import type { BusinessSession, MonitoringAdminSession } from "./types";

const BUSINESS_SESSION_KEY = "safer-business-session";
const MONITORING_ADMIN_SESSION_KEY = "safer-monitoring-admin-session";
export const BUSINESS_SESSION_EXPIRED_EVENT = "safer-business-session-expired";
export const BUSINESS_SESSION_UPDATED_EVENT = "safer-business-session-updated";
export const MONITORING_ADMIN_SESSION_EXPIRED_EVENT = "safer-monitoring-admin-session-expired";
export const MONITORING_ADMIN_SESSION_UPDATED_EVENT = "safer-monitoring-admin-session-updated";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

let refreshPromise: Promise<BusinessSession | null> | null = null;
let adminRefreshPromise: Promise<MonitoringAdminSession | null> | null = null;

function readStoredBusinessSession(): BusinessSession | null {
  try {
    const stored = localStorage.getItem(BUSINESS_SESSION_KEY);
    return stored ? JSON.parse(stored) as BusinessSession : null;
  } catch {
    return null;
  }
}

function expireStoredBusinessSession() {
  localStorage.removeItem(BUSINESS_SESSION_KEY);
  window.dispatchEvent(new Event(BUSINESS_SESSION_EXPIRED_EVENT));
}

function readStoredMonitoringAdminSession(): MonitoringAdminSession | null {
  try {
    const stored = localStorage.getItem(MONITORING_ADMIN_SESSION_KEY);
    return stored ? JSON.parse(stored) as MonitoringAdminSession : null;
  } catch {
    return null;
  }
}

function expireStoredMonitoringAdminSession() {
  localStorage.removeItem(MONITORING_ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(MONITORING_ADMIN_SESSION_EXPIRED_EVENT));
}

async function parsePayload(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

function getErrorMessage(payload: any, fallback: string) {
  return payload?.error?.message || payload?.error || fallback;
}

async function refreshStoredBusinessSession(): Promise<BusinessSession | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = readStoredBusinessSession();
    if (!current?.refreshToken) {
      expireStoredBusinessSession();
      return null;
    }

    let response: Response;
    try {
      response = await fetch(`${API_URL}/business/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
    } catch {
      throw new ApiError("The business session could not be refreshed. Check your connection and try again.", 0, {});
    }

    const payload = await parsePayload(response);
    if (response.status === 401 || response.status === 403) {
      expireStoredBusinessSession();
      return null;
    }
    if (!response.ok) {
      throw new ApiError(getErrorMessage(payload, "The business session could not be refreshed."), response.status, payload);
    }

    const data = (payload?.data ?? payload) as Partial<BusinessSession> & { accessToken?: string; secretKey?: string };
    const nextSession: BusinessSession = {
      ...current,
      ...data,
      secretKey: data.secretKey || data.accessToken || current.secretKey,
      refreshToken: data.refreshToken || current.refreshToken,
    };
    localStorage.setItem(BUSINESS_SESSION_KEY, JSON.stringify(nextSession));
    window.dispatchEvent(new Event(BUSINESS_SESSION_UPDATED_EVENT));
    return nextSession;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  let response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let payload = await parsePayload(response);

  const isBusinessSessionRequest = headers.has("Authorization") && headers.has("ClientID");
  if (response.status === 401 && isBusinessSessionRequest) {
    const refreshed = await refreshStoredBusinessSession();
    if (!refreshed) {
      throw new ApiError("Your business session has expired. Please sign in again.", 401, payload);
    }

    headers.set("ClientID", refreshed.clientId);
    headers.set("Authorization", `Bearer ${refreshed.secretKey}`);
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
    payload = await parsePayload(response);
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(payload, "The request could not be completed."), response.status, payload);
  }
  return (payload?.data ?? payload) as T;
}

async function refreshStoredMonitoringAdminSession(): Promise<MonitoringAdminSession | null> {
  if (adminRefreshPromise) return adminRefreshPromise;
  adminRefreshPromise = (async () => {
    const current = readStoredMonitoringAdminSession();
    if (!current?.refreshToken) {
      expireStoredMonitoringAdminSession();
      return null;
    }
    let response: Response;
    try {
      response = await fetch(`${API_URL}/admin/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
    } catch {
      throw new ApiError("The administrator session could not be refreshed. Check your connection and try again.", 0, {});
    }
    const payload = await parsePayload(response);
    if (response.status === 401 || response.status === 403) {
      expireStoredMonitoringAdminSession();
      return null;
    }
    if (!response.ok) throw new ApiError(getErrorMessage(payload, "The administrator session could not be refreshed."), response.status, payload);
    const next = (payload?.data ?? payload) as MonitoringAdminSession;
    localStorage.setItem(MONITORING_ADMIN_SESSION_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(MONITORING_ADMIN_SESSION_UPDATED_EVENT));
    return next;
  })().finally(() => { adminRefreshPromise = null; });
  return adminRefreshPromise;
}

export async function monitoringAdminApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const current = readStoredMonitoringAdminSession();
  if (!current?.accessToken) throw new ApiError("Your administrator session has expired. Please sign in again.", 401, {});
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${current.accessToken}`);
  let response = await fetch(`${API_URL}${path}`, { ...options, headers });
  let payload = await parsePayload(response);
  if (response.status === 401) {
    const refreshed = await refreshStoredMonitoringAdminSession();
    if (!refreshed) throw new ApiError("Your administrator session has expired. Please sign in again.", 401, payload);
    headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
    payload = await parsePayload(response);
  }
  if (!response.ok) throw new ApiError(getErrorMessage(payload, "The administrator request could not be completed."), response.status, payload);
  return (payload?.data ?? payload) as T;
}

export async function revokeMonitoringAdminSession(): Promise<void> {
  const current = readStoredMonitoringAdminSession();
  if (current?.refreshToken) {
    try {
      await fetch(`${API_URL}/admin/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });
    } catch {
      // Clear the browser session even when the server is temporarily unavailable.
    }
  }
  expireStoredMonitoringAdminSession();
}

export function businessHeaders(session: { clientId: string; secretKey: string }): HeadersInit {
  return { ClientID: session.clientId, Authorization: `Bearer ${session.secretKey}` };
}
