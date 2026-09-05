import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  LayoutDashboard,
  Flag,
  Users,
  Trophy,
  BarChart3,
  FileText,
  CreditCard,
  Bell,
  ArrowLeft,
  Layers,
  LogOut,
  CheckCircle2,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { paymentService, instructorRequestService } from '../services/api';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, isInstructor, isLoading, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingInstructorCount, setPendingInstructorCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auto-close mobile sidebar on route navigation
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  // Poll for pending payment requests (Super Admin only)
  const fetchPendingStats = async () => {
    if (user?.primary_role !== 'SUPER_ADMIN') return;
    try {
      const stats = await paymentService.getPendingStats();
      if (stats) {
        setPendingCount(stats.pending_count || 0);
        setRecentRequests(stats.recent_requests || []);
      }
    } catch {
      // ignore
    }
  };

  // Poll for pending instructor requests
  const fetchInstructorStats = async () => {
    if (user?.primary_role !== 'SUPER_ADMIN') return;
    try {
      const requests = await instructorRequestService.getAdminRequests();
      const pending = requests.filter((r: any) => r.status === 'PENDING').length;
      setPendingInstructorCount(pending);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingStats();
      fetchInstructorStats();
      const interval = setInterval(() => {
        fetchPendingStats();
        fetchInstructorStats();
      }, 8000); // 8s live poll
      return () => clearInterval(interval);
    }
  }, [isAdmin, user?.primary_role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#DFE5EC]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOnlyInstructor = isInstructor && !isAdmin;

  if (!isInstructor) {
    return <Navigate to="/dashboard" replace />;
  }

  const allowedInstructorPaths = ['/admin/scenarios', '/admin/taxonomy'];
  if (isOnlyInstructor && !allowedInstructorPaths.includes(location.pathname)) {
    return <Navigate to="/admin/scenarios" replace />;
  }

  let adminNav = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'CTF Scenarios', path: '/admin/scenarios', icon: Flag },
    { name: 'Categories & Levels', path: '/admin/taxonomy', icon: Layers },
    { name: 'Trainees & Users', path: '/admin/students', icon: Users, badge: pendingInstructorCount > 0 ? pendingInstructorCount : null },
    ...(user?.primary_role === 'SUPER_ADMIN' 
      ? [{ name: 'Payment Approvals', path: '/admin/payments', icon: CreditCard, badge: pendingCount > 0 ? pendingCount : null }] 
      : []),
    { name: 'Platform Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'System Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  if (isOnlyInstructor) {
    adminNav = adminNav.filter(item => allowedInstructorPaths.includes(item.path));
  }

  return (
    <div className="min-h-screen flex bg-[#DFE5EC] dark:bg-[#07090E] transition-colors duration-200 relative overflow-x-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Responsive Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#090D16] text-slate-800 dark:text-slate-300 flex flex-col shrink-0 border-r border-slate-300 dark:border-[rgba(255,255,255,0.08)] shadow-2xl lg:shadow-xs transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand */}
        <div className="h-16 px-5 border-b border-slate-300 dark:border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/offensivegrid-mark.png" alt="OffensiveGrid" className="w-full h-full object-contain filter drop-shadow-sm dark:drop-shadow-[0_0_1.5px_rgba(255,255,255,0.85)] dark:drop-shadow-[0_0_8px_rgba(206,32,41,0.4)]" />
            </div>
            <div>
              <h1 className="font-black text-base tracking-tight leading-none">
                <span className="text-[#0B203F] dark:text-[#60A5FA] transition-colors">Offensive</span>
                <span className="text-[#C8212B] dark:text-[#EF4444] ml-0.5 transition-colors">Grid</span>
              </h1>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider uppercase font-semibold">
                Admin Console
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-100 dark:bg-[#111726] border border-slate-300 dark:border-[rgba(255,255,255,0.08)] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
            <Badge role={user?.primary_role} className="text-[9px] py-0 px-1.5 h-3.5 bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700">
              {user?.primary_role}
            </Badge>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111624]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-300 dark:border-[rgba(255,255,255,0.08)] space-y-1.5">
          <Link
            to="/dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111624] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Switch to Trainee View
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#DFE5EC] dark:bg-[#06080D] cyber-grid-bg transition-colors duration-250">
        <header className="h-16 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 bg-white/98 dark:bg-[#0C1017]/95 backdrop-blur-md border-b border-slate-300 dark:border-[rgba(255,255,255,0.08)] shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] dark:shadow-none transition-colors duration-250">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#101522] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161D2E] shadow-2xs cursor-pointer shrink-0"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              Security Control & Scenarios Management
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Pill (Sun ☀️ Light / Moon 🌙 Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#101522] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:bg-[#161D2E] shadow-2xs transition-all duration-200 hover:scale-105 cursor-pointer text-xs font-bold"
              title={isDark ? "Dark Theme Active — Click to switch to Light Theme ☀️" : "Light Theme Active — Click to switch to Dark Theme 🌙"}
              aria-label="Toggle Theme Mode"
            >
              {isDark ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/30 transition-transform rotate-0" />
                  <span className="hidden sm:inline text-indigo-300 font-mono text-[11px]">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500 fill-amber-400 transition-transform rotate-0" />
                  <span className="hidden sm:inline text-amber-800 font-mono text-[11px]">Light</span>
                </>
              )}
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-ping"></span>
                )}
                {pendingCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0C1017] rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.1)] shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-[rgba(255,255,255,0.08)] pb-2.5 mb-2.5">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Notifications
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                      {pendingCount} Pending
                    </span>
                  </div>

                  {pendingCount === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5 opacity-80" />
                      All payment requests verified!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {recentRequests.map((req) => (
                        <Link
                          key={req.id}
                          to="/admin/payments"
                          onClick={() => setIsNotifOpen(false)}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5 transition-colors block"
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 text-xs font-bold">
                            💰
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {req.user_details?.username} ({Number(req.amount).toLocaleString()} PKR)
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              WA: {req.whatsapp_number}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2.5 text-center">
                    <Link
                      to="/admin/payments"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline inline-flex items-center gap-1"
                    >
                      View All Payment Approvals →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Live System
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
