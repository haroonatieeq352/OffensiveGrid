import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Layers,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { taxonomyService } from '../../services/api';
import { Category, Difficulty } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast, ToastProps } from '../../components/ui/Toast';

export const TaxonomyManagerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'difficulties'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  // Edit / Create Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingDifficulty, setEditingDifficulty] = useState<Difficulty | null>(null);

  // Professional Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'category' | 'difficulty';
    id: string;
    name: string;
    scenarioCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catIcon, setCatIcon] = useState('Shield');

  const [diffName, setDiffName] = useState('');
  const [diffLevel, setDiffLevel] = useState(10);
  const [diffColor, setDiffColor] = useState('emerald');

  const showToast = (type: ToastProps['type'], title: string, message: string) => {
    setToast({ type, title, message, duration: 5000 });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'categories') {
        const cats = await taxonomyService.adminGetCategories();
        setCategories(cats);
      } else {
        const diffs = await taxonomyService.adminGetDifficulties();
        setDifficulties(diffs);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to load data';
      showToast('error', 'Fetch Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleSaveCategory = async () => {
    try {
      const data = { name: catName, slug: catSlug, icon: catIcon };
      if (editingCategory) {
        await taxonomyService.updateCategory(editingCategory.id, data);
        showToast('success', 'Updated', 'Category updated successfully');
      } else {
        await taxonomyService.createCategory(data);
        showToast('success', 'Created', 'Category created successfully');
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to save category';
      showToast('error', 'Error', msg);
    }
  };

  const handleSaveDifficulty = async () => {
    try {
      const data = { name: diffName, level_value: diffLevel, color_code: diffColor };
      if (editingDifficulty) {
        await taxonomyService.updateDifficulty(editingDifficulty.id, data);
        showToast('success', 'Updated', 'Difficulty updated successfully');
      } else {
        await taxonomyService.createDifficulty(data);
        showToast('success', 'Created', 'Difficulty created successfully');
      }
      setIsDifficultyModalOpen(false);
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to save difficulty';
      showToast('error', 'Error', msg);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'category') {
        await taxonomyService.deleteCategory(deleteTarget.id);
        showToast('success', 'Category Deleted', `"${deleteTarget.name}" was removed successfully.`);
      } else {
        await taxonomyService.deleteDifficulty(deleteTarget.id);
        showToast('success', 'Difficulty Deleted', `"${deleteTarget.name}" was removed successfully.`);
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.response?.data?.detail ||
        `Cannot delete ${deleteTarget.type} in active use.`;
      showToast('error', 'Action Restricted', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-500" />
            Taxonomy Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage Challenge Categories and Difficulty Levels securely.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={fetchData} className="px-3" title="Refresh data">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {activeTab === 'categories' ? (
            <Button
              variant="primary"
              className="whitespace-nowrap flex-row flex-nowrap"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingCategory(null);
                setCatName('');
                setCatSlug('');
                setCatIcon('Shield');
                setIsCategoryModalOpen(true);
              }}
            >
              Add Category
            </Button>
          ) : (
            <Button
              variant="primary"
              className="whitespace-nowrap flex-row flex-nowrap"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingDifficulty(null);
                setDiffName('');
                setDiffLevel(10);
                setDiffColor('emerald');
                setIsDifficultyModalOpen(true);
              }}
            >
              Add Difficulty
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'categories'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Categories
          </div>
        </button>
        <button
          onClick={() => setActiveTab('difficulties')}
          className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
            activeTab === 'difficulties'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" /> Difficulties
          </div>
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-700 dark:text-slate-400 border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-slate-300 border-b-2 border-slate-300 dark:border-slate-800">
            {activeTab === 'categories' ? (
              <tr className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Slug</th>
                <th className="py-3.5 px-6">Scenarios</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            ) : (
              <tr className="text-[11px] font-mono font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                <th className="py-3.5 px-6">Name</th>
                <th className="py-3.5 px-6">Level Value</th>
                <th className="py-3.5 px-6">Color Code</th>
                <th className="py-3.5 px-6">Scenarios</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {activeTab === 'categories' &&
              categories.map((cat) => {
                const scCount = cat.scenario_count || 0;
                return (
                  <tr key={cat.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">{cat.name}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                        {cat.slug}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          scCount > 0
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {scCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatSlug(cat.slug);
                            setCatIcon(cat.icon || 'Shield');
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'category',
                              id: cat.id,
                              name: cat.name,
                              scenarioCount: scCount,
                            })
                          }
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {activeTab === 'difficulties' &&
              difficulties.map((diff) => {
                const scCount = diff.scenario_count || 0;
                return (
                  <tr key={diff.id} className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          {
                            emerald: 'bg-emerald-500',
                            amber: 'bg-amber-500',
                            red: 'bg-red-500',
                            purple: 'bg-purple-500',
                            cyan: 'bg-cyan-500',
                            blue: 'bg-blue-500',
                            indigo: 'bg-indigo-500',
                            slate: 'bg-slate-500',
                          }[diff.color_code] || 'bg-slate-500'
                        }`}
                      />
                      {diff.name}
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {diff.level_value}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                        {diff.color_code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          scCount > 0
                            ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {scCount}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingDifficulty(diff);
                            setDiffName(diff.name);
                            setDiffLevel(diff.level_value);
                            setDiffColor(diff.color_code);
                            setIsDifficultyModalOpen(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Edit Difficulty"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteTarget({
                              type: 'difficulty',
                              id: diff.id,
                              name: diff.name,
                              scenarioCount: scCount,
                            })
                          }
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Difficulty"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!isLoading &&
              ((activeTab === 'categories' && categories.length === 0) ||
                (activeTab === 'difficulties' && difficulties.length === 0)) && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    No {activeTab} found. Create one to get started.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* Professional Deletion & Protection Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#101522] rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => !isDeleting && setDeleteTarget(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {deleteTarget.scenarioCount > 0 ? (
              /* Scenario Protection Alert (Cannot Delete in Use) */
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Cannot Delete {deleteTarget.type === 'category' ? 'Category' : 'Difficulty'}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteTarget.name}"</span> is currently linked to{' '}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {deleteTarget.scenarioCount} active scenario{deleteTarget.scenarioCount > 1 ? 's' : ''}
                  </span>.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1.5 mb-6">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    🛡️ Database Integrity Protection
                  </div>
                  <div>
                    To prevent orphan challenges and broken trainee submissions, you must reassign or delete the associated scenarios before removing this {deleteTarget.type}.
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
                  <Link
                    to="/admin/scenarios"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors border border-indigo-200 dark:border-indigo-800/60"
                  >
                    View CTF Scenarios
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <Button variant="primary" className="w-full sm:w-auto" onClick={() => setDeleteTarget(null)}>
                    Understood
                  </Button>
                </div>
              </div>
            ) : (
              /* Safe to Delete Confirmation */
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 border border-rose-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Delete {deleteTarget.type === 'category' ? 'Category' : 'Difficulty'}?
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  Are you sure you want to permanently remove{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">"{deleteTarget.name}"</span>?
                  This taxonomy currently has 0 active scenarios. This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <Button variant="outline" disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
                    Cancel
                  </Button>
                  <button
                    disabled={isDeleting}
                    onClick={handleExecuteDelete}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete {deleteTarget.type === 'category' ? 'Category' : 'Difficulty'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">{editingCategory ? 'Edit Category' : 'Create Category'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Web Exploitation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <Input
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. web-exploitation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icon (Lucide)</label>
                <select
                  value={catIcon}
                  onChange={(e) => setCatIcon(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white"
                >
                  <option value="Search">Search (Reconnaissance)</option>
                  <option value="Database">Database (SQLi / NoSQLi)</option>
                  <option value="Code">Code (XSS / Client Side)</option>
                  <option value="FileJson">FileJson (XXE / Parsing)</option>
                  <option value="Link">Link (CSRF / SSRF)</option>
                  <option value="Key">Key (Cryptography)</option>
                  <option value="Microscope">Microscope (Digital Forensics)</option>
                  <option value="ShieldCheck">ShieldCheck (SOC / Defence)</option>
                  <option value="Network">Network (Networking)</option>
                  <option value="Terminal">Terminal (Binary Exploitation)</option>
                  <option value="Globe">Globe (Web General)</option>
                  <option value="Cpu">Cpu (Reverse Engineering)</option>
                  <option value="Lock">Lock (Security General)</option>
                  <option value="Shield">Shield (Default / Fallback)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveCategory}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Difficulty Modal */}
      {isDifficultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-bold mb-4">{editingDifficulty ? 'Edit Difficulty' : 'Create Difficulty'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  value={diffName}
                  onChange={(e) => setDiffName(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. Hard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Level Value (Sorting)</label>
                <Input
                  type="number"
                  min={0}
                  max={1000}
                  value={diffLevel}
                  onChange={(e) => setDiffLevel(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color Prefix</label>
                <select
                  value={diffColor}
                  onChange={(e) => setDiffColor(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5"
                >
                  <option value="emerald">Emerald (Easy)</option>
                  <option value="amber">Amber (Medium)</option>
                  <option value="red">Red (Hard)</option>
                  <option value="purple">Purple (Expert / Insane)</option>
                  <option value="slate">Slate (Default)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsDifficultyModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSaveDifficulty}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxonomyManagerPage;
