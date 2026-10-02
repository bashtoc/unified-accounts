import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { BusinessSession, MonitoringAdminSession } from "../lib/types";
import { BUSINESS_SESSION_EXPIRED_EVENT, BUSINESS_SESSION_UPDATED_EVENT, MONITORING_ADMIN_SESSION_EXPIRED_EVENT, MONITORING_ADMIN_SESSION_UPDATED_EVENT } from "../lib/api";

type AuthContextValue = {
  businessSession: BusinessSession | null;
  businessLogin: (session: BusinessSession) => void;
  businessLogout: () => void;
  monitoringAdminSession: MonitoringAdminSession | null;
  monitoringAdminLogin: (session: MonitoringAdminSession) => void;
  monitoringAdminLogout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [businessSession, setBusinessSession] = useState<BusinessSession | null>(() => loadSession("safer-business-session"));
  const [monitoringAdminSession, setMonitoringAdminSession] = useState<MonitoringAdminSession | null>(() => loadSession("safer-monitoring-admin-session"));

  useEffect(() => {
    const handleExpiredSession = () => {
      setBusinessSession(null);
      const currentPath = window.location.pathname;
      const isProtectedRoute = currentPath.startsWith("/business/") || currentPath === "/monitoring/api";
      if (isProtectedRoute && currentPath !== "/login") window.location.replace("/login");
    };
    const handleUpdatedSession = () => setBusinessSession(loadSession("safer-business-session"));
    const handleAdminExpiredSession = () => {
      setMonitoringAdminSession(null);
      if (window.location.pathname.startsWith("/admin/") && window.location.pathname !== "/admin/login") window.location.replace("/admin/login");
    };
    const handleAdminUpdatedSession = () => setMonitoringAdminSession(loadSession("safer-monitoring-admin-session"));
    window.addEventListener(BUSINESS_SESSION_EXPIRED_EVENT, handleExpiredSession);
    window.addEventListener(BUSINESS_SESSION_UPDATED_EVENT, handleUpdatedSession);
    window.addEventListener(MONITORING_ADMIN_SESSION_EXPIRED_EVENT, handleAdminExpiredSession);
    window.addEventListener(MONITORING_ADMIN_SESSION_UPDATED_EVENT, handleAdminUpdatedSession);
    return () => {
      window.removeEventListener(BUSINESS_SESSION_EXPIRED_EVENT, handleExpiredSession);
      window.removeEventListener(BUSINESS_SESSION_UPDATED_EVENT, handleUpdatedSession);
      window.removeEventListener(MONITORING_ADMIN_SESSION_EXPIRED_EVENT, handleAdminExpiredSession);
      window.removeEventListener(MONITORING_ADMIN_SESSION_UPDATED_EVENT, handleAdminUpdatedSession);
    };
  }, []);

  const businessLogin = useCallback((nextSession: BusinessSession) => {
    localStorage.setItem("safer-business-session", JSON.stringify(nextSession));
    setBusinessSession(nextSession);
  }, []);

  const businessLogout = useCallback(() => {
    localStorage.removeItem("safer-business-session");
    setBusinessSession(null);
  }, []);

  const monitoringAdminLogin = useCallback((nextSession: MonitoringAdminSession) => {
    localStorage.setItem("safer-monitoring-admin-session", JSON.stringify(nextSession));
    setMonitoringAdminSession(nextSession);
  }, []);

  const monitoringAdminLogout = useCallback(() => {
    localStorage.removeItem("safer-monitoring-admin-session");
    setMonitoringAdminSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ businessSession, businessLogin, businessLogout, monitoringAdminSession, monitoringAdminLogin, monitoringAdminLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
