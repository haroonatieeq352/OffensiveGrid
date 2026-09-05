import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import { StudentLayout } from './layouts/StudentLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthLayout } from './layouts/AuthLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { AdminInviteRegister } from './pages/public/AdminInviteRegister';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ScenarioCatalogPage } from './pages/student/ScenarioCatalogPage';
import { ScenarioDetailPage } from './pages/student/ScenarioDetailPage';
import { LeaderboardPage } from './pages/student/LeaderboardPage';
import { ProfilePage } from './pages/student/ProfilePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ScenarioManagerPage } from './pages/admin/ScenarioManagerPage';
import { StudentManagerPage } from './pages/admin/StudentManagerPage';
import { AdminPaymentRequestsPage } from './pages/admin/AdminPaymentRequestsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { TaxonomyManagerPage } from './pages/admin/TaxonomyManagerPage';

// Protected Route Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Landing */}
      <Route path="/" element={<LandingPage />} />

      {/* Authentication Pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin/invite" element={<AdminInviteRegister />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Trainee / Student Portal */}
      <Route
        element={
          <ProtectedRoute>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<StudentDashboard />} />
        <Route path="/scenarios" element={<ScenarioCatalogPage />} />
        <Route path="/scenarios/:slug" element={<ScenarioDetailPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="scenarios" element={<ScenarioManagerPage />} />
        <Route path="taxonomy" element={<TaxonomyManagerPage />} />
        <Route path="students" element={<StudentManagerPage />} />
        <Route path="payments" element={<AdminPaymentRequestsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
