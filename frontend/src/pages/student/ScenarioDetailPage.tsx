import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Flag,
  ArrowLeft,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Lock,
  Sparkles,
  MessageSquare,
  Timer,
  FileText,
  Globe,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { scenarioService, submissionService, tournamentService } from '../../services/api';
import { Scenario, FlagSubmissionResult } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Toast, ToastProps } from '../../components/ui/Toast';
import { ProMembershipModal } from '../../components/common/ProMembershipModal';
import { useTournamentSync } from '../../hooks/useTournamentSync';

export const ScenarioDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAdmin } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [flagInput, setFlagInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<FlagSubmissionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedTargetUrl, setCopiedTargetUrl] = useState(false);

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTargetUrl(true);
    setTimeout(() => setCopiedTargetUrl(false), 2000);
  };

  // Pro Upgrade Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [session, setSession] = useState<any>(null);

  const hasProAccess = !!user?.has_paid_access || isAdmin;
  const isLocked = (scenario?.is_paid && !hasProAccess) || !!(scenario as any)?.is_locked;
  const isLimitExceeded = scenario && scenario.max_attempts > 0 && (scenario.attempts_used || 0) >= scenario.max_attempts;
  const isInputDisabled = isLocked || isLimitExceeded || scenario?.is_solved;

  const fetchSession = async () => {
    try {
      const sessionData = await tournamentService.getMySession();
      setSession(sessionData);
    } catch (err) {
      setSession(null);
    }
  };

  useTournamentSync(() => {
    fetchSession();
  });

  useEffect(() => {
    const fetchScenario = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        const [data] = await Promise.allSettled([
          scenarioService.getScenarioDetail(slug),
        ]);
        
        if (data.status === 'fulfilled') {
          setScenario(data.value);
        } else {
          setErrorMessage(data.reason?.response?.data?.error?.message || 'Could not load scenario details.');
        }

        await fetchSession();
      } catch (err: any) {
        setErrorMessage(err.message || 'Error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenario();
  }, [slug]);

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scenario || !flagInput.trim()) return;

    if (isLocked) {
      setErrorMessage('This is a Paid / Pro scenario. Please upgrade to OffensiveGrid Pro to submit flags.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await submissionService.submitFlag({
        scenario_id: scenario.id,
        flag: flagInput.trim(),
      });
      if (response.success && response.data) {
        setSubmissionResult(response.data);
        
        // Update local state so the progress bar updates instantly
        setScenario(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            attempts_used: response.data.attempt_number,
            is_solved: response.data.is_correct || prev.is_solved,
          };
        });
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.error?.message || err.message || 'Submission failed. Please check connection.'
      );
      
      // If error contains attempt number (e.g., from limit exceeded), we can try to parse it, 
      // but usually the backend just blocks it. We can refetch to be safe.
      if (err.response?.status === 400 || err.response?.status === 403) {
        const fetchScenario = async () => {
          try {
            const data = await scenarioService.getScenarioDetail(scenario.slug);
            setScenario(data);
          } catch (e) {}
        };
        fetchScenario();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="text-center py-20 bg-white dark:bg-[#0C1017] rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)] p-8">
        <Shield className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Scenario Not Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">The requested challenge is unavailable or archived.</p>
        <Link to="/scenarios">
          <Button variant="outline">Back to Scenarios</Button>
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20 bg-white dark:bg-[#0C1017] rounded-2xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)] p-8">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tournament Not Started</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-md mx-auto">
          You must start the Tournament Timer from your Dashboard before you can access and play scenarios.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Floating Center Toast */}
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
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        scenarioId={scenario.id}
        scenarioTitle={scenario.title}
        onSuccess={(t) => setToast(t)}
      />

      {/* Back Button */}
      <div>
        <Link
          to="/scenarios"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to CTF Catalog
        </Link>
      </div>

      {/* Scenario Header Card */}
      <Card className="card-saas p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-[rgba(148,163,184,0.08)]">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {scenario.category.name}
              </span>
              <Badge difficulty={scenario.difficulty} />
              {scenario.is_paid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs">
                  <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>PRO 💎</span>
                </span>
              )}
              {session && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800/40 text-indigo-800 dark:text-indigo-400 text-[10px] font-bold font-mono uppercase tracking-wider shrink-0 ml-2">
                  <Timer className="w-3 h-3" />
                  <CountdownTimer initialSeconds={session.remaining_seconds} />
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {isLocked && <Lock className="w-6 h-6 text-amber-500 shrink-0" />}
              <span>{scenario.title}</span>
            </h1>
            {scenario.description && (
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-normal">
                {scenario.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/40 text-center">
              <span className="block text-[10px] font-mono uppercase text-indigo-500 dark:text-indigo-400 font-bold">Reward</span>
              <span className="text-xl font-mono font-extrabold text-indigo-700 dark:text-indigo-300">{scenario.points} PTS</span>
            </div>
          </div>
        </div>

        {/* Target Environment Box (Unlocked vs Locked) */}
        {!isLocked && scenario.target_url ? (
          <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-500/[0.09] via-slate-50 to-indigo-500/[0.07] dark:from-slate-900/95 dark:via-cyan-950/25 dark:to-slate-900/95 border-2 border-cyan-500/50 dark:border-cyan-500/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-800 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Isolated Sandbox Lab Target
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400/80 dark:border-emerald-800/60">
                  LIVE TARGET
                </span>
              </div>
              <div className="flex items-center gap-2 max-w-xl">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-700 shadow-2xs flex-1 min-w-0">
                  <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                  <code className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-cyan-300 truncate select-all">
                    {scenario.target_url}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(scenario.target_url!)}
                  className="p-2 rounded-xl bg-white dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-2xs shrink-0 flex items-center justify-center"
                  title="Copy Target URL"
                >
                  {copiedTargetUrl ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
            <a
              href={scenario.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button size="sm" variant="cyber" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                Launch Target Lab
              </Button>
            </a>
          </div>
        ) : isLocked ? (
          <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/5 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>OffensiveGrid Pro Challenge 💎</span>
              </div>
              <p className="text-xs text-slate-600">
                This challenge requires an active <strong>OffensiveGrid Pro</strong> membership or payment verification to access live sandboxes and submit flags.
              </p>
            </div>
            <Button
              variant="primary"
              className="!bg-amber-600 hover:!bg-amber-700 !border-amber-600 shrink-0"
              onClick={() => setUpgradeModalOpen(true)}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Unlock Pro Access 💎
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Grid: Instructions vs Flag Submission */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mission Briefing / Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="card-saas relative overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Flag className="w-4 h-4 text-indigo-600" />
                Mission Briefing & Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLocked ? (
                <div className="relative p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Mission Briefing is Locked
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Upgrade to OffensiveGrid Pro or submit your payment verification proof to reveal full mission intelligence, target binaries, and reverse engineering source code.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="!bg-amber-600 hover:!bg-amber-700 !border-amber-600"
                    onClick={() => setUpgradeModalOpen(true)}
                  >
                    Request Pro Unlock 💎
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {scenario.description && scenario.instructions && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80">
                      <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Mission Overview
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                        {scenario.description}
                      </p>
                    </div>
                  )}

                  <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed whitespace-pre-line font-sans text-sm">
                    {scenario.instructions || scenario.description}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Downloadable Assets */}
          {!isLocked && scenario.files && scenario.files.length > 0 && (
            <Card className="card-saas">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-600" />
                  Mission Dossier & Attachment Files
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scenario.files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{file.file_name}</p>
                      <span className="text-[10px] text-slate-400">
                        {(file.file_size_bytes / 1024).toFixed(1)} KB • {file.file_type}
                      </span>
                    </div>
                    <Button size="sm" variant="outline" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      Download Dossier
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Flag Submission Panel */}
        <div className="space-y-4">
          <Card className={`card-saas ${isLocked ? 'border-amber-200 dark:border-amber-500/20 dark:bg-[#090D14]' : 'border-indigo-200 dark:border-indigo-500/20 dark:bg-[#090D14]'}`}>
            <CardHeader className={isLocked ? 'bg-amber-50/50 dark:bg-amber-500/10 border-b border-amber-200/50 dark:border-amber-500/10' : 'bg-gradient-to-r from-indigo-50/50 dark:from-indigo-500/10 to-transparent border-b border-indigo-100 dark:border-indigo-500/10'}>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className={`w-4 h-4 ${isLocked ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
                Capture Flag & Submit
              </CardTitle>
              {isLocked ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Locked: Requires OffensiveGrid Pro membership.</p>
              ) : (
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {scenario.max_attempts > 0
                      ? `Strict Limit: ${scenario.max_attempts} attempts allowed.`
                      : 'Unlimited attempts allowed.'}
                  </p>
                  {scenario.max_attempts > 0 && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            (scenario.attempts_used || 0) >= scenario.max_attempts 
                              ? 'bg-rose-500' 
                              : (scenario.attempts_used || 0) > 0 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(((scenario.attempts_used || 0) / scenario.max_attempts) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {scenario.attempts_used || 0} / {scenario.max_attempts} Used
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Submission Alerts */}
              {submissionResult && submissionResult.is_correct && (
                <Alert variant="success" title="Flag Accepted!">
                  {submissionResult.message}
                </Alert>
              )}

              {submissionResult && !submissionResult.is_correct && (
                <Alert variant="error" title="Incorrect Flag">
                  {submissionResult.message}
                  {submissionResult.remaining_attempts !== null && (
                    <span className="block font-bold mt-1">
                      Remaining attempts: {submissionResult.remaining_attempts}
                    </span>
                  )}
                </Alert>
              )}

              {errorMessage && (
                <Alert variant="error" title="Submission Blocked">
                  {errorMessage}
                </Alert>
              )}

              <form onSubmit={handleFlagSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Captured Flag Value
                  </label>
                  <input
                    type="text"
                    placeholder={
                      isLocked ? 'Unlock Pro to enter flags...' : 
                      scenario.is_solved ? 'Already Solved ✔️' :
                      isLimitExceeded ? 'Attempt Limit Exceeded ⛔' :
                      'CTF{secret_flag_value}'
                    }
                    value={flagInput}
                    onChange={(e) => setFlagInput(e.target.value)}
                    disabled={isInputDisabled}
                    className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.08)] bg-white dark:bg-[#06080D] px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 disabled:bg-slate-50 dark:disabled:bg-[rgba(255,255,255,0.02)] disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-inner dark:shadow-none"
                    required
                  />
                </div>

                {isLocked ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full !bg-amber-600 hover:!bg-amber-700 !border-amber-600"
                    onClick={() => setUpgradeModalOpen(true)}
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                  >
                    Unlock Pro Scenario 💎
                  </Button>
                ) : scenario.is_solved ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full !bg-emerald-600 hover:!bg-emerald-700 !border-emerald-600 cursor-not-allowed opacity-80"
                    disabled={true}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Flag Captured
                  </Button>
                ) : isLimitExceeded ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="w-full !bg-rose-600 hover:!bg-rose-700 !border-rose-600 cursor-not-allowed opacity-80"
                    disabled={true}
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                  >
                    Limit Reached
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Submit Captured Flag
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
