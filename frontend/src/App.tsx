import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import BusinessDashboardLayout from "./components/BusinessDashboardLayout";
import PublicMonitoringLayout from "./components/PublicMonitoringLayout";
import BusinessAuthPage from "./pages/business/BusinessAuthPage";
import PublicLandingPage from "./pages/public/PublicLandingPage";
import PublicBankDirectoryPage from "./pages/public/PublicBankDirectoryPage";
import PublicBankDetailsPage from "./pages/public/PublicBankDetailsPage";
import MonitoringOverviewPage from "./pages/monitoring/MonitoringOverviewPage";
import MonitoringBanksPage from "./pages/monitoring/MonitoringBanksPage";
import MonitoringBankDetailsPage from "./pages/monitoring/MonitoringBankDetailsPage";
import MonitoringApiPage from "./pages/monitoring/MonitoringApiPage";
import MonitoringAdminLayout from "./components/MonitoringAdminLayout";
import MonitoringAdminAuthPage from "./pages/admin/MonitoringAdminAuthPage";
import MonitoringAdminBusinessApprovalsPage from "./pages/admin/MonitoringAdminBusinessApprovalsPage";

function RequireBusinessAuth() {
  const { businessSession } = useAuth();
  if (!businessSession) return <Navigate to="/login" replace />;
  return <BusinessDashboardLayout />;
}

function RequireMonitoringAdminAuth() {
  const { monitoringAdminSession } = useAuth();
  if (!monitoringAdminSession) return <Navigate to="/admin/login" replace />;
  return <MonitoringAdminLayout />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicMonitoringLayout />}>
            <Route path="/" element={<PublicLandingPage />} />
            <Route path="/monitoring" element={<PublicBankDirectoryPage />} />
            <Route path="/monitoring/banks" element={<PublicBankDirectoryPage />} />
            <Route path="/monitoring/banks/:bankId" element={<PublicBankDetailsPage />} />
          </Route>
          <Route path="/login" element={<BusinessAuthPage />} />
          <Route path="/register" element={<BusinessAuthPage />} />
          <Route path="/admin/login" element={<MonitoringAdminAuthPage />} />

          <Route path="/admin" element={<RequireMonitoringAdminAuth />}>
            <Route index element={<Navigate to="business-applications" replace />} />
            <Route path="business-applications" element={<MonitoringAdminBusinessApprovalsPage />} />
            <Route path="approved-businesses" element={<MonitoringAdminBusinessApprovalsPage initialFilter="ACTIVE" title="Approved" description="Businesses with active access." />} />
          </Route>

          <Route path="/business/monitoring" element={<RequireBusinessAuth />}>
            <Route index element={<MonitoringOverviewPage />} />
            <Route path="banks" element={<MonitoringBanksPage />} />
            <Route path="banks/:bankId" element={<MonitoringBankDetailsPage />} />
            <Route path="api" element={<MonitoringApiPage />} />
          </Route>

          <Route path="/monitoring/api" element={<RequireBusinessAuth />}><Route index element={<MonitoringApiPage />} /></Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
