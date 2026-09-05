import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  MessageSquare,
  Smartphone,
  Mail,
  User,
  Image as ImageIcon,
  Check,
  X,
  Send,
  Sparkles,
  Inbox,
  Download,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Toast, ToastProps } from '../../components/ui/Toast';

export const AdminPaymentRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'INQUIRY' | 'PAYMENT_PROOF'>('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [revokingRequest, setRevokingRequest] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState('1-Month Subscription Expired');
  const [viewingReceiptImage, setViewingReceiptImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<Omit<ToastProps, 'onClose'> | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await paymentService.getAdminRequests({ search: searchQuery });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load payment requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.primary_role === 'SUPER_ADMIN') {
      fetchRequests();
    }
  }, [user]);

  if (user?.primary_role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  const handleOpenDetails = (req: any) => {
    setSelectedRequest(req);
    // Mark as seen immediately if unseen
    if (!req.is_seen) {
      paymentService.markSeen(req.id).catch(() => {});
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, is_seen: true } : r))
      );
    }
  };

  const handleMarkInvoiceSent = async (id: string, username: string) => {
    setActionLoading(true);
    try {
      await paymentService.sendInvoice(id, 'Official company banking details sent to trainee via WhatsApp/Email.');
      setToast({
        type: 'info',
        emoji: '📲',
        title: 'Invoice Marked Sent',
        message: `Status for "${username}" updated to Invoice Sent. Awaiting payment receipt.`,
        duration: 3000,
      });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setToast({
        type: 'error',
        emoji: '⚠️',
        title: 'Action Failed',
        message: err.response?.data?.error?.message || 'Could not update status.',
        duration: 2800,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string, username: string) => {
    setActionLoading(true);
    try {
      await paymentService.approveRequest(id, 'Payment receipt verified. Pro membership activated.');
      setToast({
        type: 'success',
        emoji: '🎉',
        title: 'Pro Access Granted! 🚀',
        message: `Student "${username}" has been upgraded to OffensiveGrid Pro. All paid scenarios are unlocked.`,
        duration: 3200,
      });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setToast({
        type: 'error',
        emoji: '⚠️',
        title: 'Approval Failed ❌',
        message: err.response?.data?.error?.message || 'Could not approve payment.',
        duration: 2800,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingRequest) return;
    setActionLoading(true);
    const username = revokingRequest.user_details?.username || revokingRequest.sender_name;

    try {
      await paymentService.revokeRequest(revokingRequest.id, revokeReason);
      setToast({
        type: 'warning',
        emoji: '🚫',
        title: 'Pro Subscription Revoked',
        message: `User "${username}" has been downgraded to Free tier. Paid scenarios are now locked for this student.`,
        duration: 3500,
      });
      setRevokingRequest(null);
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setToast({
        type: 'error',
        emoji: '❌',
        title: 'Revocation Failed',
        message: err.response?.data?.error?.message || 'Could not revoke Pro access.',
        duration: 2800,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, username: string) => {
    setActionLoading(true);
    try {
      await paymentService.rejectRequest(id, 'Inquiry or payment verification rejected.');
      setToast({
        type: 'warning',
        emoji: '⚠️',
        title: 'Request Rejected',
        message: `Request for student "${username}" has been marked rejected.`,
        duration: 2800,
      });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      setToast({
        type: 'error',
        emoji: '❌',
        title: 'Rejection Failed',
        message: err.response?.data?.error?.message || 'Could not reject request.',
        duration: 2800,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeFilter === 'ALL') return true;
    return req.request_type === activeFilter;
  });

  const getStatusBadge = (status: string, requestType: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-50 dark:bg-[#092218] text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-2xs">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            PRO ACTIVE 💎
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-[#141A29] text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-[rgba(255,255,255,0.08)] shadow-2xs">
            <Ban className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            PRO EXPIRED / REVOKED
          </span>
        );
      case 'INVOICE_SENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-sky-50 dark:bg-[#0B1A30] text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/30 shadow-2xs">
            <Send className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            INVOICE SENT 📲
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-50 dark:bg-[#250F14] text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 shadow-2xs">
            <X className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            REJECTED
          </span>
        );
      default:
        return requestType === 'PAYMENT_PROOF' ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-50 dark:bg-[#231707] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-2xs animate-pulse">
            RECEIPT PENDING ⏳
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-indigo-50 dark:bg-[#12162B] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-2xs">
            NEW INQUIRY 📩
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Trainee Pro Subscriptions & Inquiries
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage trainee memberships, send WhatsApp invoices, verify receipts, and revoke expired subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchRequests} leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[rgba(255,255,255,0.08)] pb-3">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161D2E] border border-slate-200 dark:border-[rgba(255,255,255,0.08)]'
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveFilter('INQUIRY')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'INQUIRY'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161D2E] border border-slate-200 dark:border-[rgba(255,255,255,0.08)]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Step 1: Bank Inquiries ({requests.filter(r => r.request_type === 'INQUIRY').length})</span>
        </button>
        <button
          onClick={() => setActiveFilter('PAYMENT_PROOF')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'PAYMENT_PROOF'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-[#111726] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#161D2E] border border-slate-200 dark:border-[rgba(255,255,255,0.08)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2: Payment Receipts ({requests.filter(r => r.request_type === 'PAYMENT_PROOF').length})</span>
        </button>
      </div>

      {/* Requests Table */}
      <Card className="card-saas overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 dark:border-indigo-500/25 bg-slate-100 dark:bg-[#111728] text-[11px] font-mono font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider shadow-2xs">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Trainee / Student ID</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">WhatsApp / Phone</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[rgba(148,163,184,0.05)] text-sm">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    {isLoading ? 'Loading requests...' : 'No requests matching this filter.'}
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {

                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleOpenDetails(req)}
                      className={`hover:bg-slate-100/90 dark:hover:bg-[rgba(99,102,241,0.04)] transition-colors cursor-pointer ${
                        !req.is_seen ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-medium' : ''
                      }`}
                    >
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {!req.is_seen && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-pulse" title="Unread notification" />
                          )}
                          <span>{new Date(req.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {req.request_type === 'INQUIRY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase bg-indigo-50 dark:bg-[#12162B] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 shadow-2xs">
                            <MessageSquare className="w-3 h-3" />
                            INQUIRY
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase bg-amber-50 dark:bg-[#1E170A] text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            PAYMENT PROOF
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          <span>{req.user_details?.username || req.sender_name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[150px]">
                          ID: {req.user}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[150px]">
                          {req.user_details?.email}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                        {Number(req.amount).toLocaleString()} PKR
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <a
                          href={`https://wa.me/${req.whatsapp_number.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30 transition-colors shadow-2xs"
                          title="Open WhatsApp Chat"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          {req.whatsapp_number}
                        </a>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        {getStatusBadge(req.status, req.request_type)}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          {/* For Inquiries: Send Invoice action */}
                          {req.request_type === 'INQUIRY' && req.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleMarkInvoiceSent(req.id, req.user_details?.username || req.sender_name)}
                              className="h-8 px-3 rounded-lg text-xs font-bold border border-sky-300 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/40 dark:hover:border-sky-500/50 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Sent Info</span>
                            </button>
                          )}

                          {/* For Active Pro: Option to Revoke / Cancel subscription */}
                          {req.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => setRevokingRequest(req)}
                              className="h-8 px-3 rounded-lg text-xs font-bold border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Revoke Pro</span>
                            </button>
                          )}
                          
                          {/* For Payment Proof: Option to Approve */}
                          {req.request_type === 'PAYMENT_PROOF' && req.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(req.id, req.user_details?.username || req.sender_name)}
                              className="h-8 px-3.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
                            >
                              <span>Approve Pro 💎</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Request Modal */}
      {selectedRequest && (
        <Modal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          title={`${selectedRequest.request_type === 'INQUIRY' ? '📩 Pro Bank Inquiry' : '💰 Payment Verification'}: ${selectedRequest.user_details?.username || selectedRequest.sender_name}`}
          description={`Created on ${new Date(selectedRequest.created_at).toLocaleString()}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] rounded-xl border border-slate-200 dark:border-[rgba(148,163,184,0.10)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Trainee Username</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedRequest.user_details?.username}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Trainee User ID (UUID)</span>
                <span className="font-mono text-[10px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 block truncate select-all">
                  {selectedRequest.user}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Registered Email</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{selectedRequest.user_details?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">WhatsApp / Direct Contact</span>
                <a
                  href={`https://wa.me/${selectedRequest.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {selectedRequest.whatsapp_number}
                </a>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Subscription Amount</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{Number(selectedRequest.amount).toLocaleString()} PKR</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block font-medium">Transaction Reference</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 block select-all">
                  {selectedRequest.transaction_id || 'None Provided'}
                </span>
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Trainee Message / Inquiry Details:</p>
                <p className="text-xs text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-[#101522] p-3 rounded-xl border border-slate-200 dark:border-[rgba(255,255,255,0.08)] leading-relaxed">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            {(selectedRequest.screenshot_image_url || selectedRequest.screenshot_url) && (
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Attached Payment Screenshot:
                </p>
                <div className="p-3 bg-slate-900 rounded-xl text-center">
                  <img
                    src={selectedRequest.screenshot_image_url || selectedRequest.screenshot_url}
                    alt="Payment Screenshot"
                    className="max-h-60 mx-auto rounded object-contain cursor-pointer hover:opacity-90 bg-white/5 p-1"
                    onClick={() => setViewingReceiptImage(selectedRequest.screenshot_image_url || selectedRequest.screenshot_url)}
                  />
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="text-[10px] text-slate-400">Click image to view in lightbox</span>
                    <a
                      href={selectedRequest.screenshot_image_url || selectedRequest.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Raw File
                    </a>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Close
              </button>
              {selectedRequest.status === 'APPROVED' ? (
                <button
                  type="button"
                  onClick={() => {
                    setRevokingRequest(selectedRequest);
                  }}
                  className="h-9 px-4 rounded-xl text-xs font-bold border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Revoke Pro Access 🚫</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedRequest.id, selectedRequest.user_details?.username || selectedRequest.sender_name)}
                    disabled={actionLoading}
                    className="h-9 px-5 rounded-xl text-xs font-bold border border-rose-300/30 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50 dark:hover:bg-rose-900/30 dark:hover:border-rose-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>Reject</span>
                  </button>
                  
                  {/* Approve Pro only for Payment Proofs */}
                  {selectedRequest.request_type === 'PAYMENT_PROOF' && selectedRequest.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(selectedRequest.id, selectedRequest.user_details?.username || selectedRequest.sender_name)}
                      disabled={actionLoading}
                      className="h-9 px-5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <span>Approve & Grant Pro Access 💎</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Revoke Pro Access Confirmation Modal */}
      {revokingRequest && (
        <Modal
          isOpen={!!revokingRequest}
          onClose={() => setRevokingRequest(null)}
          title="Revoke Pro Membership Access"
          description={`Revoke Pro subscription for trainee: ${revokingRequest.user_details?.username || revokingRequest.sender_name}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 dark:bg-[#1E170A] border border-amber-200 dark:border-amber-500/30 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Subscription Expiry / Revocation:</p>
                <p className="mt-1 text-amber-800 dark:text-amber-300/90">
                  Revoking this subscription will immediately set <strong>{revokingRequest.user_details?.username}</strong> back to the Free tier. The student will lose access to all Paid CTF Scenarios until they renew payment.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Revocation Reason / Note
              </label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#101522] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="e.g. 1-Month Subscription Expired"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setRevokingRequest(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeConfirm}
                disabled={actionLoading}
                className="h-9 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md hover:shadow-rose-500/25 transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirm Revoke Pro Access</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full-Resolution Screenshot Lightbox Modal */}
      {viewingReceiptImage && (
        <Modal
          isOpen={!!viewingReceiptImage}
          onClose={() => setViewingReceiptImage(null)}
          title="Payment Receipt Screenshot"
          description="High-resolution transaction proof document"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 rounded-2xl text-center overflow-auto max-h-[72vh] flex items-center justify-center min-h-[220px]">
              <img
                src={viewingReceiptImage}
                alt="Full Receipt"
                className="mx-auto rounded-lg shadow-2xl max-w-full max-h-[68vh] object-contain border border-slate-800"
              />
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[rgba(255,255,255,0.08)]">
              <a
                href={viewingReceiptImage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open in Full Window / Download
              </a>

              <button
                type="button"
                onClick={() => setViewingReceiptImage(null)}
                className="h-9 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
