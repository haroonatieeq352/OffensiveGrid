import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  KeyRound,
  Shield,
  Clock,
  RefreshCw,
  Send,
  AlertCircle,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { authService } from '../../services/api';

type ResetStep = 'EMAIL' | 'OTP' | 'PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Current workflow stage
  const [currentStep, setCurrentStep] = useState<ResetStep>('EMAIL');

  // Form states
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpCode, setTotpCode] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP inputs
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers: 600s (10-Min) OTP Expiry & 60s Resend Cooldown
  const [expirySeconds, setExpirySeconds] = useState(600);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 10-Minute OTP Expiry Countdown
  useEffect(() => {
    if (currentStep !== 'OTP' || expirySeconds <= 0) return;

    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentStep, expirySeconds]);

  // 60s Cooldown Countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const cooldownTimer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [cooldownSeconds]);

  // Real-time password criteria evaluation
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]/.test(newPassword);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  // Step 1: Send Reset OTP
  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setFieldErrors({});

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFieldErrors({ email: 'Please enter a valid email address.' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestPasswordReset(cleanEmail);
      setStatusMessage(res.message || 'If an account exists, a 6-digit code has been sent.');
      setExpirySeconds(600);
      setCooldownSeconds(res.data?.cooldown_seconds || 60);
      setOtpDigits(['', '', '', '', '', '']);
      setCurrentStep('OTP');

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Could not initiate password reset.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setError(null);

    // Auto move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      handleVerifyOtp(fullCode);
    }
  };

  // Handle OTP Backspace navigation
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste 6-digit OTP
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      otpInputRefs.current[5]?.focus();
      handleVerifyOtp(pasted);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (codeToVerify?: string) => {
    setError(null);
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit reset code.');
      return;
    }

    if (expirySeconds <= 0) {
      setError('Verification code has expired. Please request a new code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyPasswordResetOtp(email.trim().toLowerCase(), code);
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
        setRequires2FA(Boolean(res.data.requires_2fa));
        setCurrentStep('PASSWORD');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Invalid or expired verification code.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};

    if (!hasMinLength) {
      errors.newPassword = 'Password must be at least 8 characters long.';
    } else if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      errors.newPassword = 'Password must contain small letters, capital letters, numbers, and special symbols.';
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (requires2FA && (!totpCode.trim() || totpCode.trim().length !== 6)) {
      errors.totpCode = 'Please enter the 6-digit Two-Factor Authentication code from your Authenticator app.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await authService.confirmPasswordReset({
        reset_token: resetToken,
        new_password: newPassword,
        confirm_password: confirmPassword,
        totp_code: requires2FA ? totpCode.trim() : undefined,
      });

      setCurrentStep('SUCCESS');
      setTimeout(() => {
        navigate('/login');
      }, 3500);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 mb-2 shadow-2xs">
          <KeyRound className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          OffensiveGrid Security Recovery
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {currentStep === 'SUCCESS' ? 'Password Reset Complete' : 'Reset Account Password'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {currentStep === 'EMAIL' && 'Enter your registered email address to receive a secure 6-digit recovery code.'}
          {currentStep === 'OTP' && `Enter the 6-digit verification code sent to ${email}.`}
          {currentStep === 'PASSWORD' && 'Create a strong new password for your OffensiveGrid account.'}
          {currentStep === 'SUCCESS' && 'Your credentials have been securely updated. Redirecting to login...'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" title="Security Notice">
          {error}
        </Alert>
      )}

      {/* Progress Indicators */}
      {currentStep !== 'SUCCESS' && (
        <div className="grid grid-cols-3 gap-2 pt-1 pb-1">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 'EMAIL' ? 'bg-indigo-600' : 'bg-emerald-500'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 'OTP' ? 'bg-indigo-600' : currentStep === 'PASSWORD' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
          <div className={`h-1.5 rounded-full transition-all duration-300 ${currentStep === 'PASSWORD' ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
        </div>
      )}

      {/* STEP 1: Email Input */}
      {currentStep === 'EMAIL' && (
        <form onSubmit={handleRequestReset} className="space-y-4">
          <Input
            label="Registered Email Address *"
            type="email"
            name="email"
            placeholder="trainee@organization.com"
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) setFieldErrors({});
            }}
            required
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            helperText="We will send a 6-digit cryptographic verification code to this address."
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            disabled={cooldownSeconds > 0 || !email.includes('@')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s to Request` : 'Send 6-Digit Recovery Code'}
          </Button>
        </form>
      )}

      {/* STEP 2: 6-Digit OTP Verification */}
      {currentStep === 'OTP' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 bg-slate-900 text-white rounded-2xl border border-indigo-500/40 shadow-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Enter 6-Digit Reset Code
              </span>
              <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                expirySeconds <= 60 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                ⏱️ {formatTime(expirySeconds)}
              </span>
            </div>

            {/* 6 Individual Digit Inputs */}
            <div className="flex justify-between gap-2">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (otpInputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  onPaste={idx === 0 ? handleOtpPaste : undefined}
                  className="w-11 h-12 text-center text-xl font-bold font-mono bg-slate-800 border border-slate-700 rounded-xl text-cyan-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                />
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Code sent to <span className="text-indigo-300 font-semibold">{email}</span>
              </span>

              <button
                type="button"
                onClick={() => handleRequestReset()}
                disabled={cooldownSeconds > 0 || isLoading}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
              >
                {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend Code'}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setCurrentStep('EMAIL')}
              className="w-1/3"
            >
              Change Email
            </Button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => handleVerifyOtp()}
              isLoading={isLoading}
              disabled={otpDigits.join('').length !== 6 || expirySeconds <= 0}
              className="flex-1"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Verify Code
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Set New Password */}
      {currentStep === 'PASSWORD' && (
        <form onSubmit={handleConfirmReset} className="space-y-4 animate-in fade-in">
          {/* New Password */}
          <div className="space-y-2">
            <Input
              label="New Password *"
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              placeholder="e.g. Cyber@2026Secure"
              maxLength={128}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value.slice(0, 128));
                if (fieldErrors.newPassword) setFieldErrors({});
              }}
              required
              leftIcon={<Lock className="w-4 h-4" />}
              error={fieldErrors.newPassword}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            {/* Password Complexity Guidance Checklist */}
            {newPassword.length > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] rounded-xl space-y-1.5 text-xs animate-in fade-in">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                  Password Security Requirements:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>8+ Characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Small Letters (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Capital Letters (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Numbers (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                    {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                    <span>Special Symbols (@, #, $, %, !, &, *)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <Input
            label="Confirm New Password *"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Re-type your new password"
            maxLength={128}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value.slice(0, 128));
              if (fieldErrors.confirmPassword) setFieldErrors({});
            }}
            required
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.confirmPassword}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Admin 2FA Requirement if enabled */}
          {requires2FA && (
            <div className="pt-2">
              <Input
                label="Administrator 6-Digit Authenticator Code *"
                type="text"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => {
                  setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (fieldErrors.totpCode) setFieldErrors({});
                }}
                required
                leftIcon={<Shield className="w-4 h-4 text-indigo-500" />}
                error={fieldErrors.totpCode}
                className="font-mono text-center tracking-widest text-lg"
                helperText="Required for elevated administrator accounts."
              />
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            rightIcon={<ShieldCheck className="w-4 h-4" />}
          >
            Update Password & Revoke Old Sessions
          </Button>
        </form>
      )}

      {/* STEP 4: Success Screen */}
      {currentStep === 'SUCCESS' && (
        <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto border border-emerald-300 dark:border-emerald-800">
            <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Credentials Secured</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your OffensiveGrid account password has been updated. All previous sessions have been invalidated.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => navigate('/login')}
            className="mt-2"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In Now
          </Button>
        </div>
      )}

      {/* Back to Login Link */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.10)]">
        Remembered your password?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
};
