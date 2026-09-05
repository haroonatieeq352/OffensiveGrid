import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Lock,
  Flag,
  Globe,
  Key,
  Cpu,
  Wifi,
  Terminal,
  Timer,
  Database,
  Code,
  FileJson,
  Link as LinkIcon,
  Microscope,
  ShieldCheck,
  Network,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Layers
} from 'lucide-react';
import { scenarioService, submissionService, tournamentService, taxonomyService } from '../../services/api';
import { Scenario, Category, Difficulty } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Toast, ToastProps } from '../../components/ui/Toast';
import { ProMembershipModal } from '../../components/common/ProMembershipModal';
import { useTournamentSync } from '../../hooks/useTournamentSync';

export const ScenarioCatalogPage: React.FC = () => {
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [solvedScenarioIds, setSolvedScenarioIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(9);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Anti-Tamper & Zero-Exploit Sanitizer for Search Input
  const sanitizeSearchInput = (raw: string): string => {
    // 1. Cap length at 64 characters to block buffer/payload stuffing
    let clean = raw.slice(0, 64);
    // 2. Strip dangerous characters used in XSS, SQLi, and template injections
    clean = clean.replace(/[<>'"`;\\{}[\]()]/g, '');
    return clean;
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = sanitizeSearchInput(e.target.value);
    setSearchQuery(clean);
    setCurrentPage(1);
  };

  // Pro Upgrade Modal & Toast state
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPaidScenario, setSelectedPaidScenario] = useState<Scenario | null>(null);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);
  const [session, setSession] = useState<any>(null);

  const navigate = useNavigate();

  const handleScenarioClick = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    if (!session) {
      setToast({ type: 'warning', title: 'Tournament Not Started', message: 'Please start the Tournament Time first from your Dashboard.' });
      return;
    }
    navigate(`/scenarios/${slug}`);
  };

  const hasProAccess = !!user?.has_paid_access || user?.roles?.includes('ADMIN') || user?.roles?.includes('SUPER_ADMIN');

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
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [scenariosData, categoriesData, submissionsData, diffsData] = await Promise.allSettled([
          scenarioService.getScenarios(),
          taxonomyService.getCategories(),
          submissionService.getMySubmissions().catch(() => []),
          taxonomyService.getDifficulties(),
        ]);
        setScenarios(scenariosData.status === 'fulfilled' && Array.isArray(scenariosData.value) ? scenariosData.value : []);
        setCategories(categoriesData.status === 'fulfilled' && Array.isArray(categoriesData.value) ? categoriesData.value : []);
        setDifficulties(diffsData.status === 'fulfilled' && Array.isArray(diffsData.value) ? diffsData.value : []);
        
        await fetchSession();
        
        // Identify solved scenarios
        if (submissionsData.status === 'fulfilled' && Array.isArray(submissionsData.value)) {
          const solved = new Set<string>();
          submissionsData.value.forEach((sub: any) => {
            if (sub.is_correct) {
              solved.add(sub.scenario_id);
            }
          });
          setSolvedScenarioIds(solved);
        }
      } catch (err) {
        console.error('Failed to load scenario catalog:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredScenarios = scenarios.filter((sc) => {
    const matchesCategory = selectedCategory === 'ALL' || sc.category.slug === selectedCategory;
    let matchesDifficulty = true;
    if (selectedDifficulty !== 'ALL' && (sc.difficulty?.id || sc.difficulty) !== selectedDifficulty) {
      matchesDifficulty = false;
    }
    const cleanSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      cleanSearch === '' ||
      sc.title.toLowerCase().includes(cleanSearch) ||
      sc.description.toLowerCase().includes(cleanSearch);
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredScenarios.length / pageSize));
  const paginatedScenarios = pageSize === -1
    ? filteredScenarios
    : filteredScenarios.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenUpgrade = (sc?: Scenario) => {
    setSelectedPaidScenario(sc || null);
    setUpgradeModalOpen(true);
  };

  const getDomainIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Search': return <Search className="w-3.5 h-3.5" />;
      case 'Database': return <Database className="w-3.5 h-3.5" />;
      case 'Code': return <Code className="w-3.5 h-3.5" />;
      case 'FileJson': return <FileJson className="w-3.5 h-3.5" />;
      case 'Link': return <LinkIcon className="w-3.5 h-3.5" />;
      case 'Key': return <Key className="w-3.5 h-3.5" />;
      case 'Microscope': return <Microscope className="w-3.5 h-3.5" />;
      case 'ShieldCheck': return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'Network': return <Network className="w-3.5 h-3.5" />;
      case 'Terminal': return <Terminal className="w-3.5 h-3.5" />;
      case 'Globe': return <Globe className="w-3.5 h-3.5" />;
      case 'Cpu': return <Cpu className="w-3.5 h-3.5" />;
      case 'Lock': return <Lock className="w-3.5 h-3.5" />;
      case 'Wifi': return <Wifi className="w-3.5 h-3.5" />;
      default: return <Shield className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col gap-8">
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
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        scenarioId={selectedPaidScenario?.id}
        scenarioTitle={selectedPaidScenario?.title}
        onSuccess={(t) => setToast(t)}
      />

      {/* Catalog Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 border border-indigo-500/30 dark:border-slate-800 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 dark:bg-indigo-950/60 text-white dark:text-indigo-300 border border-white/30 dark:border-indigo-800/40 mb-1.5 shadow-sm">
            <Flag className="w-3 h-3" />
            CTF Lab Training Matrix
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Attack-Defense Scenarios Catalog
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-indigo-100 dark:text-slate-400 max-w-2xl">
              Choose from authentic cyber warfare simulations, reverse engineering challenges, and exploit targets in isolated sandboxes.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-end gap-2 shrink-0">
          {session && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 dark:bg-indigo-950/40 border border-white/30 dark:border-indigo-800/40 text-white dark:text-indigo-400 text-sm font-bold font-mono uppercase tracking-wider shadow-sm">
              <Timer className="w-4 h-4" />
              <CountdownTimer initialSeconds={session.remaining_seconds} isPaused={!session.is_active} />
            </div>
          )}
          <div className="text-right hidden sm:block">
            <span className="text-xs text-indigo-200 dark:text-slate-500 font-medium block">Catalog Total</span>
            <span className="text-lg font-bold text-white dark:text-slate-200 font-mono">
              {solvedScenarioIds.size} / {scenarios.length} Solved
            </span>
          </div>
        </div>
      </div>

      {/* Enterprise Combat Matrix Control Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* 1. Ultra-Secure Anti-Tamper Search Input */}
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              maxLength={64}
              placeholder="Search scenarios by title, CVE, or attack vector..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 2. Enterprise Dropdown Filters Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Category / Domain Dropdown */}
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-indigo-600 dark:text-indigo-400">
                <Shield className="w-4 h-4" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer transition-all appearance-none"
              >
                <option value="ALL">All Domains ({scenarios.length})</option>
                {categories.map((cat) => {
                  const catCount = scenarios.filter((s) => s.category.slug === cat.slug).length;
                  return (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name} ({catCount})
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-2.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Difficulty Dropdown */}
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-amber-500">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer transition-all appearance-none"
              >
                <option value="ALL">All Difficulties</option>
                {difficulties.map((diff) => (
                  <option key={diff.id} value={diff.id}>
                    {diff.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Pagination Size Dropdown */}
            <div className="relative flex items-center">
              <div className="absolute left-3 pointer-events-none text-purple-500 dark:text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="pl-9 pr-8 py-2.5 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer transition-all appearance-none"
              >
                <option value="6">6 Scenarios / Page</option>
                <option value="9">9 Scenarios / Page</option>
                <option value="12">12 Scenarios / Page</option>
                <option value="18">18 Scenarios / Page</option>
                <option value="-1">Show All</option>
              </select>
              <div className="absolute right-2.5 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>

        {/* Live Filter Telemetry & Quick Reset Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/70 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
            <span>
              Showing <strong className="text-slate-900 dark:text-white font-bold">{filteredScenarios.length > 0 ? (currentPage - 1) * (pageSize === -1 ? filteredScenarios.length : pageSize) + 1 : 0}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{Math.min(currentPage * (pageSize === -1 ? filteredScenarios.length : pageSize), filteredScenarios.length)}</strong> of <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredScenarios.length}</strong> Scenarios
            </span>
            {(selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery.trim() !== '') && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-sans font-semibold text-[11px]">
                Filtered
              </span>
            )}
          </div>

          {(selectedCategory !== 'ALL' || selectedDifficulty !== 'ALL' || searchQuery.trim() !== '') && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedDifficulty('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Scenarios Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"></div>
          ))}
        </div>
      ) : filteredScenarios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching scenarios found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms, domain filters, or difficulty setting.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedDifficulty('ALL');
              setSearchQuery('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedScenarios.map((scenario) => {
            const isLocked = scenario.is_paid && !hasProAccess;
            const isSolved = solvedScenarioIds.has(scenario.id);

            return (
              <Card
                key={scenario.id}
                className="card-saas flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="p-6">
                  {/* Top Domain & Status Tags */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider truncate flex items-center gap-1.5">
                      {getDomainIcon(scenario.category.icon)}
                      {scenario.category.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSolved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-[#151C2C] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 whitespace-nowrap">
                          ✓ SOLVED
                        </span>
                      )}
                      {scenario.is_paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-xs whitespace-nowrap leading-none shrink-0">
                          <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>PRO 💎</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap leading-none shrink-0">
                          <span>FREE 🆓</span>
                        </span>
                      )}
                      <Badge difficulty={scenario.difficulty} className="whitespace-nowrap shrink-0 leading-none py-0.5" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 whitespace-nowrap shrink-0 leading-none">
                        {scenario.points} PTS
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-snug flex items-center gap-2">
                    {isLocked && <Lock className="w-4 h-4 text-amber-500 shrink-0" />}
                    <span>{scenario.title}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-4">
                    {scenario.description}
                  </p>

                  {/* Target Attached Pill */}
                  {scenario.target_url && (
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-800/60 mb-4">
                      <ExternalLink className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                      <span>Sandbox Target:</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{scenario.target_url}</span>
                    </div>
                  )}
                </CardContent>

                {/* Footer Action */}
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate">
                    {scenario.max_attempts > 0
                      ? `Quota: ${scenario.max_attempts} attempts`
                      : 'Unlimited attempts'}
                  </span>

                  {isLocked ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant="primary"
                        className="!bg-amber-600 hover:!bg-amber-700 !border-amber-600 text-white"
                        onClick={() => handleOpenUpgrade(scenario)}
                        leftIcon={<Lock className="w-3.5 h-3.5" />}
                      >
                        Unlock Pro 💎
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={(e) => handleScenarioClick(e, scenario.slug)}
                      size="sm"
                      variant={isSolved ? 'outline' : 'primary'}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {isSolved ? 'Review Mission' : 'Enter Scenario'}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enterprise Pagination Bar */}
      {!isLoading && filteredScenarios.length > 0 && totalPages > 1 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Page <span className="font-bold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
            <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
            <span className="font-mono">{filteredScenarios.length} Total Scenarios</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setCurrentPage((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                  : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  totalPages > 7 &&
                  page !== 1 &&
                  page !== totalPages &&
                  Math.abs(page - currentPage) > 1
                ) {
                  if (page === 2 || page === totalPages - 1) {
                    return (
                      <span key={page} className="px-1 text-xs text-slate-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                }

                const isActive = page === currentPage;
                return (
                  <button
                    key={page}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
                    className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                window.scrollTo({ top: 200, behavior: 'smooth' });
              }}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800'
                  : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-xs'
              }`}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScenarioCatalogPage;
