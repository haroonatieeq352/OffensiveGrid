import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Shield,
  Trophy,
  Flag,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  CreditCard,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProMembershipModal } from './ProMembershipModal';
import { Toast, ToastProps } from '../ui/Toast';
import { BrandLogo } from './BrandLogo';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isInstructor, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Close mobile nav on route change
  React.useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  const hasProAccess = !!user?.has_paid_access || isAdmin;

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Scenarios', path: '/scenarios', icon: Flag },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0C1017]/95 backdrop-blur-md border-b border-slate-300 dark:border-[rgba(255,255,255,0.08)] shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] dark:shadow-none transition-colors duration-250">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <BrandLogo to="/" size="md" showTagline={true} />

            {/* Navigation links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-indigo-50 dark:bg-[#121829] text-indigo-700 dark:text-indigo-400 shadow-2xs border border-indigo-200 dark:border-indigo-500/30'
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#111622]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
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

            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                {/* Pro Upgrade / Pro Status Pill */}
                {hasProAccess ? (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-[#1A160A] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>PRO MEMBER 💎</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsProModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition-all hover:scale-105"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Get Pro 💎</span>
                  </button>
                )}

                {/* Admin Switcher */}
                {(isAdmin || isInstructor) && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm" className="hidden sm:inline-flex border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-[#121829] hover:bg-indigo-100 dark:hover:bg-indigo-950/60">
                      Admin Portal
                    </Button>
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#101522] hover:bg-slate-50 dark:hover:bg-[#161D2E] transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        {user.username}
                      </div>
                      <Badge role={user.primary_role} className="text-[9px] py-0 px-1.5 h-3.5">
                        {user.primary_role}
                      </Badge>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0E131F] rounded-xl shadow-dropdown border border-slate-200 dark:border-[rgba(255,255,255,0.08)] py-1 z-50 animate-fade-in">
                      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-xs font-medium text-slate-400">Signed in as</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.email}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile & Instructor Role Request
                      </Link>

                      {(isAdmin || isInstructor) && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-medium"
                        >
                          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          Admin Console
                        </Link>
                      )}

                      <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Create Account
                  </Button>
                </Link>
              </div>
            )}
            {/* Mobile Navigation Toggle (Hamburger / X) */}
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.12)] bg-white dark:bg-[#101522] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#161D2E] shadow-2xs transition-colors cursor-pointer"
                aria-label="Toggle Mobile Navigation"
              >
                {isMobileNavOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer for Phones & Tablets */}
      {isAuthenticated && isMobileNavOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)] bg-white/98 dark:bg-[#0C1017]/98 backdrop-blur-xl px-4 py-4 space-y-2 animate-fade-in shadow-xl">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-[#121829] text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111622]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Admin Switcher for Mobile */}
          {(isAdmin || isInstructor) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/admin"
                onClick={() => setIsMobileNavOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40"
              >
                <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Switch to Admin Portal
              </Link>
            </div>
          )}

          {/* Pro Upgrade Pill for Mobile */}
          {!hasProAccess && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  setIsProModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro Membership 💎
              </button>
            </div>
          )}
        </div>
      )}
      </header>
      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          emoji={toast.emoji}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* Pro Membership Modal */}
      <ProMembershipModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        onSuccess={(t) => setToast(t)}
      />
    </>
  );
};
