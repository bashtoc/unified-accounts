import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/business/monitoring", label: "Overview", end: true },
  { to: "/business/monitoring/banks", label: "Banks", end: false },
  { to: "/business/monitoring/api", label: "API", end: false },
];

export default function BusinessDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { businessSession, businessLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { businessLogout(); navigate("/login"); };

  return (
    <div className="monitoring-shell flex min-h-screen">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-[18px] bg-white p-7">
            <h3 className="text-2xl font-black tracking-[-.04em]">Log out?</h3>
            <p className="mt-2 text-sm text-[#6f6f69]">You'll need to sign in again.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="monitoring-button monitoring-button-secondary flex-1">Cancel</button>
              <button onClick={handleLogout} className="monitoring-button flex-1 !ml-0">Log out</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`console-sidebar fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[72px] items-center justify-between px-6">
          <Link to="/" className="wordmark">Safer Signal<span>.</span></Link>
          <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="text-white/50 hover:text-white lg:hidden"><X size={20} /></button>
        </div>

        <nav className="console-nav flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}>{item.label}</NavLink>)}
        </nav>

        <div className="border-t border-white/10 p-6">
          <p className="truncate text-sm font-bold">{businessSession?.name || "Business"}</p>
          {businessSession?.email && <p className="mt-1 truncate text-xs text-[#8d8d86]">{businessSession.email}</p>}
          <button onClick={() => setShowLogoutConfirm(true)} className="mt-4 text-sm font-bold text-[#8d8d86] hover:text-white">Log out</button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="console-header">
          <button aria-label="Open navigation" onClick={() => setSidebarOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white lg:invisible"><Menu size={18} /></button>
          {businessSession?.status === "INACTIVE" ? <span className="pill"><span className="dot dot-degraded" /> Account inactive</span> : <span className="pill"><span className="dot dot-healthy" /> Live</span>}
        </header>

        <main className="flex-1 px-4 pb-12 pt-4 lg:px-10 lg:pt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
