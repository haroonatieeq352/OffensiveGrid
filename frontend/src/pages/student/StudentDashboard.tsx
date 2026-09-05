import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Trophy,
  Flag,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  Crosshair,
  Key,
  Globe,
  Cpu,
  Wifi,
  Search,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Activity,
  Layers,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  HelpCircle,
  Lock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { scenarioService, submissionService, leaderboardService, tournamentService, taxonomyService } from '../../services/api';
import { Scenario, Submission, LeaderboardEntry, Difficulty } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { ProMembershipModal } from '../../components/common/ProMembershipModal';
import { Toast, ToastProps } from '../../components/ui/Toast';
import { useTournamentSync } from '../../hooks/useTournamentSync';

export const StudentDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Failure audit table state
  const [submissionFilter, setSubmissionFilter] = useState<'ALL' | 'CORRECT' | 'FAILED'>('ALL');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [revealedFlags, setRevealedFlags] = useState<Set<string>>(new Set());
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  // Tournament session state
  const [session, setSession] = useState<any>(null);
  const [isStartingTournament, setIsStartingTournament] = useState(false);

  const hasProAccess = !!user?.has_paid_access || isAdmin;

  const fetchSession = async () => {
    try {
      const sessionRes = await tournamentService.getMySession();
      setSession(sessionRes);
    } catch (err) {
      setSession(null);
    }
  };

  useTournamentSync(() => {
    fetchSession();
  });

  useEffect(() => {
    const fetchDashboardTelemetry = async () => {
      setIsLoading(true);
      try {
        const [scenariosRes, subsRes, boardRes] = await Promise.allSettled([
          scenarioService.getScenarios(),
          submissionService.getMySubmissions(),
          leaderboardService.getGlobalLeaderboard(),
        ]);

        if (scenariosRes.status === 'fulfilled') {
          const scData = scenariosRes.value;
          setScenarios(Array.isArray(scData) ? scData : (scData as any)?.results || []);
        }
        if (subsRes.status === 'fulfilled') {
          const subData = subsRes.value;
          setSubmissions(Array.isArray(subData) ? subData : (subData as any)?.results || []);
        }
        if (boardRes.status === 'fulfilled') {
          const boardData = boardRes.value;
          setLeaderboard(Array.isArray(boardData) ? boardData : (boardData as any)?.results || []);
        }
        
        try {
          const diffs = await taxonomyService.getDifficulties();
          setDifficulties(diffs);
        } catch (e) {
          console.error("Failed to load difficulties", e);
        }
        
        await fetchSession();
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardTelemetry();
  }, []);

  const handleStartTournament = async () => {
    setIsStartingTournament(true);
    try {
      const res = await tournamentService.startSession();
      setSession(res);
      setToast({ type: 'success', title: 'Tournament Started', message: 'Your time begins now. Good luck!' });
    } catch (err: any) {
      console.error('Failed to start tournament:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to start tournament. It may have already been started, or is currently stopped.';
      setToast({ type: 'error', title: 'Error', message: errorMsg });
    } finally {
      setIsStartingTournament(false);
    }
  };

  // Compute User Performance Metrics (Real Live Data from DB)
  const myRankEntry = useMemo(() => {
    return leaderboard.find((item) => item.username === user?.username);
  }, [leaderboard, user]);

  // Calculate real total score: from leaderboard entry if present, OR sum of points from solved scenarios
  const totalScore = useMemo(() => {
    if (myRankEntry && typeof myRankEntry.total_score === 'number') {
      return myRankEntry.total_score;
    }
    const solvedScenarioIds = new Set(
      submissions.filter((s) => s.is_correct).map((s) => s.scenario_id)
    );
    return scenarios
      .filter((sc) => solvedScenarioIds.has(sc.id) || sc.is_solved)
      .reduce((sum, sc) => sum + (sc.points || 0), 0);
  }, [myRankEntry, submissions, scenarios]);

  const solvedCount = useMemo(() => {
    const solvedFromSubs = new Set(
      submissions.filter((s) => s.is_correct).map((s) => s.scenario_id)
    ).size;
    const solvedFromScenarios = scenarios.filter((sc) => sc.is_solved).length;
    return Math.max(solvedFromSubs, solvedFromScenarios, myRankEntry?.solved_count || 0);
  }, [submissions, scenarios, myRankEntry]);

  const isRanked = !!myRankEntry?.rank && (myRankEntry.total_score > 0 || solvedCount > 0);
  const myRank = isRanked ? `#${myRankEntry!.rank}` : 'Unranked';
  const isPodium = isRanked && myRankEntry!.rank <= 3;

  const totalScenarios = scenarios.length;
  const correctSubmissions = submissions.filter((s) => s.is_correct).length;
  const failedSubmissions = submissions.filter((s) => !s.is_correct).length;
  const totalAttemptsCount = correctSubmissions + failedSubmissions;
  const accuracyRate = totalAttemptsCount > 0 ? Math.round((correctSubmissions / totalAttemptsCount) * 100) : 0;

  // Rank Title & XP Level
  const getRankInfo = (score: number) => {
    if (score >= 1000) return { title: 'Elite Cyber Operator', level: 5, nextLevel: 'Grandmaster', targetPoints: 2000, currentBase: 1000 };
    if (score >= 400) return { title: 'Cyber Specialist', level: 4, nextLevel: 'Elite Cyber Operator', targetPoints: 1000, currentBase: 400 };
    if (score >= 200) return { title: 'Junior Exploiter', level: 3, nextLevel: 'Cyber Specialist', targetPoints: 400, currentBase: 200 };
    if (score >= 50) return { title: 'Apprentice Trainee', level: 2, nextLevel: 'Junior Exploiter', targetPoints: 200, currentBase: 50 };
    return { title: 'Recruit', level: 1, nextLevel: 'Apprentice Trainee', targetPoints: 50, currentBase: 0 };
  };

  const rankInfo = getRankInfo(totalScore);
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalScore - rankInfo.currentBase) / (rankInfo.targetPoints - rankInfo.currentBase)) * 100))
  );

  // 1. DYNAMIC Domain Mastery Data (Computed directly from real backend scenarios & submissions)
  const domainMasteryData = useMemo(() => {
    const domainMap: Record<string, { name: string; icon: any; color: string; total: number; earned: number; totalChallenges: number; solvedChallenges: number }> = {};
    
    const colorPalette = ['#4F46E5', '#D97706', '#0891B2', '#2563EB', '#7C3AED', '#DB2777', '#059669', '#DC2626'];
    const getIconByName = (iconName: string) => {
      const icons: any = { Globe, Key, Cpu, Wifi, Search, Crosshair, Shield, Target, Flag, Trophy, Lock, Zap };
      return icons[iconName] || Shield;
    };
    const getColorForCategory = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colorPalette[Math.abs(hash) % colorPalette.length];
    };

    // Solved scenario IDs set from submissions or scenarios
    const solvedScenarioIds = new Set(
      submissions.filter((s) => s.is_correct).map((s) => s.scenario_id)
    );

    scenarios.forEach((sc) => {
      const catName = sc.category?.name || 'Uncategorized';
      
      if (!domainMap[catName]) {
        domainMap[catName] = {
          name: catName.split(' ')[0],
          icon: getIconByName(sc.category?.icon || 'Globe'),
          color: getColorForCategory(catName),
          total: 0,
          earned: 0,
          totalChallenges: 0,
          solvedChallenges: 0,
        };
      }
      
      domainMap[catName].total += sc.points || 0;
      domainMap[catName].totalChallenges += 1;

      if (sc.is_solved || solvedScenarioIds.has(sc.id)) {
        domainMap[catName].earned += sc.points || 0;
        domainMap[catName].solvedChallenges += 1;
      }
    });

    return Object.entries(domainMap).map(([domain, data]) => ({
      domain,
      name: data.name,
      icon: data.icon,
      earned: data.earned,
      total: data.total > 0 ? data.total : 100, // clean default if no challenge in domain
      solvedChallenges: data.solvedChallenges,
      totalChallenges: data.totalChallenges,
      color: data.color,
    }));
  }, [scenarios, submissions]);

  // Grouped Bar Chart Data (Side-by-Side: Real Earned vs Real Target)
  const domainBarChartData = useMemo(() => {
    return domainMasteryData.map((d) => ({
      name: d.name,
      fullName: d.domain,
      'Earned Points': d.earned,
      'Total Available': d.total,
      earned: d.earned,
      total: d.total,
      solvedFraction: `${d.solvedChallenges}/${d.totalChallenges} Solved`,
    }));
  }, [domainMasteryData]);

  // 2. DYNAMIC Submission Accuracy Data (Solves vs Fails)
  const accuracyPieData = useMemo(() => {
    return [
      { name: 'Correct Flag Solves', value: correctSubmissions, color: '#10B981', label: `${correctSubmissions} Solves` },
      { name: 'Failed / Incorrect Attempts', value: failedSubmissions, color: '#EF4444', label: `${failedSubmissions} Fails` },
    ];
  }, [correctSubmissions, failedSubmissions]);

  // 3. DYNAMIC Challenge Difficulty Breakdown
  const difficultyStats = useMemo(() => {
    const diffMap: Record<string, { name: string; earnedPoints: number; totalPoints: number; solved: number; total: number; badgeClass: string; barColor: string }> = {};

    difficulties.forEach(diff => {
      let badgeClass = 'bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800/40';
      let barColor = `bg-${diff.color_code}-500`;

      if (diff.color_code === 'emerald') {
        badgeClass = 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50';
      } else if (diff.color_code === 'amber') {
        badgeClass = 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/50';
      } else if (diff.color_code === 'red') {
        badgeClass = 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/50';
      } else if (diff.color_code === 'purple') {
        badgeClass = 'bg-fuchsia-50 dark:bg-fuchsia-950/60 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-700/50';
      } else {
        badgeClass = `bg-${diff.color_code}-50 dark:bg-${diff.color_code}-950/60 text-${diff.color_code}-800 dark:text-${diff.color_code}-300 border-${diff.color_code}-300 dark:border-${diff.color_code}-700/50`;
      }

      diffMap[diff.id] = { name: diff.name, earnedPoints: 0, totalPoints: 0, solved: 0, total: 0, badgeClass, barColor };
    });

    // Fallback for scenarios with no difficulties or unmatched
    diffMap['UNKNOWN'] = { name: 'Unknown', earnedPoints: 0, totalPoints: 0, solved: 0, total: 0, badgeClass: 'bg-slate-50 text-slate-800', barColor: 'bg-slate-500' };

    const solvedScenarioIds = new Set(
      submissions.filter((s) => s.is_correct).map((s) => s.scenario_id)
    );

    scenarios.forEach((sc) => {
      const diffId = (sc.difficulty?.id || (typeof sc.difficulty === 'string' ? sc.difficulty : 'UNKNOWN')) as string;
      const targetDiff = diffMap[diffId] ? diffId : 'UNKNOWN';
      
      diffMap[targetDiff].total += 1;
      diffMap[targetDiff].totalPoints += sc.points || 0;
      if (sc.is_solved || solvedScenarioIds.has(sc.id)) {
        diffMap[targetDiff].solved += 1;
        diffMap[targetDiff].earnedPoints += sc.points || 0;
      }
    });

    return Object.keys(diffMap)
      .filter(key => diffMap[key].total > 0 || key !== 'UNKNOWN')
      .map(key => {
        const d = diffMap[key];
        const percent = d.total > 0 ? Math.round((d.solved / d.total) * 100) : 0;
        return {
          level: d.name,
          solved: d.solved,
          total: d.total,
          earnedPoints: d.earnedPoints,
          totalPoints: d.totalPoints,
          percent,
          badgeClass: d.badgeClass,
        barColor: d.barColor,
      };
    });
  }, [scenarios, submissions, difficulties]);

  // 4. DYNAMIC Combat Badges Logic (Evaluated based on real database solves)
  const badgesList = useMemo(() => {
    const hasSolvedHard = submissions.some(
      (s) => s.is_correct && (s.scenario_difficulty === 'HARD' || s.scenario_difficulty === 'INSANE')
    ) || scenarios.some((sc) => sc.is_solved && (sc.difficulty?.name?.toUpperCase() === 'HARD' || sc.difficulty?.name?.toUpperCase() === 'INSANE'));

    const hasSolvedWeb = submissions.some(
      (s) => s.is_correct && (s.scenario_title?.toLowerCase().includes('jwt') || s.scenario_title?.toLowerCase().includes('web') || s.scenario_title?.toLowerCase().includes('sql'))
    ) || scenarios.some((sc) => sc.is_solved && sc.category?.slug === 'web-exploitation');

    const hasSolvedCrypto = submissions.some(
      (s) => s.is_correct && (s.scenario_title?.toLowerCase().includes('caesar') || s.scenario_title?.toLowerCase().includes('crypto') || s.scenario_title?.toLowerCase().includes('cipher'))
    ) || scenarios.some((sc) => sc.is_solved && sc.category?.slug === 'cryptography');

    const hasSolvedReverse = submissions.some(
      (s) => s.is_correct && (s.scenario_title?.toLowerCase().includes('reverse') || s.scenario_title?.toLowerCase().includes('binary') || s.scenario_title?.toLowerCase().includes('buffer') || s.scenario_title?.toLowerCase().includes('hgk'))
    ) || scenarios.some((sc) => sc.is_solved && (sc.category?.slug === 'reverse-engineering' || sc.category?.slug === 'binary-exploitation'));

    const hasSolvedForensics = submissions.some(
      (s) => s.is_correct && (s.scenario_title?.toLowerCase().includes('pcap') || s.scenario_title?.toLowerCase().includes('network') || s.scenario_title?.toLowerCase().includes('packet'))
    ) || scenarios.some((sc) => sc.is_solved && sc.category?.slug === 'network-forensics');

    return [
      {
        id: 'first_blood',
        title: 'First Blood 🩸',
        desc: 'Captured the secret flag on a hard scenario.',
        unlocked: hasSolvedHard,
        icon: <Crosshair className="w-5 h-5 text-rose-600" />,
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
      },
      {
        id: 'jwt_slayer',
        title: 'JWT Slayer 🌐',
        desc: 'Exploited token signature bypass in Web lab.',
        unlocked: hasSolvedWeb,
        icon: <Globe className="w-5 h-5 text-indigo-600" />,
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      },
      {
        id: 'cipher_master',
        title: 'Cipher Master 🔐',
        desc: 'Cracked multi-layer Caesar & Base64 cipher.',
        unlocked: hasSolvedCrypto,
        icon: <Key className="w-5 h-5 text-amber-600" />,
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
      },
      {
        id: 'reverse_ninja',
        title: 'Reverse Ninja ⚙️',
        desc: 'Decompiled binary target and recovered flag.',
        unlocked: hasSolvedReverse,
        icon: <Cpu className="w-5 h-5 text-cyan-600" />,
        bg: 'bg-cyan-50 border-cyan-200 text-cyan-800',
      },
      {
        id: 'pcap_sniff',
        title: 'Packet Sniffer 📡',
        desc: 'Reconstruct covert FTP exfiltration stream.',
        unlocked: hasSolvedForensics,
        icon: <Wifi className="w-5 h-5 text-slate-400" />,
        bg: 'bg-slate-50 border-slate-200 text-slate-400 opacity-60',
      },
      {
        id: 'pro_operative',
        title: 'Pro Operative 💎',
        desc: 'Hold active OffensiveGrid Pro Membership.',
        unlocked: hasProAccess,
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
        bg: hasProAccess ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60',
      },
    ];
  }, [submissions, scenarios, hasProAccess]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesFilter =
        submissionFilter === 'ALL' ||
        (submissionFilter === 'CORRECT' && sub.is_correct) ||
        (submissionFilter === 'FAILED' && !sub.is_correct);

      const matchesSearch =
        submissionSearch === '' ||
        sub.scenario_title?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        sub.submitted_flag?.toLowerCase().includes(submissionSearch.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [submissions, submissionFilter, submissionSearch]);

  const toggleRevealFlag = (subId: string) => {
    setRevealedFlags((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  return (
    <div className="space-y-10">
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

      {/* Floating Toast Notification */}
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

      {/* Pro Membership Modal */}
      <ProMembershipModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={(t) => setToast(t)}
      />

      {/* 1. Hero Identity & Rank Progression Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-500/30 dark:border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/3 -bottom-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* User Avatar & Level Ring */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-0.5 shadow-lg">
                <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-black text-3xl text-indigo-300 font-mono">
                  {user?.username?.charAt(0).toUpperCase() || 'T'}
                </div>
              </div>
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white border border-indigo-400 font-mono shadow-sm">
                LVL {rankInfo.level}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
                  {user?.username || 'trainee1'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 dark:bg-indigo-500/20 text-white dark:text-indigo-300 border border-white/20 dark:border-indigo-400/30 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {rankInfo.title}
                </span>
                {hasProAccess ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> PRO 💎
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 dark:bg-slate-800 text-white/80 dark:text-slate-400 border border-white/20 dark:border-slate-700">
                    FREE TIER
                  </span>
                )}
              </div>

              <p className="text-xs text-indigo-100 dark:text-slate-400 flex items-center gap-2">
                <span>
                  Rank Position: <strong className="text-amber-300 dark:text-amber-400 font-mono">{myRank}</strong>
                  {isRanked ? ` of ${leaderboard.length} Global Trainees` : ''}
                </span>
                {isPodium && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-300 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Top 3 Tournament Podium
                    </span>
                  </>
                )}
              </p>

              {/* XP Meter to Next Level */}
              <div className="pt-2 w-full sm:w-80">
                <div className="flex justify-between text-[11px] font-mono text-indigo-100 dark:text-slate-300 mb-1">
                  <span>Progress to <strong>{rankInfo.nextLevel}</strong></span>
                  <span className="text-cyan-300 dark:text-cyan-400 font-bold">{totalScore} / {rankInfo.targetPoints} PTS</span>
                </div>
                <div className="h-2 w-full bg-indigo-950/60 dark:bg-slate-800 rounded-full overflow-hidden border border-indigo-400/30 dark:border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 dark:from-indigo-500 dark:via-purple-500 dark:to-cyan-400 rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Live Tournament Status */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
            <div className="p-3 bg-white/10 dark:bg-slate-800/80 backdrop-blur-md rounded-xl border border-white/15 dark:border-slate-700/80 flex items-center gap-3">
              {session ? (
                <>
                  <div className={`w-3 h-3 rounded-full ${!session.is_active ? 'bg-amber-500' : 'bg-emerald-400 animate-pulse'}`}></div>
                  <div className="text-xs">
                    <span className="text-indigo-100 dark:text-slate-400 font-medium block text-[10px] uppercase tracking-wider">Tournament Live Clock</span>
                    <div className="font-mono text-xs font-bold text-cyan-300">
                      <CountdownTimer initialSeconds={session.remaining_seconds} isPaused={!session.is_active} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center w-full">
                  <span className="text-indigo-100 dark:text-slate-400 font-medium block text-[10px] uppercase tracking-wider mb-2">Tournament Not Started</span>
                  <Button 
                    onClick={handleStartTournament} 
                    disabled={isStartingTournament} 
                    variant="primary" 
                    size="sm"
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold border-none"
                  >
                    {isStartingTournament ? 'Starting...' : 'Start Tournament Now'}
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link to="/scenarios" className="flex-1 sm:flex-none">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />} className="w-full">
                  Explore CTF Labs
                </Button>
              </Link>
              <Link to="/leaderboard" className="flex-1 sm:flex-none">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<Trophy className="w-3.5 h-3.5 text-amber-400" />}
                  className="w-full !bg-slate-800/90 hover:!bg-slate-700 !text-white !border !border-slate-600 shadow-md font-bold"
                >
                  Leaderboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Performance KPI Cards (4 Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Points */}
        <Card className="card-saas border border-slate-200 dark:border-[rgba(255,255,255,0.07)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Accumulated Score</p>
              <div className="text-3xl font-black text-indigo-700 dark:text-indigo-400 font-mono mt-1">
                {totalScore} <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">PTS</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Active Points Accrued
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-[#121829] dark:text-indigo-400 dark:border-indigo-500/30 flex items-center justify-center shadow-2xs">
              <Flag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Global Rank */}
        <Card className="card-saas border border-slate-200 dark:border-[rgba(255,255,255,0.07)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tournament Rank</p>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {myRank}
              </div>
              <p className="text-[11px] font-bold mt-1 flex items-center gap-1">
                {isPodium ? (
                  <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Top 3 Winner Podium
                  </span>
                ) : isRanked ? (
                  <span className="text-slate-600 dark:text-slate-400">
                    Ranked #{myRankEntry?.rank} Globally
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 font-normal">
                    Solve labs to qualify for rank
                  </span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-[#231A0F] dark:text-amber-400 dark:border-amber-500/30 flex items-center justify-center shadow-2xs">
              <Trophy className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Flags Solved */}
        <Card className="card-saas border border-slate-200 dark:border-[rgba(255,255,255,0.07)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Captured Flags</p>
              <div className="text-3xl font-black text-slate-900 dark:text-white font-mono mt-1">
                {solvedCount} <span className="text-sm font-bold text-slate-500 dark:text-slate-400">/ {totalScenarios}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                {solvedCount} Scenarios Completed
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-[#121829] dark:text-indigo-400 dark:border-indigo-500/30 flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Accuracy & Attempt Precision */}
        <Card className="card-saas border border-slate-200 dark:border-[rgba(255,255,255,0.07)]">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attempt Precision</p>
              <div className="text-3xl font-black text-cyan-800 dark:text-cyan-400 font-mono mt-1">
                {accuracyRate}%
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                {correctSubmissions} Solves • <span className="text-rose-600 dark:text-rose-400 font-bold">{failedSubmissions} Fails</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-[#0D2026] dark:text-cyan-400 dark:border-cyan-500/30 flex items-center justify-center shadow-2xs">
              <Target className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Meaningful Visual Analytics (Enterprise Domain Velocity Matrix & Precision Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL 1: Enterprise Domain Velocity & Skill Mastery Matrix */}
        <Card className="card-saas lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Cyber Domain Points & Track Mastery
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time points accrued vs available target across all offensive security domains.
              </p>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              {domainMasteryData.length} Active Cyber Domains
            </span>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {domainMasteryData.map((d) => {
                const percent = Math.min(100, Math.round((d.earned / (d.total || 100)) * 100));
                const IconComponent = d.icon;
                const isComplete = d.earned > 0 && d.earned >= d.total;
                const isStarted = d.earned > 0;

                return (
                  <div
                    key={d.domain}
                    className="p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-3 bg-slate-50 border-slate-200 dark:bg-[#0E131F] dark:border-[rgba(255,255,255,0.07)] hover:border-slate-300 dark:hover:border-indigo-500/30"
                  >
                    {/* Header: Icon, Name & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shadow-2xs border"
                          style={{
                            backgroundColor: `${d.color}18`,
                            borderColor: `${d.color}35`,
                            color: d.color,
                          }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none">{d.domain}</h3>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
                            {d.solvedChallenges} of {d.totalChallenges || 1} Solved
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isComplete ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-[#151C2C] dark:text-indigo-300 dark:border-indigo-500/30">
                          100% SOLVED
                        </span>
                      ) : isStarted ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-[#151C2C] dark:text-indigo-300 dark:border-indigo-500/30">
                          {percent}% PROGRESS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#121824] dark:text-slate-400 dark:border-[rgba(255,255,255,0.07)]">
                          OPEN
                        </span>
                      )}
                    </div>

                    {/* Progress Bar & Score Numbers */}
                    <div className="space-y-1.5 pt-1">
                      <div className="h-2 w-full bg-slate-200 dark:bg-[#161D2E] rounded-full overflow-hidden border border-slate-300/40 dark:border-slate-700/60">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: isComplete ? '#6366F1' : isStarted ? d.color : '#94A3B8',
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-sans font-medium">Points Won</span>
                        <div className="space-x-1">
                          <strong className="text-slate-900 dark:text-white font-bold text-xs">{d.earned}</strong>
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">/ {d.total} PTS</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clear Track Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Active Track Experience: <strong className="text-slate-900 dark:text-white">{domainMasteryData.filter(d => d.earned > 0).length} of {domainMasteryData.length} Completed</strong></span>
              </span>
              <Link to="/scenarios" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold flex items-center gap-1">
                Explore All CTF Labs <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* PANEL 2: Flag Submission Accuracy (Interactive Ring & Enterprise Telemetry) */}
        <Card className="card-saas lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <PieChartIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Submission Accuracy & Telemetry
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Precision metrics across correct flags vs failed attempts.
            </p>
          </CardHeader>

          <CardContent className="p-5 flex-1 flex flex-col items-center justify-between gap-4">
            {totalAttemptsCount === 0 ? (
              <div className="w-full h-48 relative flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full border-2 border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-center text-center p-2">
                    <Target className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-1" />
                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">0%</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Ready to Calibrate</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-48 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accuracyPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={54}
                      outerRadius={74}
                      paddingAngle={4}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(null)}
                      cursor="pointer"
                    >
                      {accuracyPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="transparent"
                          strokeWidth={3}
                          className="transition-all duration-200 hover:opacity-90"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Centered Dynamic Interactive Display (Zero Overlap) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  {activePieIndex === 0 ? (
                    <div className="text-center animate-fade-in">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono leading-none block">
                        {correctSubmissions}
                      </span>
                      <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mt-1">
                        CORRECT SOLVES
                      </span>
                    </div>
                  ) : activePieIndex === 1 ? (
                    <div className="text-center animate-fade-in">
                      <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono leading-none block">
                        {failedSubmissions}
                      </span>
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider block mt-1">
                        FAILED TRIES
                      </span>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-3xl font-black text-slate-900 dark:text-white font-mono leading-none block">
                        {accuracyRate}%
                      </span>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mt-1">
                        PRECISION
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* High-Density Enterprise Telemetry Grid */}
            <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 dark:bg-[#101522] dark:text-slate-200 dark:border-[rgba(255,255,255,0.07)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Pass Rate</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{accuracyRate}%</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">{correctSubmissions} Solves</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 dark:bg-[#101522] dark:text-slate-200 dark:border-[rgba(255,255,255,0.07)] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Fail Margin</span>
                  <XCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                </div>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{totalAttemptsCount > 0 ? 100 - accuracyRate : 0}%</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{failedSubmissions} Fails</span>
                </div>
              </div>

              <div className="col-span-2 p-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-[#101522] dark:border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Solve Velocity Ratio</span>
                </span>
                <strong className="font-mono text-slate-900 dark:text-white font-bold">
                  {totalAttemptsCount > 0 && correctSubmissions > 0 ? (totalAttemptsCount / correctSubmissions).toFixed(1) : '1.0'} Attempts / Lab
                </strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Challenge Difficulty Progression Matrix (4 High-Contrast Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Challenge Difficulty Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track your completion rate and score earned across Easy, Medium, Hard, and Insane challenges.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {difficultyStats.map((diff) => (
            <Card key={diff.level} className="card-saas border-2 border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-black border font-mono ${diff.badgeClass}`}>
                  {diff.level}
                </span>
                <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  {diff.solved} / {diff.total} Solved
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div className={`h-full ${diff.barColor} rounded-full transition-all`} style={{ width: `${diff.percent}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span>{diff.percent}% Completed</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold">{diff.earnedPoints} / {diff.totalPoints} PTS</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Cyber Badges & Achievements System */}
      <Card className="card-saas">
        <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Award className="w-4 h-4 text-amber-500" />
              OffensiveGrid Combat Badges & Achievements
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Earn specialized military and offensive security badges as you solve lab challenges.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
            {badgesList.filter((b) => b.unlocked).length} / {badgesList.length} Unlocked
          </span>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {badgesList.map((badge) => (
              <div
                key={badge.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center text-center justify-between gap-2.5 ${
                  badge.unlocked
                    ? `${badge.bg} dark:bg-slate-800/80 dark:border-indigo-800/60 shadow-xs hover:-translate-y-1`
                    : 'bg-slate-50/70 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-2xs border border-slate-100 dark:border-slate-700">
                  {badge.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{badge.title}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-1 line-clamp-2">
                    {badge.desc}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    badge.unlocked
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold'
                  }`}
                >
                  {badge.unlocked ? '✓ UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 6. Complete Submission Logs & Failed Attempts Analysis Table */}
      <Card className="card-saas">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Submission Attempt Telemetry & Failure Audit
            </CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review every flag submission, analyze failed attempts, and inspect payload history.
            </p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setSubmissionFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  submissionFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => setSubmissionFilter('CORRECT')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  submissionFilter === 'CORRECT'
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" /> Solved ({correctSubmissions})
              </button>
              <button
                onClick={() => setSubmissionFilter('FAILED')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  submissionFilter === 'FAILED'
                    ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                }`}
              >
                <XCircle className="w-3 h-3" /> Failed ({failedSubmissions})
              </button>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-48">
              <Input
                placeholder="Search logs..."
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                className="!py-1 text-xs dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Shield className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No submission records found</p>
              <p className="text-[11px] text-slate-400">Attempts made in CTF labs will stream here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 border-y border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-300 font-bold font-mono uppercase text-[10px] shadow-xs">
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Scenario Challenge</th>
                    <th className="py-3.5 px-4">Payload Security</th>
                    <th className="py-3.5 px-4">Attempt #</th>
                    <th className="py-3.5 px-4">Awarded Score</th>
                    <th className="py-3.5 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSubmissions.map((sub) => {
                    const isRevealed = revealedFlags.has(sub.id);
                    const flagPreview = isRevealed
                      ? sub.submitted_flag
                      : sub.submitted_flag.length > 8
                      ? `${sub.submitted_flag.substring(0, 7)}••••••••`
                      : '••••••••';

                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/90 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {sub.is_correct ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-[#062817] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              CORRECT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#161D2E] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                              INCORRECT
                            </span>
                          )}
                        </td>

                        {/* Scenario Name & Difficulty */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{sub.scenario_title}</span>
                            {sub.scenario_difficulty && (
                              <Badge difficulty={sub.scenario_difficulty as any} className="text-[9px] py-0 px-1.5 leading-none" />
                            )}
                          </div>
                        </td>

                        {/* Secure Masked Payload (Anti-Cheat & Anti-Leak Protection) */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.07)]">
                            <Lock className={`w-3 h-3 ${sub.is_correct ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <span className="font-mono tracking-wider">••••••••••••••••</span>
                            <span className={`text-[10px] font-bold uppercase ${sub.is_correct ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
                              {sub.is_correct ? '(Verified)' : '(Rejected)'}
                            </span>
                          </div>
                        </td>

                        {/* Attempt Number */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          Attempt #{sub.attempt_number}
                        </td>

                        {/* Awarded Score */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {sub.is_correct ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-black">+{sub.awarded_points} PTS</span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">0 PTS</span>
                          )}
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 text-right text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {new Date(sub.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
