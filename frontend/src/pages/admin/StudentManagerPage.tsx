import React, { useState, useEffect } from 'react';
import { Users, Search, Shield, CheckCircle2, XCircle, ToggleLeft, ToggleRight, GraduationCap } from 'lucide-react';
import { authService, instructorRequestService, adminSubmissionService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, InstructorUpgradeRequest } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Modal } from '../../components/ui/Modal';

export const StudentManagerPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'requests' | 'resets'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<InstructorUpgradeRequest[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<any[]>([]);
  const [resetConfirm, setResetConfirm] = useState<{userId: string, scenarioId: string, title: string, username: string} | null>(null);
  const [viewRequest, setViewRequest] = useState<InstructorUpgradeRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await authService.getUsers();
      const list = (data as any).results || (data as any).data || data;
      setUsers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch trainees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const res = await authService.toggleUserStatus(userId);
      setFeedback(res.message || 'User status updated.');
      fetchUsers();
    } catch (err: any) {
      setFeedback(err.response?.data?.error?.message || 'Failed to toggle status.');
    }
  };

  const handleRevokeInstructor = async (userId: string) => {
    try {
      const res = await authService.revokeInstructor(userId);
      setFeedback(res.message || 'Instructor role revoked.');
      fetchUsers();
      fetchRequests();
    } catch (err: any) {
      setFeedback(err.response?.data?.error?.message || 'Failed to revoke instructor role.');
    }
  };

  const fetchRequests = async () => {
    if (user?.primary_role !== 'SUPER_ADMIN') return;
    try {
      const data = await instructorRequestService.getAdminRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to fetch instructor requests:', err);
    }
  };

  const fetchFailedAttempts = async () => {
    try {
      const data = await adminSubmissionService.getFailedAttempts();
      setFailedAttempts(data);
    } catch (err) {
      console.error('Failed to fetch failed attempts:', err);
    }
  };

  const handleResetAttempts = async (userId: string, scenarioId: string) => {
    try {
      const res = await adminSubmissionService.resetAttempts(userId, scenarioId);
      setFeedback(res.message || 'Attempts reset successfully.');
      setResetConfirm(null);
      fetchFailedAttempts();
    } catch (err: any) {
      setFeedback(err.response?.data?.error?.message || 'Failed to reset attempts.');
    }
  };

  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await instructorRequestService.processRequest(requestId, action);
      setFeedback(res.message || `Request ${action}d successfully.`);
      fetchRequests();
      fetchUsers(); // Refresh users to reflect role changes
    } catch (err: any) {
      setFeedback(err.response?.data?.message || `Failed to ${action} request.`);
    }
  };

  const handleViewRequest = async (r: InstructorUpgradeRequest) => {
    setViewRequest(r);
    if (!r.is_seen) {
      try {
        await instructorRequestService.markSeen(r.id);
        setRequests(prev => prev.map(req => req.id === r.id ? { ...req, is_seen: true } : req));
      } catch (err) {
        console.error('Failed to mark request as seen:', err);
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'requests') fetchRequests();
    if (activeTab === 'resets') fetchFailedAttempts();
  }, [activeTab]);

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Trainee Directory & Access Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit enrolled students, review roles, and manage access permissions.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#111726] border border-slate-300 dark:border-[rgba(255,255,255,0.12)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-400 shadow-2xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
      </div>

      {feedback && (
        <Alert variant="info" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {/* Tabs */}
      {user?.primary_role === 'SUPER_ADMIN' && (
        <div className="flex items-center gap-4 border-b border-slate-200 dark:border-[rgba(255,255,255,0.05)] pb-1">
          <button
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('users')}
          >
            All Trainees & Users
          </button>
          <button
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Instructor Requests
            {requests.filter(r => r.status === 'PENDING' && !r.is_seen).length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'PENDING' && !r.is_seen).length}
              </span>
            )}
          </button>
          <button
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'resets'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            onClick={() => setActiveTab('resets')}
          >
            Attempt Resets & Blocks
          </button>
        </div>
      )}

      {activeTab === 'users' && (
      <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Assigned Role</th>
                <th className="py-4 px-6">Account Status</th>
                <th className="py-4 px-6">Enrolled Date</th>
                {(user?.primary_role === 'SUPER_ADMIN' || user?.primary_role === 'ADMIN') && (
                  <th className="py-4 px-6 text-right">Access Action</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-[rgba(148,163,184,0.10)]">
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{u.username}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-500">{u.full_name || 'Trainee'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-700 dark:text-slate-400 font-mono font-medium">{u.email}</td>
                  <td className="py-4 px-6">
                    <Badge role={u.primary_role} />
                  </td>
                  <td className="py-4 px-6">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-400">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Disabled
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  {(user?.primary_role === 'SUPER_ADMIN' || user?.primary_role === 'ADMIN') && (
                    <td className="py-4 px-6 text-right">
                      {u.primary_role === 'SUPER_ADMIN' && user?.primary_role !== 'SUPER_ADMIN' ? (
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-700/50">
                          RESTRICTED
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant={u.is_active ? 'outline' : 'secondary'}
                          onClick={() => handleToggleStatus(u.id)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}
      
      {activeTab === 'requests' && (
        <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-4 px-6">Applicant</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {requests.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No requests found.</td></tr>
              ) : requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-300">
                        {r.user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{r.user?.username}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{r.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded border ${
                      r.status === 'APPROVED' ? 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40' :
                      (r.status === 'REJECTED' || r.status === 'REVOKED') ? 'text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950/40' :
                      'text-amber-800 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex gap-2 justify-end items-center">
                      {!r.is_seen && r.status === 'PENDING' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => handleViewRequest(r)}>
                        View
                      </Button>
                      
                      {r.status === 'PENDING' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleProcessRequest(r.id, 'reject')} className="border-rose-300 text-rose-600 hover:bg-rose-50">
                            Reject
                          </Button>
                          <Button size="sm" variant="primary" onClick={() => handleProcessRequest(r.id, 'approve')}>
                            Approve
                          </Button>
                        </>
                      )}
                      
                      {r.status === 'APPROVED' && r.user?.primary_role === 'INSTRUCTOR' && (
                        <Button size="sm" variant="danger" onClick={() => handleRevokeInstructor(r.user!.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {activeTab === 'resets' && (
        <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-4 px-6">Blocked Trainee</th>
                <th className="py-4 px-6">Scenario Title</th>
                <th className="py-4 px-6">Failed Attempts Used</th>
                <th className="py-4 px-6">Last Attempt Time</th>
                <th className="py-4 px-6 text-right">Access Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {failedAttempts.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No failed attempts found.</td></tr>
              ) : failedAttempts.map((f, idx) => (
                <tr key={idx} className="hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-300">
                        {f.user__username?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white leading-tight">{f.user__username}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {(f.user__first_name || f.user__last_name) ? `${f.user__first_name || ''} ${f.user__last_name || ''}`.trim() : 'Trainee'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-900 dark:text-slate-300 font-bold">{f.scenario__title}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded border ${
                      f.attempts >= (f.scenario__max_attempts || 999) 
                        ? 'text-rose-700 border-rose-300 bg-rose-50 dark:bg-rose-950/40' 
                        : 'text-amber-800 border-amber-300 bg-amber-50 dark:bg-amber-950/40'
                    }`}>
                      {f.attempts} / {f.scenario__max_attempts === 0 ? 'Unlimited' : f.scenario__max_attempts}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {new Date(f.last_attempt).toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => setResetConfirm({
                        userId: f.user_id,
                        scenarioId: f.scenario_id,
                        username: f.user__username,
                        title: f.scenario__title
                      })}
                    >
                      Grant +1 Try
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      )}

      {/* Confirmation Modal for Resetting Attempt */}
      <Modal 
        isOpen={!!resetConfirm} 
        onClose={() => setResetConfirm(null)}
        title="Confirm +1 Attempt"
      >
        <div className="p-4 space-y-4 text-slate-700 dark:text-slate-300 text-sm">
          <p>
            Are you sure you want to grant <span className="font-bold text-indigo-500">{resetConfirm?.username}</span> an additional attempt for the scenario <span className="font-bold">"{resetConfirm?.title}"</span>?
          </p>
          <p className="text-xs text-slate-500">
            This will delete their oldest failed submission, effectively reducing their used attempts count by 1.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button variant="outline" onClick={() => setResetConfirm(null)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (resetConfirm) {
                  handleResetAttempts(resetConfirm.userId, resetConfirm.scenarioId);
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Instructor Request Modal */}
      <Modal 
        isOpen={!!viewRequest} 
        onClose={() => setViewRequest(null)}
        title="Instructor Application Details"
      >
        {viewRequest && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-700/50 pb-4">
              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-lg">
                {viewRequest.user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{viewRequest.user?.username}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{viewRequest.user?.email}</p>
              </div>
              <div className="ml-auto flex items-center">
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded border ${
                  viewRequest.status === 'APPROVED' ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40' :
                  (viewRequest.status === 'REJECTED' || viewRequest.status === 'REVOKED') ? 'text-rose-600 border-rose-200 bg-rose-50 dark:bg-rose-950/40' :
                  'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/40'
                }`}>
                  {viewRequest.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Total Score</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {viewRequest.user_performance?.score || 0} <span className="text-sm font-bold text-slate-400">PTS</span>
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Attempt Precision</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono mt-1">
                    {viewRequest.user_performance?.precision || 0}%
                  </p>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold mt-1">
                  {viewRequest.user_performance?.solved || 0} Solves • <span className="text-rose-600 dark:text-rose-400 font-bold">{viewRequest.user_performance?.failed || 0} Fails</span>
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Short Summary</p>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {viewRequest.experience_summary || 'No summary provided.'}
              </div>
            </div>

            {viewRequest.status === 'PENDING' && (
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50 justify-end">
                <Button variant="outline" onClick={() => {
                  handleProcessRequest(viewRequest.id, 'reject');
                  setViewRequest(null);
                }} className="border-rose-500/50 text-rose-500 hover:bg-rose-50">
                  Reject Application
                </Button>
                <Button variant="primary" onClick={() => {
                  handleProcessRequest(viewRequest.id, 'approve');
                  setViewRequest(null);
                }}>
                  Approve as Instructor
                </Button>
              </div>
            )}
            {viewRequest.status === 'APPROVED' && viewRequest.user?.primary_role === 'INSTRUCTOR' && (
              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50 justify-end">
                <Button variant="danger" onClick={() => {
                  handleRevokeInstructor(viewRequest.user!.id);
                  setViewRequest(null);
                }}>
                  Revoke Instructor Role
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
