import { Activity, LockKeyhole } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export default function PublicMonitoringLayout() {
  return (
    <div className="public-monitoring-shell min-h-screen">
      <header className="public-monitoring-header">
        <div className="public-monitoring-header-inner">
          <Link to="/" className="flex items-center gap-3" aria-label="Safer Signal home">
            <img src="/safericon.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-lg font-extrabold text-white">Safer Signal<span className="text-[#79adff]">.</span></span>
          </Link>
          <nav className="flex items-center gap-3 sm:gap-6" aria-label="Public monitoring navigation">
            <Link to="/monitoring" className="public-nav-link hidden sm:inline-flex">Browse banks</Link>
            <Link to="/login" className="public-console-link"><LockKeyhole size={14} /> Business console</Link>
          </nav>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="public-monitoring-footer">
        <div className="public-monitoring-footer-inner">
          <div className="flex items-center gap-2.5"><img src="/safericon.png" alt="" className="h-8 w-8 rounded-lg object-cover" /><span className="text-sm font-extrabold text-[#f2f6ef]">Safer Signal<span className="text-[#72bf65]">.</span></span></div>
          <p className="flex items-center gap-2 text-xs font-semibold text-[#91a393]"><Activity size={14} className="text-[#72bf65]" /> Public bank network status</p>
        </div>
      </footer>
    </div>
  );
}
