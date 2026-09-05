import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck,
  Clock,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { authService } from '../../services/api';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Email OTP Verification State
  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Timers: 300s (5-Min) Expiry & 30s Resend Cooldown
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 300s Expiry Countdown
  useEffect(() => {
    if (!otpSent || isEmailVerified || expirySeconds <= 0) return;

    const timer = setInterval(() => {
      setExpirySeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, isEmailVerified, expirySeconds]);

  // 30s Cooldown Countdown
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const cooldownTimer = setInterval(() => {
      setCooldownSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [cooldownSeconds]);

  // Real-time password criteria evaluation
  const hasMinLength = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]/.test(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'first_name' || name === 'last_name') {
      // Strictly allow alphabetic letters, spaces, and hyphens (max 50 chars)
      sanitizedValue = value.replace(/[^A-Za-z\s'-]/g, '').slice(0, 50);
    } else if (name === 'username') {
      // Strictly allow lowercase alphanumeric, underscores, hyphens (max 30 chars)
      sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    } else if (name === 'email') {
      sanitizedValue = value.slice(0, 254);
    } else if (name === 'password' || name === 'confirm_password') {
      sanitizedValue = value.slice(0, 128);
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Trigger Send 6-digit OTP
  const handleSendOtp = async () => {
    const email = formData.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setFieldErrors({ email: 'Please enter a valid email address first.' });
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const res = await authService.sendEmailOtp(email);
      setOtpSent(true);
      setExpirySeconds(res.data?.expires_in_seconds || 300);
      setCooldownSeconds(res.data?.cooldown_seconds || 30);
      setOtpDigits(['', '', '', '', '', '']);

      // Auto focus first OTP input
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Could not send verification code.';
      setFieldErrors({ email: msg });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    setOtpError(null);

    // Auto move to next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto verify if all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      triggerVerifyOtp(fullCode);
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
      triggerVerifyOtp(pasted);
    }
  };

  // Verify OTP submission
  const triggerVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Please enter all 6 digits.');
      return;
    }

    if (expirySeconds <= 0) {
      setOtpError('Verification code has expired. Please click "Resend OTP" for a new code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      await authService.verifyEmailOtp(formData.email.trim().toLowerCase(), code);
      setIsEmailVerified(true);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.message || 'Invalid or expired verification code.';
      setOtpError(msg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Final Registration Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    const errors: Record<string, string> = {};

    // 1. Check Email Verified
    if (!isEmailVerified) {
      errors.email = 'Please verify your email with the 6-digit OTP code before registering.';
    }

    // 2. Username Format Validation
    const usernameRegex = /^[a-z0-9_-]+$/;
    const cleanUsername = formData.username.trim().toLowerCase();

    if (!usernameRegex.test(cleanUsername)) {
      errors.username = 'Username can only contain small letters, numbers, and underscores (e.g. shadow_hunter99).';
    } else if (cleanUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters long.';
    }

    // 3. Password Strength Validation
    if (!hasMinLength) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      errors.password = 'Password is too simple. Must include small letters (a-z), capital letters (A-Z), numbers (0-9), and special symbols (e.g. Pass@1234).';
    }

    // 4. Confirm Password Match
    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Passwords do not match. Please re-enter identical password.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        ...formData,
        username: cleanUsername,
      });
      navigate('/dashboard');
    } catch (err: any) {
      const responseData = err.response?.data;
      if (responseData?.error?.details && typeof responseData.error.details === 'object') {
        const backendErrors: Record<string, string> = {};
        Object.entries(responseData.error.details).forEach(([key, val]) => {
          backendErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
      } else if (responseData?.error?.message) {
        setGeneralError(responseData.error.message);
      } else if (err.message) {
        if (err.message.toLowerCase().includes('username')) {
          setFieldErrors({ username: err.message });
        } else if (err.message.toLowerCase().includes('password')) {
          setFieldErrors({ password: err.message });
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Registration failed. Please review your details and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setGeneralError(null);
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle(credential, undefined, 'register');
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Google registration failed. Please try again.';
      setGeneralError(errorMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Create Trainee Account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Join OffensiveGrid to access live cybersecurity scenarios and compete.
        </p>
      </div>

      {generalError && (
        <Alert variant="error" title="Registration Alert" onClose={() => setGeneralError(null)}>
          <div className="space-y-2">
            <p className="font-medium text-rose-800 dark:text-rose-200 leading-relaxed">{generalError}</p>
            {generalError.toLowerCase().includes('already registered') && (
              <div className="pt-1">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-2xs"
                >
                  Sign In from Login Page →
                </Link>
              </div>
            )}
          </div>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First Name"
            type="text"
            name="first_name"
            placeholder="John"
            maxLength={50}
            autoComplete="given-name"
            value={formData.first_name}
            onChange={handleChange}
          />
          <Input
            label="Last Name"
            type="text"
            name="last_name"
            placeholder="Doe"
            maxLength={50}
            autoComplete="family-name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>

        {/* Username with Duplicate Error Highlighting */}
        <div>
          <Input
            label="Username *"
            type="text"
            name="username"
            placeholder="shadow_hunter99"
            maxLength={30}
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            required
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.username}
            helperText={!fieldErrors.username ? "Use small letters, numbers, and underscores (e.g. shadow_hunter99, max 30 chars)" : undefined}
            className={fieldErrors.username ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : ""}
          />
        </div>

        {/* Email Address with 6-Digit OTP Verification Pipeline */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Email Address *
            </span>
            {isEmailVerified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Email Verified
              </span>
            )}
          </label>

          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="email"
                name="email"
                placeholder="trainee@organization.com"
                maxLength={254}
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                disabled={isEmailVerified}
                required
                className={`block w-full rounded-lg border bg-white dark:bg-[rgba(17,24,39,0.70)] px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  isEmailVerified
                    ? 'bg-slate-50 dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 text-slate-600 dark:text-slate-400 cursor-not-allowed'
                    : fieldErrors.email
                    ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400'
                    : 'border-slate-200 dark:border-[rgba(148,163,184,0.10)] focus:border-indigo-500'
                }`}
              />
            </div>

            {!isEmailVerified && (
              <Button
                type="button"
                variant={otpSent ? "outline" : "primary"}
                size="sm"
                onClick={handleSendOtp}
                isLoading={isSendingOtp}
                disabled={cooldownSeconds > 0 || !formData.email.includes('@')}
                className="shrink-0 text-xs whitespace-nowrap"
                leftIcon={otpSent ? <RefreshCw className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              >
                {cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : otpSent
                  ? 'Resend OTP'
                  : 'Send Code 📩'}
              </Button>
            )}
          </div>

          {fieldErrors.email && (
            <p className="text-xs text-rose-600 font-medium">{fieldErrors.email}</p>
          )}

          {/* 6-Digit OTP Verification Box */}
          {otpSent && !isEmailVerified && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl border border-indigo-500/40 shadow-md space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Enter 6-Digit Verification Code
                </span>
                <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  expirySeconds <= 30 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
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

              {otpError && (
                <p className="text-xs text-rose-400 font-medium text-center">{otpError}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Code sent to <span className="text-indigo-300 font-semibold">{formData.email}</span> (Check Inbox/Spam)
                </span>

                <Button
                  type="button"
                  variant="cyber"
                  size="sm"
                  onClick={() => triggerVerifyOtp()}
                  isLoading={isVerifyingOtp}
                  disabled={otpDigits.join('').length !== 6 || expirySeconds <= 0}
                  className="!text-xs !py-1 !px-3"
                >
                  Verify Code
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Password Input with Eye Toggle and Complexity Highlighting */}
        <div className="space-y-2">
          <Input
            label="Password *"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="e.g. Cyber@2026Secure"
            maxLength={128}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            required
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.password}
            className={fieldErrors.password ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : ""}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Real-time Password Complexity Guidance Checklist */}
          {formData.password.length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-[rgba(17,24,39,0.70)] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] rounded-xl space-y-1.5 text-xs animate-in fade-in">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                Password Security Checklist:
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

        {/* Confirm Password Input with Eye Toggle */}
        <div>
          <Input
            label="Confirm Password *"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirm_password"
            placeholder="Re-type your password"
            maxLength={128}
            autoComplete="new-password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            leftIcon={<Lock className="w-4 h-4" />}
            error={fieldErrors.confirm_password}
            className={fieldErrors.confirm_password ? "border-rose-400 bg-rose-50/20 ring-1 ring-rose-400" : ""}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="p-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        {/* Dual Action Buttons (Side by Side) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full h-11 text-xs sm:text-sm font-bold shadow-2xs"
            isLoading={isLoading}
            disabled={!isEmailVerified}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {isEmailVerified ? 'Register Account' : 'Verify & Register'}
          </Button>

          <GoogleLoginButton
            text="signup_with"
            label="Google"
            onSuccess={handleGoogleSuccess}
            onError={(err) => setGeneralError(err)}
            isLoading={isGoogleLoading}
          />
        </div>
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.10)]">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline">
          Sign in here
        </Link>
      </div>
    </div>
  );
};
