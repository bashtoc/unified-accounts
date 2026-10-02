import { Link, NavLink, Outlet } from "react-router-dom";

export default function PublicMonitoringLayout() {
  return (
    <div className="site">
      <header>
        <div className="site-header-inner">
          <Link to="/" className="wordmark" aria-label="Safer Signal home">Safer Signal<span>.</span></Link>
          <nav className="site-nav" aria-label="Main">
            <NavLink to="/monitoring">Banks</NavLink>
            <Link to="/login" className="btn btn-sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <span className="wordmark">Safer Signal<span>.</span></span>
          <span>Live bank network status</span>
        </div>
      </footer>
    </div>
  );
}
