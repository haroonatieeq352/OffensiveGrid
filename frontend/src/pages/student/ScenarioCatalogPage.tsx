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
  Network
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
  const [isLoading, setIsLoading] = useState(true);

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
    const matchesSearch =
      searchQuery === '' ||
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

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

      {/* Domain Filters & Search Bar */}
      <div className="space-y-4">
        {/* Search & Difficulty Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full lg:max-w-md">
            <Input
              placeholder="Search scenarios by title, CVE, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            />
          </div>

          {/* Difficulty Filter Bar */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1 text-[11px]">Difficulty:</span>
            <div className="flex flex-wrap gap-2">
            {[{id: 'ALL', name: 'ALL'}, ...difficulties].map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedDifficulty === diff.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {diff.name}
              </button>
            ))}
            </div>
          </div>
        </div>

        {/* Category Filter Chips - Natural Flex Wrap (Zero Horizontal Scrolling Needed!) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            All Domains ({scenarios.length})
          </button>
          {categories.map((cat) => {
            const catCount = scenarios.filter((s) => s.category.slug === cat.slug).length;
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                {getDomainIcon(cat.icon)}
                {cat.name} ({catCount})
              </button>
            );
          })}
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
          {filteredScenarios.map((scenario) => {
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
    </div>
  );
};

export default ScenarioCatalogPage;
