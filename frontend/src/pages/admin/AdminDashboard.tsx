import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Flag,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Crown,
  Medal,
  BarChart2,
  Clock,
  Save,
  PauseCircle,
  RotateCcw,
  UserPlus,
  Copy,
} from 'lucide-react';
import { scenarioService, authService, leaderboardService, tournamentService, paymentService, apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toast, ToastProps } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [scenariosCount, setScenariosCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [durationHours, setDurationHours] = useState<number>(4);
  const [durationMinutes, setDurationMinutes] = useState<number>(0);
  const [isTournamentActive, setIsTournamentActive] = useState<boolean>(true);
  const [isSavingDuration, setIsSavingDuration] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [isRestartModalOpen, setIsRestartModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  
  const [proPlanAmount, setProPlanAmount] = useState<number>(2500);
  const [isSavingPricing, setIsSavingPricing] = useState<boolean>(false);

  useEffect(() => {
    const fetchAdminStats = async () => {
      setIsLoading(true);
      try {
        const [scenariosResult, usersResult, telemetryResult, configResult, pricingResult] = await Promise.allSettled([
          scenarioService.getAdminScenarios(),
          authService.getUsers(),
          leaderboardService.getStudentTelemetry(),
          tournamentService.getConfig(),
          paymentService.getSettings(),
        ]);

        if (scenariosResult.status === 'fulfilled') {
          const scenariosData = scenariosResult.value;
          const list = Array.isArray(scenariosData)
            ? scenariosData
            : (scenariosData as any)?.results || (scenariosData as any)?.data || [];
          const count = (scenariosData as any)?.count ?? list.length;
          setScenariosCount(count);
        } else {
          console.error('Failed to load scenarios count:', scenariosResult.reason);
        }

        if (usersResult.status === 'fulfilled') {
          const usersData = usersResult.value;
          const list = Array.isArray(usersData)
            ? usersData
            : (usersData as any)?.results || (usersData as any)?.data || [];
          const count = (usersData as any)?.count ?? list.length;
          setUsersCount(count);
        } else {
          console.error('Failed to load users count:', usersResult.reason);
        }

        if (telemetryResult.status === 'fulfilled') {
          setTelemetry(telemetryResult.value);
        } else {
          console.error('Failed to load telemetry stats:', telemetryResult.reason);
        }

        if (pricingResult.status === 'fulfilled') {
          const pricingRes = pricingResult.value;
          if (pricingRes && pricingRes.pro_plan_amount !== undefined) {
            setProPlanAmount(Number(pricingRes.pro_plan_amount));
          }
        }

        if (configResult.status === 'fulfilled') {
          const configRes = configResult.value;
          if (configRes) {
            if (configRes.duration_minutes !== undefined) {
              setDurationHours(Math.floor(configRes.duration_minutes / 60));
              setDurationMinutes(configRes.duration_minutes % 60);
            }
            if (configRes.is_active !== undefined) {
              setIsTournamentActive(configRes.is_active);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  const top3Podium = telemetry?.top_3_podium || [];
  const globalStats = telemetry?.global_stats || {
    total_solves: 0,
    total_fails: 0,
    total_attempts: 0,
    global_accuracy_rate: 0,
  };

  const handleSaveDuration = async () => {
    setIsSavingDuration(true);
    try {
      const totalMinutes = (durationHours * 60) + durationMinutes;
      await tournamentService.updateConfig(totalMinutes, isTournamentActive);
      setToast({ type: 'success', title: 'Success', message: 'Tournament duration saved globally!' });
    } catch (err) {
      console.error('Failed to save duration:', err);
      setToast({ type: 'error', title: 'Error', message: 'Failed to save tournament duration.' });
    } finally {
      setIsSavingDuration(false);
    }
  };

  const handleSavePricing = async () => {
    setIsSavingPricing(true);
    try {
      await paymentService.updateSettings(proPlanAmount);
      setToast({ type: 'success', title: 'Pricing Updated', message: 'Pro membership global price saved successfully!' });
    } catch (err) {
      console.error('Failed to save pricing:', err);
      setToast({ type: 'error', title: 'Error', message: 'Failed to save pricing.' });
    } finally {
      setIsSavingPricing(false);
    }
  };

  const handleToggleActive = async () => {
    setIsProcessing(true);
    try {
      const newStatus = !isTournamentActive;
      const totalMinutes = (durationHours * 60) + durationMinutes;
      await tournamentService.updateConfig(totalMinutes, newStatus);
      setIsTournamentActive(newStatus);
      setToast({ 
        type: 'success', 
        title: newStatus ? 'Tournament Started' : 'Tournament Stopped', 
        message: newStatus ? 'Students can now start their sessions.' : 'Students can no longer start sessions.' 
      });
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to update tournament status.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestartTournamentClick = () => {
    setIsRestartModalOpen(true);
  };

  const confirmRestartTournament = async () => {
    setIsProcessing(true);
    try {
      await tournamentService.resetTournament();
      setIsRestartModalOpen(false);
      setToast({ type: 'success', title: 'Tournament Restarted', message: 'All active sessions have been cleared.' });
      // Refresh telemetry
      const telemetryRes = await leaderboardService.getStudentTelemetry();
      setTelemetry(telemetryRes);
    } catch (err) {
      console.error('Failed to restart tournament:', err);
      setToast({ type: 'error', title: 'Error', message: 'Failed to restart tournament.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    setGeneratedInviteLink('');
    try {
      const response = await apiClient.post('/auth/admin/invite/generate/');
      if (response.data?.success) {
        const link = `${window.location.origin}/admin/invite?key=${response.data.data.invite_key}`;
        setGeneratedInviteLink(link);
      }
    } catch (err) {
      setToast({ type: 'error', title: 'Error', message: 'Failed to generate admin invite key.' });
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedInviteLink);
    setToast({ type: 'success', title: 'Copied!', message: 'Invite link copied to clipboard.' });
  };

  return (
    <div className="space-y-8">
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          emoji={toast.emoji}
          duration={toast.duration}
          onClose={() => setToast(null)}
        />
      )}

      {/* Restart Confirmation Modal */}
      <Modal
        isOpen={isRestartModalOpen}
        onClose={() => setIsRestartModalOpen(false)}
        title="Confirm Tournament Restart"
        description="Are you absolutely sure you want to restart the tournament? This action cannot be undone."
      >
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
            <strong>Warning:</strong> This will instantly delete all active student sessions and reset the global timer. Any student currently taking the challenge will be kicked out and have to start over.
          </div>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsRestartModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              onClick={confirmRestartTournament}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Yes, Restart Tournament
            </Button>
          </div>
        </div>
      </Modal>

      {/* Admin Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Generate Secure Admin Invite 🛡️"
        description="Create a one-time use registration link for a new Administrator."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          {!generatedInviteLink ? (
            <div className="text-center py-6">
              <Button
                variant="primary"
                onClick={handleGenerateInvite}
                isLoading={isGeneratingInvite}
                leftIcon={<Shield className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Generate Secure Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl text-sm border border-emerald-200 dark:border-emerald-800">
                <strong>Success!</strong> The invite link has been generated. It is valid for 7 days and can only be used once.
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 font-mono focus:outline-none"
                />
                <Button variant="secondary" onClick={copyToClipboard} leftIcon={<Copy className="w-4 h-4" />}>
                  Copy
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Security Control & Training Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time management console for CTF challenges, student accounts, and tournament operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user?.primary_role === 'SUPER_ADMIN' && (
            <Button 
              variant="secondary" 
              size="sm" 
              leftIcon={<UserPlus className="w-4 h-4" />}
              onClick={() => {
                setGeneratedInviteLink('');
                setIsInviteModalOpen(true);
              }}
            >
              Invite Admin
            </Button>
          )}
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm" leftIcon={<BarChart2 className="w-4 h-4 text-indigo-600" />}>
              Live Student Analytics
            </Button>
          </Link>
          <Link to="/admin/scenarios">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Scenario
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-saas">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Scenarios</p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">{scenariosCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800/40">
              <Flag className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Trainees</p>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">{usersCount}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-800/40">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Flags Solved</p>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {globalStats.total_solves} Flags
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Failed Flag Attempts</p>
              <div className="text-2xl font-extrabold text-rose-500 dark:text-rose-400 font-mono mt-1">
                {globalStats.total_fails} Fails
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-100 dark:border-rose-800/40">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🏆 Top 3 Podium Winners Preview */}
      <Card className="card-saas">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              Tournament Top-3 Final Podium (Winners Showcase)
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live podium evaluated by points and speed for final prize distribution.
            </p>
          </div>
          <Link to="/admin/analytics" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
            Full Telemetry & Race Track <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* 1st */}
            {top3Podium[0] && (
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-bold shadow-xs">
                    🥇
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                      {top3Podium[0].username}
                    </h4>
                    <p className="text-[11px] text-amber-900 dark:text-amber-400 font-semibold">1st Place Champion</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-900 dark:text-amber-300 font-mono block">
                    {top3Podium[0].total_score} pts
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                    {top3Podium[0].solves} Solved / {top3Podium[0].fails} Fails
                  </span>
                </div>
              </div>
            )}

            {/* 2nd */}
            {top3Podium[1] && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-300 dark:border-slate-700/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white flex items-center justify-center text-xl font-bold shadow-xs">
                    🥈
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                      {top3Podium[1].username}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold">2nd Place Runner-Up</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-800 dark:text-white font-mono block">
                    {top3Podium[1].total_score} pts
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                    {top3Podium[1].solves} Solved / {top3Podium[1].fails} Fails
                  </span>
                </div>
              </div>
            )}

            {/* 3rd */}
            {top3Podium[2] && (
              <div className="p-4 rounded-xl bg-amber-900/5 dark:bg-amber-950/15 border border-amber-600/40 dark:border-amber-700/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                    🥉
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-tight">
                      {top3Podium[2].username}
                    </h4>
                    <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold">3rd Place Bronze</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-amber-900 dark:text-amber-300 font-mono block">
                    {top3Podium[2].total_score} pts
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">
                    {top3Podium[2].solves} Solved / {top3Podium[2].fails} Fails
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="card-saas">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-indigo-600" />
              Scenario Catalog Management
            </CardTitle>
            <Link to="/admin/scenarios" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <p>
              Configure challenges, attach mission dossiers, define secret flag values with regex rules, and set attempt limits.
            </p>
            <Link to="/admin/scenarios" className="inline-block">
              <Button size="sm" variant="outline">
                Open Scenario Editor
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-600" />
              Trainee & User Management
            </CardTitle>
            <Link to="/admin/students" className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1">
              Manage Trainees <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <p>
              Review registered students, inspect individual solve histories, audit suspicious flag attempts, and toggle account access.
            </p>
            <Link to="/admin/students" className="inline-block">
              <Button size="sm" variant="outline">
                Open User Directory
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Settings Cards Section */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Pro Membership Pricing Card */}
        <Card className="card-saas border-emerald-200 dark:border-emerald-800/40 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.1)]">
          <CardHeader className="bg-emerald-50/50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/40">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
              <span className="text-emerald-600 dark:text-emerald-400 font-serif font-extrabold text-lg -mt-1">₨</span>
              Pro Membership Pricing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Global Subscription Amount (PKR)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Set the exact price students must pay to unlock full Pro access. This amount will instantly update on the "Get Pro" modal across all student accounts.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="999999"
                      className="w-40 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-12 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={proPlanAmount}
                      onChange={(e) => setProPlanAmount(parseFloat(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">PKR</span>
                  </div>
                  
                  <Button
                    onClick={handleSavePricing}
                    disabled={isSavingPricing || proPlanAmount <= 0 || proPlanAmount > 999999}
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 border-none"
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {isSavingPricing ? 'Saving...' : 'Save Pricing'}
                  </Button>
                </div>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center min-w-[200px]">
                <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">
                  Student Preview
                </span>
                <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-wider">
                  {proPlanAmount.toLocaleString()} <span className="text-sm">PKR</span>
                </span>
                <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  One-time Pro Activation
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Settings Card */}
        <Card className="card-saas border-indigo-200 dark:border-indigo-800/40 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.1)]">
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/40">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Tournament Timer Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="max-w-md">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Global Countdown Duration
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Set the total time (in minutes) for the tournament. When a student clicks "Start Tournament" on their dashboard, a persistent timer will start specifically for them based on this global setting.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-10 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={durationHours}
                      onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">HRS</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      className="w-24 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-12 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400">MINS</span>
                  </div>
                  <Button
                    onClick={handleSaveDuration}
                    disabled={isSavingDuration || ((durationHours * 60) + durationMinutes) <= 0}
                    variant="primary"
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    {isSavingDuration ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center min-w-[200px]">
                <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1">
                  Preview (Live Format)
                </span>
                <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {durationHours.toString().padStart(2, '0')}h : {durationMinutes.toString().padStart(2, '0')}m
                </span>
                <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  Total: {(durationHours * 60) + durationMinutes} Minutes
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4">
              <Button
                onClick={handleToggleActive}
                disabled={isProcessing}
                variant={isTournamentActive ? 'outline' : 'primary'}
                className={isTournamentActive ? 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-50 dark:hover:bg-amber-900/20' : ''}
                leftIcon={<PauseCircle className="w-4 h-4" />}
              >
                {isProcessing ? 'Processing...' : (isTournamentActive ? 'Stop Tournament' : 'Start Tournament')}
              </Button>
              
              <Button
                onClick={handleRestartTournamentClick}
                disabled={isProcessing}
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20"
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Restart (Reset All Sessions)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
