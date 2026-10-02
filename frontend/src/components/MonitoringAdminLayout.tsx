import { useState } from "react";
import { Activity, CheckCircle2, ChevronRight, ClipboardCheck, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
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
    <div className="monitoring-shell flex min-h-screen bg-[#f3f6f9]">
      {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col bg-[#071019] transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/[.08] px-6">
          <NavLink to="/" aria-label="Safer Signal home" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img src="/safericon.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
            <div><span className="block text-[16px] font-extrabold text-white">Safer Signal<span className="text-[#72bf65]">.</span></span><span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[.17em] text-[#82978a]">Signal administration</span></div>
          </NavLink>
          <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white lg:hidden"><X size={19} /></button>
        </div>
        <div className="border-b border-white/[.08] px-5 py-5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d3a2b] text-sm font-extrabold text-[#8dda7d]">{admin?.fullName?.slice(0, 1).toUpperCase() || "S"}</span><div className="min-w-0"><p className="truncate text-sm font-bold text-white">{admin?.fullName || "Signal operator"}</p><p className="mt-1 truncate text-[11px] text-[#82978a]">{admin?.email || "Operator account"}</p></div></div>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#4d804b] bg-[#17301f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#91d88a]"><ShieldCheck size={12} /> {admin?.role?.replace("_", " ") || "Operator"}</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          <NavLink to="/admin/business-applications" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold ${isActive ? "bg-[#17301f] text-[#8dda7d]" : "text-[#8ba08e] hover:bg-white/[.05] hover:text-white"}`}><ClipboardCheck size={18} /><span className="flex-1">Pending approvals</span><ChevronRight size={14} className="opacity-0 transition group-hover:opacity-60" /></NavLink>
          <NavLink to="/admin/approved-businesses" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold ${isActive ? "bg-[#17301f] text-[#8dda7d]" : "text-[#8ba08e] hover:bg-white/[.05] hover:text-white"}`}><CheckCircle2 size={18} /><span className="flex-1">Approved businesses</span><ChevronRight size={14} className="opacity-0 transition group-hover:opacity-60" /></NavLink>
        </nav>
        <div className="border-t border-white/[.08] p-4"><button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold text-[#8ba08e] hover:bg-white/[.05] hover:text-[#ffaaa4]"><LogOut size={18} /> Sign out</button></div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[68px] items-center gap-4 border-b border-[#e2e9f0] bg-white/95 px-4 backdrop-blur lg:px-8"><button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8e1eb] text-[#43556d] lg:hidden"><Menu size={18} /></button><div className="flex flex-1 items-center gap-2"><Activity size={16} className="text-[#16a968]" /><span className="text-sm font-bold text-[#14263d]">Signal operations</span></div><span className="hidden items-center gap-2 text-xs font-bold text-[#74859a] sm:flex"><span className="h-2 w-2 rounded-full bg-[#16c784]" /> Authenticated operator</span></header>
        <main className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
