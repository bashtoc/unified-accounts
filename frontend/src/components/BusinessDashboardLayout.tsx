import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, KeyRound, Activity, LogOut, Menu, X, ChevronRight, AlertTriangle, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/business/monitoring", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/business/monitoring/banks", icon: Activity, label: "Bank network", end: false },
  { to: "/business/monitoring/api", icon: KeyRound, label: "Monitoring API", end: false },
];

export default function BusinessDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { businessSession, businessLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { businessLogout(); navigate("/login"); };

  return (
    <div className="monitoring-shell flex min-h-screen bg-[#f3f6f9]">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-center text-lg font-bold text-gray-900">Are you sure you want to logout?</h3>
            <p className="mt-2 text-center text-sm text-gray-500">You will need to sign in again to access the business portal.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleLogout} className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Yes, logout</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-black transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between px-6 border-b border-white/[.06]">
          <div className="flex items-center gap-2.5">
            <img src="/safericon.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
            <div><span className="block text-[16px] font-bold text-white">Safer Signal<span className="text-[#4d8aff]">.</span></span><span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.16em] text-[#71859d]">Network monitor</span></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white lg:hidden"><X size={20} /></button>
        </div>

        <div className="px-5 py-5 border-b border-white/[.06]">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1a2c52] text-sm font-bold text-[#a78bfa]">B</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{businessSession?.name || "Business"}</p><p className="mt-0.5 truncate text-[11px] text-[#71859d]">{businessSession?.email || "Operations workspace"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all group ${isActive ? "bg-[#4d8aff]/15 text-[#4d8aff]" : "text-[#7a8da6] hover:bg-white/[.04] hover:text-[#b0c3de]"}`}>
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[.06] p-4">
          <button onClick={() => setShowLogoutConfirm(true)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#7a8da6] transition hover:bg-white/[.04] hover:text-[#ef6b6b]">
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-4 border-b border-[#e8edf5] bg-white/90 px-4 backdrop-blur-xl lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-[#dbe3ef] text-[#506078] lg:hidden"><Menu size={18} /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2"><Radio size={15} className="text-[#16c784]" /><p className="text-sm font-semibold text-[#0e1c31]">Bank network operations</p></div>
          </div>
          {businessSession?.status === "INACTIVE" ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f0d59b] bg-[#fff8e8] px-3 py-1 text-xs font-bold text-[#916a18]"><span className="h-1.5 w-1.5 rounded-full bg-[#d99a26]" /> Account inactive</span> : <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b9ead7] bg-[#ecfbf5] px-3 py-1 text-xs font-bold text-[#087c54]"><span className="h-1.5 w-1.5 rounded-full bg-[#16c784]" /> Live telemetry</span>}
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
