import React, { useState, useEffect } from 'react';
import { Shield, Lock, Copy, Check, Key, ExternalLink, AlertTriangle } from 'lucide-react';
import { licenseService } from '../../services/api';
import { Button } from '../ui/Button';

export const LicenseLockModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hardwareId, setHardwareId] = useState('');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await licenseService.getStatus();
      if (res.data) {
        setHardwareId(res.data.hardware_id);
        if (!res.data.is_licensed) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.error?.code === 'INSTANCE_UNAUTHORIZED') {
        const errorData = err.response.data.error;
        setHardwareId(errorData.hardware_id || 'UNKNOWN');
        setIsOpen(true);
      }
    }
  };

  useEffect(() => {
    checkStatus();

    const handleLockedEvent = (e: any) => {
      const detail = e.detail || {};
      if (detail.hardware_id) setHardwareId(detail.hardware_id);
      setIsOpen(true);
    };

    window.addEventListener('offensivegrid:license_locked', handleLockedEvent);
    return () => {
      window.removeEventListener('offensivegrid:license_locked', handleLockedEvent);
    };
  }, []);

  const handleCopyHwid = () => {
    if (!hardwareId) return;
    navigator.clipboard.writeText(hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await licenseService.activate(licenseKeyInput.trim());
      setSuccessMessage(res.message || 'Instance successfully activated and unlocked!');
      setTimeout(() => {
        setIsOpen(false);
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Activation key rejected. Please ensure hardware ID matches.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Subtle glow background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
              <span>OffensiveGrid Security Gate</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              This deployment instance is locked. An official cryptographic Authorization Key from <strong>Haroon Atieeq</strong> is required to operate this platform.
            </p>
          </div>

          {/* Machine Hardware ID Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Your Machine Hardware ID (HWID)
              </span>
              <button
                type="button"
                onClick={handleCopyHwid}
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy HWID'}</span>
              </button>
            </div>
            <div className="p-3 bg-black/60 rounded-lg border border-slate-800/80 font-mono text-base font-black text-cyan-400 tracking-wider text-center select-all">
              {hardwareId || 'DETECTION_PENDING...'}
            </div>
          </div>

          {/* Error / Success Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Activation Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                Enter Activation Key (OGLIC-...)
              </label>
              <input
                type="text"
                placeholder="OGLIC.T0ctRDREQi...XXXX"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full h-11 !bg-indigo-600 hover:!bg-indigo-500 font-bold"
              isLoading={isSubmitting}
              leftIcon={<Key className="w-4 h-4" />}
            >
              Activate & Unlock Platform 🚀
            </Button>
          </form>

          {/* Request Authorization Footer */}
          <div className="pt-4 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Need an evaluation license for research, university, or client demonstration?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold">
              <a
                href={`mailto:haroonatieeq6@gmail.com?subject=OffensiveGrid%20License%20Activation%20Request%20(${hardwareId})&body=Hello%20Haroon,%0A%0AI%20would%20like%20to%20request%20an%20evaluation%20license%20for%20OffensiveGrid.%0A%0AMy%20Hardware%20ID:%20${hardwareId}%0AName:%20%0AOrganization/University:%20%0AIntended%20Use:%20%0A%0AThank%20you.`}
                className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 font-mono"
              >
                <span>Email: haroonatieeq6@gmail.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://cszone.pk"
                target="_blank"
                rel="noreferrer"
                className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 font-mono"
              >
                <span>Official Portal (cszone.pk)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
