import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Sparkles,
  Smartphone,
  Upload,
  Image as ImageIcon,
  X,
  User as UserIcon,
  Mail,
  Send,
  CheckCircle2,
  HelpCircle,
  CreditCard,
  Building2,
  ArrowRight,
  MessageSquare,
  Check,
  Zap,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ToastProps } from '../ui/Toast';

interface ProMembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarioId?: string;
  scenarioTitle?: string;
  onSuccess: (toast: Omit<ToastProps, 'onClose'>) => void;
}

export const ProMembershipModal: React.FC<ProMembershipModalProps> = ({
  isOpen,
  onClose,
  scenarioId,
  scenarioTitle,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'INQUIRY' | 'PROOF'>('INQUIRY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proAmount, setProAmount] = useState<number>(2500);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const settings = await paymentService.getSettings();
        if (settings && settings.pro_plan_amount) {
          setProAmount(Number(settings.pro_plan_amount));
        }
      } catch (err) {
        console.error('Failed to load pro membership price', err);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    if (isOpen) {
      fetchPrice();
    }
  }, [isOpen]);

  // Form State
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [transactionId, setTransactionId] = useState('');
  const [inquiryNotes, setInquiryNotes] = useState(
    scenarioTitle ? `I want to purchase Pro access for challenge: ${scenarioTitle}` : 'I am interested in activating full OffensiveGrid Pro all-access membership.'
  );

  // Image File State
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Frontend Security VAPT Check: Size limit 5MB
      if (file.size > 5 * 1024 * 1024) {
        onSuccess({
          type: 'error',
          emoji: '⚠️',
          title: 'File Too Large',
          message: 'Payment screenshot must be less than 5MB.',
          duration: 4000,
        });
        return;
      }
      
      // Frontend Security VAPT Check: Image types only
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        onSuccess({
          type: 'error',
          emoji: '🚫',
          title: 'Invalid File Type',
          message: 'Only image files (JPG, PNG, WEBP) are allowed for security reasons.',
          duration: 4000,
        });
        return;
      }

      setReceiptFile(file);
      const previewUrl = URL.createObjectURL(file);
      setReceiptPreview(previewUrl);
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    if (receiptPreview) {
      URL.revokeObjectURL(receiptPreview);
      setReceiptPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Step 1: Contact Team / Invoice Inquiry
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('request_type', 'INQUIRY');
      formData.append('amount', proAmount.toString());
      formData.append('payment_method', paymentMethod);
      formData.append('sender_name', user?.username || 'Student');
      formData.append('whatsapp_number', whatsappNumber.trim());
      formData.append('notes', inquiryNotes);
      if (scenarioId) {
        formData.append('scenario', scenarioId);
      }

      await paymentService.submitRequest(formData);

      onSuccess({
        type: 'success',
        emoji: '📩',
        title: 'Inquiry Sent to OffensiveGrid Team! 🚀',
        message: `Our executive will message you on WhatsApp (${whatsappNumber}) with official payment credentials.`,
        duration: 4000,
      });

      onClose();
    } catch (err: any) {
      onSuccess({
        type: 'error',
        emoji: '⚠️',
        title: 'Inquiry Failed',
        message: err.response?.data?.error?.message || 'Could not send inquiry. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Step 2: Payment Receipt Proof Upload
  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('request_type', 'PAYMENT_PROOF');
      formData.append('amount', proAmount.toString());
      formData.append('payment_method', paymentMethod);
      formData.append('sender_name', user?.username || 'Student');
      formData.append('whatsapp_number', whatsappNumber.trim());
      if (transactionId.trim()) {
        formData.append('transaction_id', transactionId.trim());
      }
      formData.append('notes', inquiryNotes);
      if (scenarioId) {
        formData.append('scenario', scenarioId);
      }
      if (receiptFile) {
        formData.append('screenshot_image', receiptFile);
      }

      await paymentService.submitRequest(formData);

      onSuccess({
        type: 'success',
        emoji: '🎉',
        title: 'Payment Receipt Uploaded! 🚀',
        message: 'Payment verification is sent to administrators. Your Pro access will be unlocked shortly.',
        duration: 4000,
      });

      onClose();
    } catch (err: any) {
      onSuccess({
        type: 'error',
        emoji: '⚠️',
        title: 'Submission Failed',
        message: err.response?.data?.error?.message || 'Could not upload payment proof.',
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OffensiveGrid Pro Membership 💎"
      description="Access enterprise attack-defense scenarios, advanced network targets, and verified certifications."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Pricing Banner & Plan Tier Details */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <Sparkles className="w-3 h-3 text-amber-400" />
                All-Access CTF Pass
              </span>
              <h3 className="text-lg font-black text-white mt-1">OffensiveGrid Pro Monthly Plan</h3>
            </div>
            
            <div className="text-right sm:text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {isLoadingPrice ? (
                  <Loader2 className="w-6 h-6 animate-spin text-amber-400/50 inline-block mr-2" />
                ) : (
                  <>{proAmount.toLocaleString()} </>
                )}
                <span className="text-xs font-normal text-slate-300">PKR / Month</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">30 Days Full Access</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>All Paid Scenarios & Labs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Isolated Sandbox Targets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Verified Certificate & Mentor WA</span>
            </div>
          </div>
        </div>

        {/* User Identity Info Strip */}
        <div className="p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Trainee Username
            </span>
            <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">{user?.username || 'Student'}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Registered Email
            </span>
            <span className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 block truncate">{user?.email}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block font-medium flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Trainee ID
            </span>
            <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 mt-0.5 block truncate select-all">
              {user?.id || 'AUTH-SESSION'}
            </span>
          </div>
        </div>

        {/* Visual 2-Step Flow Action Buttons (Clear & Clickable) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Step 1: Contact Team Button */}
          <button
            type="button"
            onClick={() => setActiveTab('INQUIRY')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
              activeTab === 'INQUIRY'
                ? 'bg-indigo-50/90 dark:bg-[#131A2B] border-indigo-500 ring-2 ring-indigo-500/20 text-indigo-900 dark:text-white shadow-xs'
                : 'bg-slate-50 dark:bg-[#0E131F] border-slate-200 dark:border-[rgba(255,255,255,0.08)] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-indigo-500/40 hover:bg-slate-100/60 dark:hover:bg-[#131826]'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
              activeTab === 'INQUIRY'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-200 dark:bg-[#1A2234] text-slate-700 dark:text-slate-300'
            }`}>
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">1. Bank Details</span>
                {activeTab === 'INQUIRY' && (
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Request bank transfer details
              </p>
            </div>
          </button>

          {/* Step 2: Upload Receipt Button */}
          <button
            type="button"
            onClick={() => setActiveTab('PROOF')}
            className={`p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-3.5 ${
              activeTab === 'PROOF'
                ? 'bg-amber-50/90 dark:bg-[#1C160B] border-amber-500 ring-2 ring-amber-500/20 text-amber-900 dark:text-white shadow-xs'
                : 'bg-slate-50 dark:bg-[#0E131F] border-slate-200 dark:border-[rgba(255,255,255,0.08)] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-amber-500/40 hover:bg-slate-100/60 dark:hover:bg-[#1A1610]'
            }`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-colors ${
              activeTab === 'PROOF'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-200 dark:bg-[#1A2234] text-slate-700 dark:text-slate-300'
            }`}>
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">2. Upload Receipt</span>
                {activeTab === 'PROOF' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Submit payment proof & reference ID
              </p>
            </div>
          </button>
        </div>

        {/* TAB 1: INQUIRY & CONTACT TEAM */}
        {activeTab === 'INQUIRY' && (
          <form onSubmit={handleInquirySubmit} className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-indigo-50/60 dark:bg-[#111726] border border-indigo-200/80 dark:border-indigo-500/20 rounded-xl text-xs flex items-center gap-2.5 text-indigo-950 dark:text-indigo-200">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="leading-snug">
                Official payment details (IBAN, Raast, EasyPaisa, JazzCash) will be sent directly to your WhatsApp.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> WhatsApp Number *
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Preferred Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer (IBAN / Online Banking)</option>
                  <option value="EASYPAISA">Easypaisa Mobile Account</option>
                  <option value="JAZZ_CASH">JazzCash Account</option>
                  <option value="RAAST">Raast Instant Payment</option>
                  <option value="OTHER">Other / Corporate Invoice</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Inquiry Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={inquiryNotes}
                onChange={(e) => setInquiryNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="Any special lab or certification requirements..."
                maxLength={500}
              />
            </div>

            {/* Aligned Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={onClose}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send Inquiry</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: UPLOAD PAYMENT PROOF */}
        {activeTab === 'PROOF' && (
          <form onSubmit={handleProofSubmit} className="space-y-4 animate-in fade-in">
            <div className="p-3 bg-amber-50/60 dark:bg-[#1A140A] border border-amber-200/80 dark:border-amber-500/20 rounded-xl text-xs flex items-center gap-2.5 text-amber-950 dark:text-amber-200">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="leading-snug">
                Upload your payment receipt screenshot and reference ID. Admin will verify and activate Pro access immediately.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> WhatsApp Number *
                </label>
                <input
                  type="text"
                  placeholder="+92 300 1234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Payment Method Used
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer (IBAN / Online Banking)</option>
                  <option value="EASYPAISA">Easypaisa Mobile Account</option>
                  <option value="JAZZ_CASH">JazzCash Account</option>
                  <option value="RAAST">Raast Instant Payment</option>
                  <option value="OTHER">Other / Corporate Invoice</option>
                </select>
              </div>
            </div>

            <Input
              label="Transaction Reference / ID"
              placeholder="e.g. TRX-98234812 / Ref Number"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              maxLength={150}
            />

            {/* Direct Image Screenshot Uploader */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Payment Screenshot Image *
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {!receiptPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50 hover:bg-amber-50/20 dark:hover:bg-amber-950/20 group"
                >
                  <Upload className="w-6 h-6 text-slate-400 group-hover:text-amber-600 mx-auto mb-1 transition-colors" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                    Click to select payment receipt screenshot from device
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Supports PNG, JPG, JPEG, WEBP (Max 5MB)
                  </p>
                </div>
              ) : (
                <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-900 p-2 text-center">
                  <img
                    src={receiptPreview}
                    alt="Receipt Preview"
                    className="max-h-40 mx-auto rounded object-contain"
                  />
                  <div className="mt-2 flex items-center justify-between px-2 text-xs text-white">
                    <span className="font-mono text-[11px] truncate max-w-xs">{receiptFile?.name}</span>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 rounded-full bg-rose-600/80 hover:bg-rose-700 text-white transition-colors cursor-pointer"
                      title="Remove Screenshot"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Aligned Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold border border-slate-300 dark:border-[rgba(255,255,255,0.14)] bg-white dark:bg-[#111622] text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#182030] transition-colors cursor-pointer inline-flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md hover:shadow-amber-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Submit Receipt</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
