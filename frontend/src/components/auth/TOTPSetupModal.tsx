import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Shield, Key, Loader2, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiClient } from '../../services/api';

interface TOTPSetupModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const TOTPSetupModal: React.FC<TOTPSetupModalProps> = ({ isOpen, onSuccess }) => {
  const [secret, setSecret] = useState('');
  const [uri, setUri] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      generateSecret();
    }
  }, [isOpen]);

  const generateSecret = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/admin/totp/generate/');
      if (response.data?.success) {
        setSecret(response.data.data.secret);
        setUri(response.data.data.uri);
      } else {
        setError(response.data?.message || 'Failed to generate 2FA secret.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const response = await apiClient.post('/auth/admin/totp/verify/', { otp });
      if (response.data?.success) {
        onSuccess();
      } else {
        setError(response.data?.message || 'Invalid OTP code.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot close this modal without verifying
      title="Secure Your Admin Account 🛡️"
      description="Two-Factor Authentication (2FA) is required for all administrative accounts."
      maxWidth="md"
    >
      <div className="space-y-6 pt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-slate-500">Generating secure key...</p>
          </div>
        ) : (
          <>
            <div className="bg-slate-50 dark:bg-[#111827] p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
              <ol className="list-decimal list-inside space-y-2">
                <li>Download <strong>Google Authenticator</strong> on your phone.</li>
                <li>Scan the QR code below.</li>
                <li>Enter the 6-digit code to enable 2FA.</li>
              </ol>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                {uri && (
                  <QRCodeSVG value={uri} size={180} level="M" />
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 select-all">
                {secret}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-sm font-medium border border-rose-200 dark:border-rose-900/50">
                {error}
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors font-mono text-center tracking-widest text-lg"
                    placeholder="000000"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={verifying || otp.length !== 6}
                leftIcon={verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              >
                {verifying ? 'Verifying...' : 'Enable 2FA & Login'}
              </Button>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};
