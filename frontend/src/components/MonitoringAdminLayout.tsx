import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { revokeMonitoringAdminSession } from "../lib/api";

export default function MonitoringAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { monitoringAdminSession, monitoringAdminLogout } = useAuth();
  const navigate = useNavigate();
  const admin = monitoringAdminSession?.admin;

  const logout = async () => {
    await revokeMonitoringAdminSession();
    monitoringAdminLogout();
    navigate("/admin/login");
  };

  return (
    <div className="monitoring-shell flex min-h-screen">
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`console-sidebar fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between px-6">
          <Link to="/" aria-label="Safer Signal home" className="wordmark" onClick={() => setSidebarOpen(false)}>Safer Signal<span>.</span></Link>
          <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white lg:hidden"><X size={19} /></button>
        </div>
        <nav className="console-nav flex-1 space-y-1 px-3 py-4">
          <NavLink to="/admin/business-applications" onClick={() => setSidebarOpen(false)}>Pending</NavLink>
          <NavLink to="/admin/approved-businesses" onClick={() => setSidebarOpen(false)}>Approved</NavLink>
        </nav>
        <div className="border-t border-white/10 p-6">
          <p className="truncate text-sm font-bold">{admin?.fullName || "Operator"}</p>
          <p className="mt-1 truncate text-xs text-[#8d8d86]">{admin?.role?.replace("_", " ").toLowerCase() || "operator"}</p>
          <button onClick={logout} className="mt-4 text-sm font-bold text-[#8d8d86] hover:text-white">Sign out</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="console-header"><button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white lg:invisible"><Menu size={18} /></button><span className="pill">{admin?.email || "Operator"}</span></header>
        <main className="flex-1 px-4 pb-12 pt-4 lg:px-10 lg:pt-6"><Outlet /></main>
      </div>
    </div>
  );
}
