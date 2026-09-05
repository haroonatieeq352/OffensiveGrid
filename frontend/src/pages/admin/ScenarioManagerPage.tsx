import React, { useState, useEffect } from 'react';
import { Flag, Plus, Edit2, Trash2, ExternalLink, Eye, CheckCircle, AlertTriangle, Key, FileText, Layers, Sparkles, Lock } from 'lucide-react';
import { scenarioService, taxonomyService } from '../../services/api';
import { Scenario, Category, Difficulty } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Toast, ToastProps } from '../../components/ui/Toast';

export const ScenarioManagerPage: React.FC = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingScenario, setViewingScenario] = useState<any | null>(null);
  const [editingScenario, setEditingScenario] = useState<any | null>(null);
  const [deletingScenario, setDeletingScenario] = useState<any | null>(null);

  // Form State for Create / Edit
  const initialFormState = {
    title: '',
    slug: '',
    category_id: '',
    difficulty_id: '',
    points: 100,
    max_attempts: 5,
    is_paid: false,
    target_url: '',
    description: '',
    instructions: '',
    flag: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [scenariosData, categoriesData, difficultiesData] = await Promise.all([
        scenarioService.getAdminScenarios(),
        taxonomyService.getCategories(),
        taxonomyService.getDifficulties(),
      ]);

      const scList = Array.isArray(scenariosData) ? scenariosData : [];
      setScenarios(scList);

      let catList: Category[] = [];
      if (Array.isArray(categoriesData)) {
        catList = categoriesData;
      } else if (categoriesData && Array.isArray((categoriesData as any).results)) {
        catList = (categoriesData as any).results;
      } else if (categoriesData && Array.isArray((categoriesData as any).data)) {
        catList = (categoriesData as any).data;
      }

      setCategories(catList);
      setDifficulties(difficultiesData);
      
      if (catList.length > 0 && !formData.category_id) {
        setFormData((prev) => ({ ...prev, category_id: catList[0].id }));
      }
      if (difficultiesData.length > 0 && !formData.difficulty_id) {
        setFormData((prev) => ({ ...prev, difficulty_id: difficultiesData[0].id }));
      }
    } catch (err) {
      console.error('Failed to load scenarios or categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      ...initialFormState,
      category_id: categories.length > 0 ? categories[0].id : '',
      difficulty_id: difficulties.length > 0 ? difficulties[0].id : '',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sc: any) => {
    setEditingScenario(sc);
    const existingFlag = sc.flags && sc.flags.length > 0 ? sc.flags[0].flag_value : '';
    setFormData({
      title: sc.title || '',
      slug: sc.slug || '',
      category_id: sc.category_details?.id || sc.category?.id || sc.category || (categories[0] ? categories[0].id : ''),
      difficulty_id: sc.difficulty_details?.id || sc.difficulty?.id || sc.difficulty || (difficulties[0] ? difficulties[0].id : ''),
      points: sc.points ?? 100,
      max_attempts: sc.max_attempts ?? 5,
      is_paid: !!sc.is_paid,
      target_url: sc.target_url || '',
      description: sc.description || '',
      instructions: sc.instructions || '',
      flag: existingFlag,
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const categoryVal = formData.category_id || (categories[0] && categories[0].id);
      const difficultyVal = formData.difficulty_id || (difficulties[0] && difficulties[0].id);

      const payload = {
        title: formData.title.trim(),
        slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        category: categoryVal,
        category_id: categoryVal,
        difficulty: difficultyVal,
        difficulty_id: difficultyVal,
        points: Number(formData.points ?? 100),
        max_attempts: Number(formData.max_attempts ?? 0),
        time_limit_minutes: 0,
        is_paid: formData.is_paid,
        target_url: formData.target_url ? formData.target_url.trim() : null,
        description: formData.description,
        instructions: formData.instructions,
        flag: formData.flag ? formData.flag.trim() : '',
        status: 'PUBLISHED',
      };

      await scenarioService.createScenario(payload);
      
      // Professional success toast with emoji
      setToast({
        type: 'success',
        emoji: '🎉',
        title: 'Scenario Created Successfully! 🚀',
        message: `Challenge "${formData.title}" (${formData.points} PTS, ${formData.is_paid ? 'PRO 💎' : 'FREE 🆓'}) is now live.`,
        duration: 2800,
      });

      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      let errorMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'An unexpected error occurred.';
      const details = err.response?.data?.error?.details || err.response?.data;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .filter(([key]) => key !== 'success' && key !== 'error')
          .map(([field, errs]: [string, any]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : String(errs)}`)
          .join(' | ');
        if (fieldErrors) {
          errorMsg = `${errorMsg} (${fieldErrors})`;
        }
      }

      setToast({
        type: 'error',
        emoji: '⚠️',
        title: 'Failed to Create Scenario ❌',
        message: errorMsg,
        duration: 4500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScenario) return;
    setIsSubmitting(true);

    try {
      const categoryVal = formData.category_id || editingScenario.category_details?.id || editingScenario.category?.id || editingScenario.category;
      const difficultyVal = formData.difficulty_id || editingScenario.difficulty_details?.id || editingScenario.difficulty?.id || editingScenario.difficulty;

      const payload: any = {
        title: formData.title.trim(),
        category: categoryVal,
        category_id: categoryVal,
        difficulty: difficultyVal,
        difficulty_id: difficultyVal,
        points: Number(formData.points ?? 100),
        max_attempts: Number(formData.max_attempts ?? 0),
        time_limit_minutes: 0,
        is_paid: formData.is_paid,
        target_url: formData.target_url ? formData.target_url.trim() : null,
        description: formData.description,
        instructions: formData.instructions,
      };

      if (formData.flag && formData.flag.trim()) {
        payload.flag = formData.flag.trim();
      }

      await scenarioService.updateScenario(editingScenario.id, payload);
      
      // Professional edit success toast with emoji
      setToast({
        type: 'success',
        emoji: '✨',
        title: 'Scenario Updated Successfully! 📝',
        message: `All modifications to "${formData.title}" have been saved and applied.`,
        duration: 2800,
      });

      setEditingScenario(null);
      fetchData();
    } catch (err: any) {
      let errorMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'An error occurred while saving modifications.';
      const details = err.response?.data?.error?.details || err.response?.data;
      if (details && typeof details === 'object') {
        const fieldErrors = Object.entries(details)
          .filter(([key]) => key !== 'success' && key !== 'error')
          .map(([field, errs]: [string, any]) => `${field}: ${Array.isArray(errs) ? errs.join(', ') : String(errs)}`)
          .join(' | ');
        if (fieldErrors) {
          errorMsg = `${errorMsg} (${fieldErrors})`;
        }
      }

      setToast({
        type: 'error',
        emoji: '⚠️',
        title: 'Failed to Update Scenario ❌',
        message: errorMsg,
        duration: 4500,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteConfirm = async () => {
    if (!deletingScenario) return;
    setIsSubmitting(true);
    const scenarioTitle = deletingScenario.title;

    try {
      await scenarioService.deleteScenario(deletingScenario.id);
      
      // Professional delete success toast with emoji
      setToast({
        type: 'success',
        emoji: '🗑️',
        title: 'Scenario Removed Successfully! ⚡',
        message: `Challenge "${scenarioTitle}" has been permanently purged from the system.`,
        duration: 2800,
      });

      setDeletingScenario(null);
      fetchData();
    } catch (err: any) {
      setToast({
        type: 'error',
        emoji: '⚠️',
        title: 'Failed to Delete Scenario ❌',
        message: err.response?.data?.error?.message || 'Unable to delete scenario from database.',
        duration: 2800,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Center Floating Toast Notification */}
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            CTF Scenario Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage cybersecurity challenges, pricing tiers (Free vs Paid), sandbox targets, and secret validation flags.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreate}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create Scenario
        </Button>
      </div>

      {/* Scenarios Table */}
      <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-4 px-6">Scenario Title</th>
                <th className="py-4 px-6">Tier</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Difficulty</th>
                <th className="py-4 px-6">Points</th>
                <th className="py-4 px-6">Max Attempts</th>
                <th className="py-4 px-6">Sandbox Lab</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {scenarios.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading scenarios...' : 'No scenarios found.'}
                  </td>
                </tr>
              ) : (
                scenarios.map((sc) => (
                  <tr key={sc.id} className="hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>{sc.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {sc.is_paid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-amber-50 dark:bg-[#1E1609] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-2xs whitespace-nowrap shrink-0">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>PRO</span>
                          <span className="text-[11px] leading-none">💎</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-slate-100 dark:bg-[#141B2D] text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-[rgba(255,255,255,0.1)] shadow-2xs whitespace-nowrap shrink-0">
                          <span>FREE</span>
                          <span className="text-[11px] leading-none">🆓</span>
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-400 font-semibold">
                      {sc.category_details?.name || sc.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-4 px-6">
                      <Badge difficulty={sc.difficulty_details || sc.difficulty} />
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-indigo-700 dark:text-indigo-400">{sc.points} PTS</td>
                    <td className="py-4 px-6 text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {sc.max_attempts > 0 ? `${sc.max_attempts} Tries` : 'Unlimited'}
                    </td>
                    <td className="py-4 px-6">
                      {sc.target_url ? (
                        <a
                          href={sc.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700 font-mono font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Sandbox
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Offline / Doc</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => setViewingScenario(sc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sc)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
                          title="Edit Scenario"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingScenario(sc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-[#1E293B] rounded-lg transition-colors cursor-pointer"
                          title="Delete Scenario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* CREATE SCENARIO MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New CTF Scenario"
        description="Deploy a new attack-defense challenge with custom tier (Free vs Paid)."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {/* Pricing Tier Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Scenario Access Tier</label>
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] rounded-xl border border-slate-200 dark:border-[rgba(148,163,184,0.10)]">
              <label className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${!formData.is_paid ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-sm text-indigo-900 dark:text-indigo-300 font-bold' : 'border-transparent text-slate-600 dark:text-slate-400'}`}>
                <input
                  type="radio"
                  name="create_tier"
                  checked={!formData.is_paid}
                  onChange={() => setFormData({ ...formData, is_paid: false })}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs">Free Challenge 🆓 (All Students)</span>
              </label>
              <label className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${formData.is_paid ? 'bg-white dark:bg-slate-800 border-amber-500 shadow-sm text-amber-900 dark:text-amber-300 font-bold' : 'border-transparent text-slate-600 dark:text-slate-400'}`}>
                <input
                  type="radio"
                  name="create_tier"
                  checked={formData.is_paid}
                  onChange={() => setFormData({ ...formData, is_paid: true })}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs">Paid Pro Challenge 💎 (Pro Subscribers)</span>
              </label>
            </div>
          </div>

          <Input
            label="Scenario Title"
            placeholder="e.g. Cross-Site Scripting Exploitation"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category ({categories.length} available)
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories loaded</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
              <select
                value={formData.difficulty_id}
                onChange={(e) => setFormData({ ...formData, difficulty_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {difficulties.map(diff => (
                  <option key={diff.id} value={diff.id}>{diff.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Points Awarded"
              type="number"
              min={0}
              max={10000}
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
              required
            />
            <Input
              label="Max Attempts (0 = Unlimited)"
              type="number"
              min={0}
              max={10000}
              value={formData.max_attempts}
              onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <Input
            label="Target Sandbox URL (Optional)"
            placeholder="http://lab.cszone.io:8080"
            value={formData.target_url}
            onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
          />

          <Input
            label="Secret Flag"
            type="text"
            maxLength={255}
            value={formData.flag}
            onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
            placeholder="CTF{secret_flag_value}"
            helperText="The required flag string students must discover and submit."
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Mission Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="Brief summary of the challenge mission..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Detailed Instructions & Mission Briefing (Markdown)
            </label>
            <textarea
              rows={4}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] p-3 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="### Objectives&#10;1. Exploit the input parameter...&#10;2. Find the flag."
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Publish Scenario</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT SCENARIO MODAL */}
      {editingScenario && (
        <Modal
          isOpen={!!editingScenario}
          onClose={() => setEditingScenario(null)}
          title={`Edit Scenario: ${editingScenario.title}`}
          description="Update challenge details, pricing tier (Free vs Paid), points, and flag configuration."
          maxWidth="2xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Pricing Tier Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Scenario Access Tier</label>
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-[#101522] rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
                <label className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${!formData.is_paid ? 'bg-white dark:bg-[#161D2E] border-indigo-500 shadow-sm text-indigo-900 dark:text-indigo-300 font-bold' : 'border-transparent text-slate-600 dark:text-slate-400'}`}>
                  <input
                    type="radio"
                    name="edit_tier"
                    checked={!formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: false })}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs">Free Challenge 🆓 (All Students)</span>
                </label>
                <label className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${formData.is_paid ? 'bg-white dark:bg-[#161D2E] border-amber-500 shadow-sm text-amber-900 dark:text-amber-300 font-bold' : 'border-transparent text-slate-600 dark:text-slate-400'}`}>
                  <input
                    type="radio"
                    name="edit_tier"
                    checked={formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: true })}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs">Paid Pro Challenge 💎 (Pro Subscribers)</span>
                </label>
              </div>
            </div>

            <Input
              label="Scenario Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#101522] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Difficulty</label>
                <select
                  value={formData.difficulty_id}
                  onChange={(e) => setFormData({ ...formData, difficulty_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#101522] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {difficulties.map((diff) => (
                    <option key={diff.id} value={diff.id}>{diff.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Points Awarded"
                  type="number"
                  min={0}
                  max={10000}
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  required
                />
                <Input
                  label="Max Attempts (0 = Unlimited)"
                  type="number"
                  min={0}
                  max={10000}
                  value={formData.max_attempts}
                  onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
                  required
                />
            </div>

            <Input
              label="Target Sandbox URL (Optional)"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
            />

              <Input
                label="Secret Flag"
                type="text"
                maxLength={255}
                value={formData.flag}
                onChange={(e) => setFormData({ ...formData, flag: e.target.value })}
                placeholder="Leave blank to keep existing flag..."
                helperText="Changing this will update the secret flag students must discover."
              />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mission Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#101522] p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Detailed Instructions & Mission Briefing (Markdown)
              </label>
              <textarea
                rows={4}
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#101522] p-3 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Aligned Edit Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setEditingScenario(null)}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* VIEW SCENARIO MODAL */}
      {viewingScenario && (
        <Modal
          isOpen={!!viewingScenario}
          onClose={() => setViewingScenario(null)}
          title={`Scenario: ${viewingScenario.title}`}
          description={`Category: ${viewingScenario.category_details?.name || viewingScenario.category?.name || 'General'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            {/* Top 4 Key Metadata KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-[#101522] rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)] text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Access Tier</span>
                <span className="mt-1.5 inline-block">
                  {viewingScenario.is_paid ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-amber-50 dark:bg-[#1A160A] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-2xs">
                      PRO 💎
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-slate-200 dark:bg-[#161D2E] text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-[rgba(255,255,255,0.08)]">
                      FREE 🆓
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Difficulty</span>
                <span className="mt-1.5 inline-block"><Badge difficulty={viewingScenario.difficulty_details || viewingScenario.difficulty} /></span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Points Value</span>
                <span className="mt-1 block font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm tracking-wide">
                  {viewingScenario.points} PTS
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-medium">Max Attempts</span>
                <span className="mt-1 block font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {viewingScenario.max_attempts > 0 ? `${viewingScenario.max_attempts} Tries` : 'Unlimited'}
                </span>
              </div>
            </div>

            {/* Sandbox Environment */}
            {viewingScenario.target_url && (
              <div className="p-3 bg-cyan-50/60 dark:bg-[#0A1624] border border-cyan-200 dark:border-cyan-500/25 rounded-xl text-xs flex items-center justify-between">
                <span className="text-cyan-900 dark:text-cyan-300 font-semibold flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  Sandbox Target Environment:
                </span>
                <a
                  href={viewingScenario.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-cyan-700 dark:text-cyan-300 hover:underline flex items-center gap-1 bg-white dark:bg-[#101D30] px-2.5 py-1 rounded-lg border border-cyan-200 dark:border-cyan-500/30"
                >
                  <span>{viewingScenario.target_url}</span>
                  <ExternalLink className="w-3 h-3 text-cyan-500" />
                </a>
              </div>
            )}

            {/* Configured Secret Flag (Harmonized with Sandbox Target Card) */}
            {viewingScenario.flags && viewingScenario.flags.length > 0 && (
              <div className="p-3 bg-indigo-50/60 dark:bg-[#0D1527] border border-indigo-200/80 dark:border-indigo-500/25 rounded-xl text-xs flex items-center justify-between gap-3">
                <span className="text-indigo-900 dark:text-indigo-300 font-semibold flex items-center gap-1.5 shrink-0">
                  <Key className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Configured Secret Flag:</span>
                </span>
                <code className="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-200 bg-white dark:bg-[#121B32] px-2.5 py-1 rounded-lg border border-indigo-200/80 dark:border-indigo-500/30 select-all tracking-wider shadow-2xs truncate">
                  {viewingScenario.flags[0].flag_value}
                </code>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Description:</p>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-[#101522] p-3.5 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
                {viewingScenario.description}
              </p>
            </div>

            {/* Instructions */}
            {viewingScenario.instructions && (
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Mission Briefing & Instructions:</p>
                <pre className="text-xs text-slate-800 dark:text-slate-200 font-mono bg-slate-100 dark:bg-[#0B0F19] p-3.5 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {viewingScenario.instructions}
                </pre>
              </div>
            )}

            {/* Aligned Close Button */}
            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setViewingScenario(null)}
                className="h-10 px-6 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingScenario && (
        <Modal
          isOpen={!!deletingScenario}
          onClose={() => setDeletingScenario(null)}
          title="Confirm Scenario Deletion"
          description="Are you sure you want to permanently delete this CTF scenario?"
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 rounded-xl flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Warning: This action cannot be undone.</p>
                <p className="mt-1 text-rose-700 dark:text-rose-300">
                  Scenario <strong>"{deletingScenario.title}"</strong> and all related student submission logs for this scenario will be removed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setDeletingScenario(null)}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Delete Scenario</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
