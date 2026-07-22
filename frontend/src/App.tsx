import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth-context';
import { LandingPage } from './pages/landing/LandingPage';
import { DevComponents } from './pages/DevComponents';
import { AuthPage } from './pages/auth/AuthPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { RequireAuth } from './routing/RequireAuth';
import { UploadPage } from './pages/upload/UploadPage';
import { DashboardShell } from './pages/dashboard/DashboardShell';
import { OverviewTab } from './pages/dashboard/tabs/OverviewTab';
import { ProfitAnalyticsTab } from './pages/dashboard/tabs/ProfitAnalyticsTab';
import { ReturnRiskTab } from './pages/dashboard/tabs/ReturnRiskTab';
import { RecommendationsTab } from './pages/dashboard/tabs/RecommendationsTab';
import { PlaceholderTab } from './pages/dashboard/PlaceholderTab';
import { DashboardProvider } from './lib/dashboard-context';
import { ToastContainer } from './components/ui/Toast';

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <BrowserRouter>
          <Routes>
            {/* Public marketing page */}
          <Route path="/" element={<LandingPage />} />

          {/* Module 1 style guide — keep accessible during development */}
          <Route path="/dev/components" element={<DevComponents />} />

          {/* Auth routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Protected routes */}
          <Route path="/upload" element={<RequireAuth><UploadPage /></RequireAuth>} />
          
          <Route path="/dashboard" element={<RequireAuth><DashboardShell /></RequireAuth>}>
            <Route path="overview" element={<OverviewTab />} />
            <Route path="profit" element={<ProfitAnalyticsTab />} />
            <Route path="returns" element={<ReturnRiskTab />} />
            <Route path="products" element={<PlaceholderTab title="Products" description="Analyze performance at the individual SKU level." />} />
            <Route path="geography" element={<PlaceholderTab title="Geography" description="Visualize your sales and profitability across regions." />} />
            <Route path="recommendations" element={<RecommendationsTab />} />
            <Route path="health" element={<PlaceholderTab title="Data Health" description="Monitor the quality and mapping of your uploaded data." />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </DashboardProvider>
    </AuthProvider>
  );
}

export default App;
