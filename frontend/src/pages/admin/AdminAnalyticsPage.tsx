import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  Trophy,
  Activity,
  Users,
  Target,
  ShieldCheck,
  AlertTriangle,
  Award,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Flame,
  Medal,
  Crown,
  Zap,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { leaderboardService, competitionService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const COLORS = ['#10B981', '#F43F5E', '#6366F1', '#06B6D4', '#F59E0B', '#8B5CF6'];
const STUDENT_LINE_COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F43F5E'];

export const AdminAnalyticsPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Scalability Controls for 20-30+ Students
  const [barChartLimit, setBarChartLimit] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchTelemetry = async (compSlug?: string) => {
    try {
      const data = await leaderboardService.getStudentTelemetry(compSlug || undefined);
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to load student telemetry:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const comps = await competitionService.getCompetitions();
        setCompetitions(Array.isArray(comps) ? comps : []);
      } catch (e) {
        console.error('Failed to load competitions:', e);
      }
      await fetchTelemetry(selectedComp);
    };
    init();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTelemetry(selectedComp);
  };

  const handleCompChange = (slug: string) => {
    setSelectedComp(slug);
    setIsLoading(true);
    fetchTelemetry(slug);
  };

  const studentsList = telemetry?.students || [];
  const top3Podium = telemetry?.top_3_podium || [];
  const globalStats = telemetry?.global_stats || {
    total_students: 0,
    active_trainees: 0,
    total_solves: 0,
    total_fails: 0,
    total_attempts: 0,
    global_accuracy_rate: 0,
  };
  const raceTimeline = telemetry?.race_timeline || [];
  const topUsernames = telemetry?.top_student_usernames || [];

  // Filtered Students for the table
  const filteredStudents = studentsList.filter((s: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.username?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.full_name?.toLowerCase().includes(q)
    );
  });

  // Table Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Dynamic Chart Data: Solves vs Fails per Student (Supports 10, 20, 30, or all students)
  const displayedStudentsForBarChart =
    barChartLimit === -1 ? studentsList : studentsList.slice(0, barChartLimit);

  const solvesVsFailsData = displayedStudentsForBarChart.map((s: any) => ({
    name: s.username,
    solves: s.solves,
    fails: s.fails,
    accuracy: s.accuracy_rate,
    score: s.total_score,
  }));

  // Calculate dynamic bar chart width to ensure names never overlap even with 30 students
  const minBarChartWidth = Math.max(550, solvesVsFailsData.length * 60);

  // Global Solves vs Fails Donut
  const platformDonutData = [
    { name: 'Successful Solves', value: globalStats.total_solves || 0 },
    { name: 'Failed Attempts', value: globalStats.total_fails || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Student Live Telemetry & Tournament Race Control
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-2xs shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              LIVE FEED
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-3xl">
            Real-time intelligence on trainee scenario captures, failure rates, acceleration velocity, and automated podium rankings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
          {/* Tournament Scope Filter */}
          <select
            value={selectedComp}
            onChange={(e) => handleCompChange(e.target.value)}
            className="h-10 text-xs font-bold bg-white dark:bg-[#111726] border border-slate-300 dark:border-[rgba(255,255,255,0.12)] rounded-xl px-3.5 py-0 text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer w-full sm:w-auto min-w-[220px]"
          >
            <option value="">Global Platform (All Challenges)</option>
            {competitions.map((c: any) => (
              <option key={c.id} value={c.slug}>
                🏆 {c.title}
              </option>
            ))}
          </select>

          {/* Sync Live Stats Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap shadow-2xs active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Live Stats</span>
          </button>
        </div>
      </div>

      {/* 🏆 AUTOMATED TOP-3 WINNERS PODIUM WITH MEDALS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 uppercase tracking-wider">
            <Crown className="w-4 h-4 text-amber-500" />
            Live Top-3 Final Podium & Winner Determination
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Automatically evaluated by points, solve speed, and tie-breakers for prize awards.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 🥇 1st Place - Gold Champion */}
          {top3Podium[0] ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-white dark:to-[rgba(17,24,39,0.70)] border-2 border-amber-400 dark:border-amber-500/50 p-5 shadow-md space-y-3">
              <div className="absolute top-0 right-0 bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider flex items-center gap-1 shadow-xs">
                <Crown className="w-3 h-3 text-slate-950" />
                1st Place Champion
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-200 text-slate-950 flex items-center justify-center text-2xl shadow-md font-bold">
                  🥇
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    {top3Podium[0].username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{top3Podium[0].full_name || 'Trainee'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 dark:bg-[rgba(12,16,23,0.70)] backdrop-blur-xs border border-amber-200 dark:border-amber-700/40 rounded-xl text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Score</span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono">
                    {top3Podium[0].total_score}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Solves</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {top3Podium[0].solves}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Fails</span>
                  <span className="text-lg font-black text-rose-500 dark:text-rose-400 font-mono">
                    {top3Podium[0].fails}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Accuracy: <strong className="text-emerald-700 dark:text-emerald-400">{top3Podium[0].accuracy_rate}%</strong></span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/40">
                  🎁 Prize Eligible
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center">
              No 1st place data yet
            </div>
          )}

          {/* 🥈 2nd Place - Silver Runner-Up */}
          {top3Podium[1] ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-300/20 via-slate-100/10 to-white dark:to-[rgba(17,24,39,0.70)] border-2 border-slate-300 dark:border-slate-700 p-5 shadow-sm space-y-3">
              <div className="absolute top-0 right-0 bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-xs">
                2nd Place Runner-Up
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-300 to-slate-100 dark:from-slate-700 dark:to-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center text-2xl shadow-md font-bold">
                  🥈
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    {top3Podium[1].username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{top3Podium[1].full_name || 'Trainee'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 dark:bg-[rgba(12,16,23,0.70)] backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-xl text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Score</span>
                  <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                    {top3Podium[1].total_score}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Solves</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {top3Podium[1].solves}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Fails</span>
                  <span className="text-lg font-black text-rose-500 dark:text-rose-400 font-mono">
                    {top3Podium[1].fails}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Accuracy: <strong className="text-slate-800 dark:text-slate-200">{top3Podium[1].accuracy_rate}%</strong></span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                  🥈 Silver Finalist
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center">
              No 2nd place data yet
            </div>
          )}

          {/* 🥉 3rd Place - Bronze Finalist */}
          {top3Podium[2] ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-amber-700/15 via-amber-700/5 to-white dark:to-[rgba(17,24,39,0.70)] border-2 border-amber-600/60 dark:border-amber-700/50 p-5 shadow-sm space-y-3">
              <div className="absolute top-0 right-0 bg-amber-700 text-amber-50 text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-xs">
                3rd Place Bronze
              </div>

              <div className="flex items-center gap-3 pt-1">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center text-2xl shadow-md font-bold">
                  🥉
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
                    {top3Podium[2].username}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{top3Podium[2].full_name || 'Trainee'}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-white/80 dark:bg-[rgba(12,16,23,0.70)] backdrop-blur-xs border border-amber-200/60 dark:border-amber-800/40 rounded-xl text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Score</span>
                  <span className="text-lg font-black text-amber-900 dark:text-amber-300 font-mono">
                    {top3Podium[2].total_score}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Solves</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {top3Podium[2].solves}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Fails</span>
                  <span className="text-lg font-black text-rose-500 dark:text-rose-400 font-mono">
                    {top3Podium[2].fails}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Accuracy: <strong className="text-amber-900 dark:text-amber-300">{top3Podium[2].accuracy_rate}%</strong></span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800/40">
                  🥉 Bronze Finalist
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs flex items-center justify-center">
              No 3rd place data yet
            </div>
          )}
        </div>
      </div>

      {/* KPI Telemetry Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="card-saas">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Registered Trainees</p>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {globalStats.total_students}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Active Competitors</p>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                {globalStats.active_trainees}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Flags Captured (Solves)</p>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {globalStats.total_solves}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Failed Flag Attempts</p>
              <div className="text-2xl font-black text-rose-500 dark:text-rose-400 font-mono mt-0.5">
                {globalStats.total_fails}
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-saas">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Defense Solve Rate</p>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                {globalStats.global_accuracy_rate}%
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Student Solves vs Fails Comparison Bar Chart with Scalability Controls */}
        <div className="lg:col-span-7">
          <Card className="card-saas h-full flex flex-col justify-between">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Student Solves vs Failed Attempts
                </CardTitle>
                <span className="text-[11px] text-slate-400">
                  Showing {displayedStudentsForBarChart.length} of {studentsList.length} trainees
                </span>
              </div>

              {/* Trainee Count Selector for 20-30+ Students */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[rgba(17,24,39,0.80)] p-0.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-[rgba(148,163,184,0.10)]">
                <button
                  type="button"
                  onClick={() => setBarChartLimit(10)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    barChartLimit === 10 ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Top 10
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartLimit(20)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    barChartLimit === 20 ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Top 20
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartLimit(30)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    barChartLimit === 30 ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Top 30
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartLimit(-1)}
                  className={`px-2 py-1 rounded-md transition-all ${
                    barChartLimit === -1 ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Horizontal Scrollable Container to prevent squishing even with 30 students */}
              <div className="w-full overflow-x-auto pb-2">
                <div style={{ width: `${minBarChartWidth}px`, height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={solvesVsFailsData} margin={{ top: 15, right: 20, left: -20, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="0 0" stroke="transparent" vertical={false} horizontal={false} />
                      <XAxis
                        dataKey="name"
                        stroke="#64748B"
                        fontSize={11}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={45}
                      />
                      <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        cursor={false}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '12px',
                          border: '1px solid #334155',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        }}
                        itemStyle={{ color: '#FFFFFF', fontWeight: 700 }}
                        labelStyle={{ color: '#94A3B8', fontWeight: 600 }}
                        formatter={(value: any, name: any) => [
                          <span style={{ color: name === 'solves' ? '#34D399' : '#F87171', fontWeight: 'bold' }}>
                            {value} {name === 'solves' ? 'Scenarios Solved ✅' : 'Failed Attempts ❌'}
                          </span>,
                          name === 'solves' ? 'Solves' : 'Failures',
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                        formatter={(value) => (value === 'solves' ? 'Scenarios Solved (✅)' : 'Failed Attempts (❌)')}
                      />
                      <Bar dataKey="solves" fill="#10B981" radius={[4, 4, 0, 0]} name="solves" barSize={16} />
                      <Bar dataKey="fails" fill="#F43F5E" radius={[4, 4, 0, 0]} name="fails" barSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart 2: Platform Accuracy Donut - Clean Non-Overlapping Architecture */}
        <div className="lg:col-span-5">
          <Card className="card-saas h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                Global Platform Accuracy Ratio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<></>} cursor={false} />
                    <Pie
                      data={platformDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#F43F5E" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge - Always Clean, Crisp & Never Obscured */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                  <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {globalStats.global_accuracy_rate}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Solve Rate</span>
                </div>
              </div>

              {/* High-Readability Breakdown Cards (Total Solved & Total Failed with Percentages) */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-[#092218] border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider block">Total Solved</span>
                      <strong className="text-emerald-950 dark:text-emerald-200 text-sm font-mono font-black">{globalStats.total_solves} Flags</strong>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40">
                    {globalStats.global_accuracy_rate}%
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-[#250F14] border border-rose-200 dark:border-rose-500/30 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                    <div>
                      <span className="text-[10px] text-rose-800 dark:text-rose-400 font-bold uppercase tracking-wider block">Total Failed</span>
                      <strong className="text-rose-950 dark:text-rose-200 text-sm font-mono font-black">{globalStats.total_fails} Attempts</strong>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-rose-800/40">
                    {((globalStats.total_fails / Math.max(1, (globalStats.total_solves + globalStats.total_fails))) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart 3: Live Student Velocity & Race Trajectory Multi-Line Chart */}
      <Card className="card-saas">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Live Competitor Velocity Race Track (Score Progression Over Time)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks points acceleration of top trainees — easily identify who is pulling ahead vs lagging behind.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
            Top {topUsernames.length} Trainees Competing
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={raceTimeline} margin={{ top: 15, right: 30, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  }}
                  itemStyle={{ color: '#FFFFFF', fontWeight: 700 }}
                  labelStyle={{ color: '#94A3B8', fontWeight: 600 }}
                  formatter={(value: any, name: any) => [`${value} Points`, `@${name}`]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {topUsernames.map((username: string, idx: number) => (
                  <Line
                    key={username}
                    type="monotone"
                    dataKey={username}
                    stroke={STUDENT_LINE_COLORS[idx % STUDENT_LINE_COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name={username}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Student Telemetry Table with Pagination for 30+ Students */}
      <Card className="card-saas">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Live Trainee Progress & Accuracy Telemetry Roster
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {paginatedStudents.length} of {filteredStudents.length} trainees (Total {studentsList.length} registered).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trainee name, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] rounded-lg text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs bg-white dark:bg-[#111726] border border-slate-300 dark:border-[rgba(255,255,255,0.12)] rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={30}>30 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Trainee Handle</th>
                  <th className="py-3.5 px-4 text-center">Solved (✅)</th>
                  <th className="py-3.5 px-4 text-center">Failed (❌)</th>
                  <th className="py-3.5 px-4 text-center">Attempts</th>
                  <th className="py-3.5 px-4">Accuracy Rate</th>
                  <th className="py-3.5 px-4 text-right">Total Score</th>
                  <th className="py-3.5 px-4 text-center">Race Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.05)] font-sans">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((s: any) => (
                    <tr key={s.user_id} className="hover:bg-slate-50/80 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                      {/* Rank with Medal */}
                      <td className="py-3 px-4 font-mono font-bold">
                        {s.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500 text-sm font-black">
                            🥇 #1
                          </span>
                        ) : s.rank === 2 ? (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-sm font-black">
                            🥈 #2
                          </span>
                        ) : s.rank === 3 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-sm font-black">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-400">#{s.rank}</span>
                        )}
                      </td>

                      {/* Trainee Details */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-[11px] shrink-0 border border-transparent dark:border-indigo-800/40">
                            {s.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block leading-tight">
                              {s.username}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                              {s.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Solves */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          {s.solves} Solved
                        </span>
                      </td>

                      {/* Fails */}
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                          s.fails > 0
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}>
                          {s.fails} Fails
                        </span>
                      </td>

                      {/* Total Attempts */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                        {s.total_attempts}
                      </td>

                      {/* Accuracy Bar */}
                      <td className="py-3 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{s.accuracy_rate}%</span>
                            <span className="text-slate-400 dark:text-slate-500">{s.solves}/{s.total_attempts}</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                s.accuracy_rate >= 70
                                  ? 'bg-emerald-500'
                                  : s.accuracy_rate >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${s.accuracy_rate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">
                          {s.total_score} pts
                        </span>
                      </td>

                      {/* Race Status Badge - Modern High-Contrast Cyber Badges */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-2xs whitespace-nowrap ${
                            s.status === 'LEADING'
                              ? 'bg-amber-50 dark:bg-[#1C1508] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30'
                              : s.status === 'ASCENDING'
                              ? 'bg-emerald-50 dark:bg-[#092218] text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30'
                              : s.status === 'STRUGGLING'
                              ? 'bg-rose-50 dark:bg-[#250F14] text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30'
                              : s.status === 'INACTIVE'
                              ? 'bg-slate-100 dark:bg-[#121724] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[rgba(255,255,255,0.08)]'
                              : 'bg-indigo-50 dark:bg-[#12162B] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                          }`}
                        >
                          {s.status_label}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No student records found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-[rgba(148,163,184,0.08)] bg-slate-50/50 dark:bg-[rgba(17,24,39,0.50)]">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="!py-1 !px-2.5 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="!py-1 !px-2.5 text-xs"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
