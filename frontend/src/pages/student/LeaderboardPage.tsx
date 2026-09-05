import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Clock, Zap, Users, RefreshCw, Crown, Shield, Search, Flame, Info, Timer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { leaderboardService, tournamentService } from '../../services/api';
import { LeaderboardEntry } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { useTournamentSync } from '../../hooks/useTournamentSync';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const [data, sessionData] = await Promise.allSettled([
        leaderboardService.getGlobalLeaderboard(),
        tournamentService.getMySession(),
      ]);
      if (data.status === 'fulfilled') {
        setRankings(Array.isArray(data.value) ? data.value : []);
      }
      if (sessionData.status === 'fulfilled') {
        setSession(sessionData.value);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSession = async () => {
    try {
      const sessionData = await tournamentService.getMySession();
      setSession(sessionData);
    } catch (err) {
      setSession(null);
    }
  };

  useTournamentSync(() => {
    fetchLeaderboard();
  });

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredRankings = rankings.filter((item) =>
    searchQuery === '' ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.full_name && item.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const topThree = rankings.slice(0, 3);

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'In Progress';
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-500/30 dark:border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute -left-10 -top-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-10 -bottom-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold font-mono uppercase tracking-wider shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Real-Time Scoring Stream
            </div>
            {session && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-indigo-950/40 border border-white/30 dark:border-indigo-800/40 text-white dark:text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider shadow-sm">
                <Timer className="w-3.5 h-3.5" />
                <CountdownTimer initialSeconds={session.remaining_seconds} isPaused={!session.is_active} />
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Global Tournament Scoreboard
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 dark:text-slate-400 mt-1 max-w-2xl">
            Real-time cyber tournament rankings. Automated tie-breaking gives rank priority to the fastest solver.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-white/30 dark:border-[rgba(255,255,255,0.12)] bg-white/10 dark:bg-[#111622] text-white hover:bg-white/20 dark:hover:bg-[#182030] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 backdrop-blur-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Updating...' : 'Refresh Standings'}</span>
          </button>
        </div>
      </div>

      {/* 💡 Tie-Breaking Rule Explainer Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-[rgba(17,24,39,0.70)] border border-indigo-200/90 dark:border-[rgba(148,163,184,0.10)] text-xs text-indigo-950 dark:text-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 font-medium">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-indigo-900 dark:text-white">Official Tie-Breaking Protocol: </span>
            <span>
              Jab competitors ke total points same hote hain, to <strong>Fastest Solve Speed (Earliest Timestamp)</strong> ke tehat jis ne score pehle achieve kiya wo higher rank par hota hai.
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300 shrink-0">
          <Timer className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Server-Authoritative Timing
        </span>
      </div>

      {/* 🏆 Tournament Olympic-Style Top 3 Winner Podium */}
      {rankings.length >= 3 && (
        <div className="relative pt-6 pb-2">
          {/* Subtle Ambient Glow Behind Podium */}
          <div className="absolute left-1/2 top-14 -translate-x-1/2 w-3/4 h-56 bg-gradient-to-r from-slate-200 via-amber-200/40 to-slate-200 dark:from-indigo-950/20 dark:via-amber-950/20 dark:to-indigo-950/20 rounded-full blur-3xl -z-10 pointer-events-none opacity-60"></div>
          <div>
            {/* Podium Header with Clear Visible Divider Line & Enterprise Badging */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8 pb-3.5 border-b-2 border-slate-300 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center shadow-2xs shrink-0">
                  <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Tournament Winner Podium (Top 3 Elite Trainees)
                  </h2>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900/80 px-3 py-1 rounded-full border border-slate-300 dark:border-slate-800 shadow-2xs self-start sm:self-auto">
                <span>Live Tie-Breaker:</span>
                <strong className="text-slate-900 dark:text-slate-200 font-bold">Fastest Solve Timestamp</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-2">
              {/* 🥈 2ND PLACE (SILVER RUNNER UP - LEFT) */}
              <div className="order-2 md:order-1 flex flex-col justify-end">
                <div className="group bg-gradient-to-b from-slate-50 via-white to-slate-100/60 dark:from-[#0E131F] dark:via-[#0C1017] dark:to-[#0A0E18] rounded-2xl border-2 border-slate-300 dark:border-[rgba(255,255,255,0.08)] p-6 text-center relative shadow-md hover:shadow-[0_20px_40px_rgba(99,102,241,0.14)] hover:border-slate-400 dark:hover:border-slate-400/80 hover:ring-2 hover:ring-slate-400/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  {/* Silver Medal Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-200 dark:bg-[#151C2C] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[rgba(255,255,255,0.08)] uppercase tracking-wider mb-4 shadow-2xs">
                    <span>🥈 #2 1ST RUNNER UP</span>
                  </div>

                  {/* Avatar with Silver Ring */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-400 to-slate-200 p-0.5 mx-auto mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xl text-slate-700 dark:text-slate-200 font-mono">
                      {topThree[1].username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center justify-center gap-1.5">
                      <span>{topThree[1].username}</span>
                      {topThree[1].username === user?.username && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-600 text-white font-mono leading-none">
                          YOU
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {topThree[1].solved_count} Challenges Solved
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Final solve: {formatTimestamp(topThree[1].last_solve_time)}
                    </p>
                  </div>

                  {/* Points Pill */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="text-2xl font-mono font-black text-slate-800 dark:text-slate-200">
                      {topThree[1].total_score} <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">PTS</span>
                    </div>
                  </div>

                  {/* Pedestal Base */}
                  <div className="mt-4 py-2 px-3 bg-slate-200/90 dark:bg-slate-800 rounded-xl text-[11px] font-mono font-extrabold text-slate-700 dark:text-slate-300 tracking-wider group-hover:bg-slate-300 dark:group-hover:bg-[#1E2738] transition-colors">
                    2ND PLACE PEDESTAL
                  </div>
                </div>
              </div>

              {/* 🥇 1ST PLACE (GOLD CHAMPION - CENTER ELEVATED) */}
              <div className="order-1 md:order-2 md:-mt-2">
                <div className="group bg-gradient-to-b from-amber-50 via-white to-amber-100/60 dark:from-[#18140B] dark:via-[#0E1017] dark:to-[#18140B] rounded-3xl border-2 border-amber-400 dark:border-amber-500/50 p-7 text-center relative shadow-xl ring-4 ring-amber-400/20 hover:ring-amber-400/40 hover:border-amber-400 dark:hover:border-amber-400 hover:shadow-[0_25px_50px_rgba(245,158,11,0.22)] transition-all duration-300 transform hover:-translate-y-2.5 cursor-pointer">
                  {/* Crown & Gold Champion Banner */}
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-300 dark:border-amber-400 uppercase tracking-wider mb-4 shadow-md group-hover:shadow-lg transition-all">
                    <Crown className="w-4 h-4 text-amber-200 fill-amber-200" />
                    <span>👑 1ST PLACE CHAMPION</span>
                  </div>

                  {/* Champion Trophy Avatar Ring */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <div className="w-full h-full bg-amber-50 dark:bg-slate-900 rounded-full flex items-center justify-center font-black text-2xl text-amber-700 dark:text-amber-400 font-mono">
                      <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-black text-slate-900 dark:text-white text-xl flex items-center justify-center gap-2">
                      <span>{topThree[0].username}</span>
                      {topThree[0].username === user?.username && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold bg-indigo-600 text-white font-mono leading-none">
                          YOU
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400">
                      🔥 {topThree[0].solved_count} Challenges Solved (Fastest Speed)
                    </p>
                    <p className="text-[11px] font-mono font-semibold text-amber-900 dark:text-amber-300">
                      ⚡ Final solve: {formatTimestamp(topThree[0].last_solve_time)}
                    </p>
                  </div>

                  {/* Gold Score Display */}
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-amber-600 dark:text-amber-400">
                      {topThree[0].total_score} <span className="text-sm font-sans font-bold text-slate-500 dark:text-slate-400">PTS</span>
                    </div>
                  </div>

                  {/* Pedestal Base */}
                  <div className="mt-4 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl text-xs font-mono font-black text-white tracking-widest shadow-sm group-hover:from-amber-400 group-hover:to-amber-500 transition-all">
                    ★ GRAND CHAMPION PODIUM ★
                  </div>
                </div>
              </div>

              {/* 🥉 3RD PLACE (BRONZE 2ND RUNNER UP - RIGHT) */}
              <div className="order-3 flex flex-col justify-end">
                <div className="group bg-gradient-to-b from-orange-50 via-white to-amber-100/50 dark:from-[#16100A] dark:via-[#0C1017] dark:to-[#16100A] rounded-2xl border-2 border-amber-600/40 dark:border-amber-700/40 p-6 text-center relative shadow-md hover:shadow-[0_20px_40px_rgba(217,119,6,0.14)] hover:border-amber-600 dark:hover:border-amber-600/80 hover:ring-2 hover:ring-amber-600/20 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  {/* Bronze Medal Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-[#1C140A] text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 uppercase tracking-wider mb-4 shadow-2xs">
                    <span>🥉 #3 2ND RUNNER UP</span>
                  </div>

                  {/* Avatar with Bronze Ring */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-700 to-amber-500 p-0.5 mx-auto mb-3 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-full flex items-center justify-center font-black text-xl text-amber-800 dark:text-amber-300 font-mono">
                      {topThree[2].username.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center justify-center gap-1.5">
                      <span>{topThree[2].username}</span>
                      {topThree[2].username === user?.username && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-600 text-white font-mono leading-none">
                          YOU
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {topThree[2].solved_count} Challenges Solved
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      Final solve: {formatTimestamp(topThree[2].last_solve_time)}
                    </p>
                  </div>

                  {/* Points Pill */}
                  <div className="mt-4 pt-4 border-t border-amber-200 dark:border-amber-800">
                    <div className="text-2xl font-mono font-black text-amber-800 dark:text-amber-400">
                      {topThree[2].total_score} <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">PTS</span>
                    </div>
                  </div>

                  {/* Pedestal Base */}
                  <div className="mt-4 py-2 px-3 bg-amber-200/90 dark:bg-amber-950/60 rounded-xl text-[11px] font-mono font-extrabold text-amber-900 dark:text-amber-300 tracking-wider group-hover:bg-amber-300 dark:group-hover:bg-[#231A0F] transition-colors">
                    3RD PLACE PEDESTAL
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table Section */}
      <Card className="card-saas overflow-hidden border border-slate-300 dark:border-slate-800 shadow-sm">
        {/* Table Filter / Search Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Full Competitor Standings</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full">
              {rankings.length} Competitors
            </span>
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder="Search competitor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="!py-1.5 text-xs bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/60 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-4 px-6 w-24">Rank</th>
                <th className="py-4 px-6">Trainee Competitor</th>
                <th className="py-4 px-6 text-center">Challenges Solved</th>
                <th className="py-4 px-6 text-center">Last Solve Timestamp (Speed)</th>
                <th className="py-4 px-6 text-right">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {filteredRankings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-medium">
                    No competitor records match your search.
                  </td>
                </tr>
              ) : (
                filteredRankings.map((item) => {
                  const isCurrentUser = item.username === user?.username;

                  return (
                    <tr
                      key={item.user_id}
                      className={`transition-all ${
                        isCurrentUser
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-l-4 border-l-indigo-600 font-semibold'
                          : 'hover:bg-slate-50/90 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="py-4 px-6 font-mono font-extrabold text-sm">
                        {item.rank === 1 && (
                          <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700">
                            #1 🥇
                          </span>
                        )}
                        {item.rank === 2 && (
                          <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
                            #2 🥈
                          </span>
                        )}
                        {item.rank === 3 && (
                          <span className="inline-flex items-center gap-1 text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700">
                            #3 🥉
                          </span>
                        )}
                        {item.rank > 3 && (
                          <span className="text-slate-600 dark:text-slate-400 font-mono px-2 py-1">
                            #{item.rank}
                          </span>
                        )}
                      </td>

                      {/* Trainee Username & Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
                              isCurrentUser
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {item.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-900 dark:text-white">{item.username}</span>
                              {isCurrentUser && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white font-mono leading-none">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {item.full_name || 'Trainee Operator'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Challenges Solved */}
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-bold px-3 py-1 rounded-lg bg-indigo-50 dark:bg-[#151C2C] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-2xs">
                          ✓ {item.solved_count} Solved
                        </span>
                      </td>

                      {/* Last Solve Timestamp (Speed) */}
                      <td className="py-4 px-6 text-center font-mono text-xs text-slate-600 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimestamp(item.last_solve_time)}
                        </span>
                      </td>

                      {/* Total Score */}
                      <td className="py-4 px-6 text-right font-mono font-black text-indigo-700 dark:text-indigo-400 text-lg">
                        {item.total_score} <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">PTS</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
