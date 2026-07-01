import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Partners from './pages/Partners';
import Bookings from './pages/Bookings';
import Financials from './pages/Financials';
import Payouts from './pages/Payouts';
import Customers from './pages/Customers';
import Services from './pages/Services';
import Coupons from './pages/Coupons';
import Feedbacks from './pages/Feedbacks';
import PartnerTracking from './pages/PartnerTracking';
import LogisticsAnalytics from './pages/LogisticsAnalytics';
import AuditLogs from './pages/AuditLogs';
import DisasterRecovery from './pages/DisasterRecovery';
import PerformanceAudit from './pages/PerformanceAudit';
import DataRetention from './pages/DataRetention';
import RateLimiting from './pages/RateLimiting';
import SecurityAudit from './pages/SecurityAudit';
import WebhookSettings from './pages/WebhookSettings';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Login Route */}
                <Route path="/login" element={<Login />} />

                {/* Protected Administrative Dashboard Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Nested Dashboard Sub-pages */}
                  <Route index element={<Dashboard />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="partners" element={<Partners />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="financials" element={<Financials />} />
                  <Route path="payouts" element={<Payouts />} />
                  <Route path="services" element={<Services />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="feedbacks" element={<Feedbacks />} />
                  <Route path="tracking" element={<PartnerTracking />} />
                  <Route path="logistics" element={<LogisticsAnalytics />} />
                  <Route path="audit-logs" element={<AuditLogs />} />
                  <Route path="disaster-recovery" element={<DisasterRecovery />} />
                  <Route path="performance" element={<PerformanceAudit />} />
                  <Route path="retention" element={<DataRetention />} />
                  <Route path="rate-limiting" element={<RateLimiting />} />
                  <Route path="security-audit" element={<SecurityAudit />} />
                  <Route path="webhooks" element={<WebhookSettings />} />
                </Route>

                {/* Fallback Catch-All Redirect */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
