import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Lock,
  User,
  Mail,
  Eye,
  EyeOff,
  Check,
  X,
  Clock,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { apiClient, authService } from '../../services/api';

export const AdminInviteRegister: React.FC = () => {
  const [searchParams] = useSearchParams();
  const inviteKey = searchParams.get('key');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    if (!inviteKey) {
      setGeneralError('Invalid or missing invite key.');
    }
  }, [inviteKey]);

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

  // Password Validation Criteria
  const hasMinLength = formData.password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(formData.password);
  const hasLowerCase = /[a-z]/.test(formData.password);
  const hasNumber = /\d/.test(formData.password);
  const hasSpecial = /[@$!%*?&#^()_+\-=\[\]{};:\'",.<>\/\\|`~]/.test(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === 'firstName' || name === 'lastName') {
      // Strictly allow alphabetic letters, spaces, and hyphens (max 50 chars)
      sanitizedValue = value.replace(/[^A-Za-z\s'-]/g, '').slice(0, 50);
    } else if (name === 'username') {
      // Strictly allow lowercase alphanumeric, underscores, hyphens (max 30 chars)
      sanitizedValue = value.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    } else if (name === 'email') {
      sanitizedValue = value.slice(0, 254);
    } else if (name === 'password' || name === 'confirmPassword') {
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

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteKey) return;
    
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
      errors.username = 'Username can only contain small letters, numbers, and underscores.';
    } else if (cleanUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters long.';
    }

    // 3. Password Strength Validation
    if (!hasMinLength) {
      errors.password = 'Password must be at least 8 characters long.';
    } else if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      errors.password = 'Password is too simple. Must include small letters, capital letters, numbers, and special symbols.';
    }

    // 4. Confirm Password Match
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/admin/register/', {
        invite_key: inviteKey,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username: cleanUsername,
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (response.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      }
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
      } else if (responseData?.message) {
        setGeneralError(responseData.message);
      } else if (err.message) {
        if (err.message.toLowerCase().includes('username')) {
          setFieldErrors({ username: err.message });
        } else if (err.message.toLowerCase().includes('email')) {
          setFieldErrors({ email: err.message });
        } else if (err.message.toLowerCase().includes('password')) {
          setFieldErrors({ password: err.message });
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError('Failed to register admin account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  if (!inviteKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-slate-500 mt-2">A valid invite key is required to register an admin account.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldCheck className="w-16 h-16 text-emerald-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Account Created</h2>
        <p className="text-slate-500 mt-2">Redirecting to login portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
          Admin Registration
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete your profile to activate your administrative privileges.
        </p>
      </div>

      {generalError && (
        <Alert variant="error" title="Registration Failed">
          {generalError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            type="text"
            name="firstName"
            placeholder="John"
            maxLength={50}
            autoComplete="given-name"
            value={formData.firstName}
            onChange={handleChange}
            required
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.firstName}
          />
          <Input
            label="Last Name"
            type="text"
            name="lastName"
            placeholder="Doe"
            maxLength={50}
            autoComplete="family-name"
            value={formData.lastName}
            onChange={handleChange}
            required
            leftIcon={<User className="w-4 h-4" />}
            error={fieldErrors.lastName}
          />
        </div>

        <Input
          label="Username"
          type="text"
          name="username"
          placeholder="admin_lead"
          maxLength={30}
          autoComplete="username"
          value={formData.username}
          onChange={handleChange}
          required
          leftIcon={<User className="w-4 h-4" />}
          error={fieldErrors.username}
          helperText={!fieldErrors.username ? "Use small letters, numbers, and underscores (max 30 chars)" : undefined}
        />

        {/* OTP Email Verification Section */}
        <div className="space-y-2">
          <Input
            label="Email Address *"
            name="email"
            type="email"
            placeholder="admin@cszone.io"
            maxLength={254}
            autoComplete="email"
            value={formData.email}
            onChange={(e) => {
              handleChange(e);
              setOtpSent(false);
              setIsEmailVerified(false);
            }}
            required
            disabled={isEmailVerified}
            leftIcon={<Mail className="w-4 h-4" />}
            error={fieldErrors.email}
            rightIcon={
              isEmailVerified ? (
                <div className="flex items-center gap-1 text-white bg-emerald-500 dark:bg-emerald-600 px-2 py-1 rounded-md text-[11px] font-bold shadow-sm mr-1">
                  <Check className="w-3.5 h-3.5" />
                  VERIFIED
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleSendOtp}
                  isLoading={isSendingOtp}
                  disabled={cooldownSeconds > 0 || !formData.email || isSendingOtp}
                  className="mr-1 h-7 text-xs px-2"
                >
                  {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
              )
            }
          />

          {/* OTP Input UI */}
          {otpSent && !isEmailVerified && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Enter the 6-digit code sent to your email
                </p>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  {expirySeconds > 0 ? (
                    <span className="text-indigo-600 dark:text-indigo-400">{formatTime(expirySeconds)}</span>
                  ) : (
                    <span className="text-rose-500">Expired</span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-between">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    disabled={isVerifyingOtp || expirySeconds <= 0}
                    className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                  />
                ))}
              </div>
              
              {otpError && (
                <p className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1">
                  <X className="w-3.5 h-3.5" />
                  {otpError}
                </p>
              )}
            </div>
          )}
        </div>

        <Input
          label="Password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="e.g. Admin@2026Secure"
          maxLength={128}
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          required
          leftIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {/* Password Strength Indicator */}
        {formData.password && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Password Requirements:</p>
            <ul className="space-y-1.5 grid grid-cols-1 sm:grid-cols-2">
              <li className={`text-xs flex items-center gap-2 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                Min 8 characters
              </li>
              <li className={`text-xs flex items-center gap-2 ${hasUpperCase && hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                {hasUpperCase && hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                Uppercase & lowercase
              </li>
              <li className={`text-xs flex items-center gap-2 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                {hasNumber ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                At least one number
              </li>
              <li className={`text-xs flex items-center gap-2 ${hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-500'}`}>
                {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600" />}
                Special symbol (@$!%*?)
              </li>
            </ul>
          </div>
        )}

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Re-type your password"
          maxLength={128}
          autoComplete="new-password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          leftIcon={<Lock className="w-4 h-4" />}
          error={fieldErrors.confirmPassword}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Create Admin Account
        </Button>
      </form>
    </div>
  );
};
