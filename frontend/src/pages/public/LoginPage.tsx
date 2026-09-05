import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound, Shield } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { CyberCaptcha, generateCaptchaCode } from '../../components/common/CyberCaptcha';
import { TOTPSetupModal } from '../../components/auth/TOTPSetupModal';
import { GoogleLoginButton } from '../../components/auth/GoogleLoginButton';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptcha, setCurrentCaptcha] = useState(() => generateCaptchaCode(8));
  const [isCaptchaExpired, setIsCaptchaExpired] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 2FA State
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Google Login State
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaptchaError(null);

    // 1. If completing Google 2FA
    if (googleToken && showOtpInput) {
      setIsLoading(true);
      try {
        const response = await loginWithGoogle(googleToken, otp);
        if (response.requires_totp_setup) {
          setShowSetupModal(true);
          return;
        }
        const user = response.user;
        if (user.primary_role === 'ADMIN' || user.primary_role === 'SUPER_ADMIN') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
        return;
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.message || 'Invalid 2FA code.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    // 2. Check CAPTCHA Expiry
    if (!showOtpInput && isCaptchaExpired) {
      setCaptchaError('CAPTCHA has expired (30s limit reached). Please reload CAPTCHA to get a new 8-character code.');
      return;
    }

    // 3. Check CAPTCHA Value (Uppercase match)
    if (!showOtpInput && (!captchaInput.trim() || captchaInput.trim().toUpperCase() !== currentCaptcha.toUpperCase())) {
      setCaptchaError('Invalid CAPTCHA code. Please enter the 8 characters shown in the security box.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({ email, password, otp: showOtpInput ? otp : undefined });
      
      if (response.requires_totp_setup) {
        setShowSetupModal(true);
        return;
      }
      
      const user = response.user;
      if (user.primary_role === 'ADMIN' || user.primary_role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const data = err.response?.data;
      const details = data?.error?.details || {};
      
      const isOtpRequired = 
        data?.code === 'otp_required' || 
        data?.otp || 
        data?.error?.code === 'otp_required' ||
        (Array.isArray(details.code) && details.code[0] === 'otp_required') ||
        details.otp;

      if (isOtpRequired) {
        setShowOtpInput(true);
        setError(Array.isArray(details.otp) ? details.otp[0] : 'Two-Factor Authentication is required. Please enter your 6-digit code.');
        return;
      }

      let errorMsg = 'Invalid email/username or password. Please verify your credentials.';

      if (data?.error?.details && typeof data.error.details === 'object') {
        const details = data.error.details;
        if (details.non_field_errors) {
          errorMsg = Array.isArray(details.non_field_errors) ? details.non_field_errors[0] : details.non_field_errors;
        } else if (details.otp) {
          errorMsg = Array.isArray(details.otp) ? details.otp[0] : details.otp;
        } else if (details.email) {
          errorMsg = Array.isArray(details.email) ? details.email[0] : details.email;
        } else if (details.password) {
          errorMsg = Array.isArray(details.password) ? details.password[0] : details.password;
        } else {
          const firstKey = Object.keys(details)[0];
          if (firstKey) {
            const firstError = details[firstKey];
            errorMsg = Array.isArray(firstError) ? firstError[0] : String(firstError);
          }
        }
      } else {
        errorMsg =
          data?.error?.message ||
          data?.message ||
          (Array.isArray(data?.non_field_errors)
            ? data?.non_field_errors[0]
            : typeof data?.non_field_errors === 'string'
            ? data?.non_field_errors
            : null) ||
          err.message ||
          errorMsg;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError(null);
    setIsGoogleLoading(true);
    setGoogleToken(credential);

    try {
      const response = await loginWithGoogle(credential);
      if (response.requires_totp_setup) {
        setShowSetupModal(true);
        return;
      }
      const user = response.user;
      if (user.primary_role === 'ADMIN' || user.primary_role === 'SUPER_ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const data = err.response?.data;
      const details = data?.error?.details || {};
      const isOtpRequired =
        data?.code === 'otp_required' ||
        data?.error?.code === 'otp_required' ||
        details?.code === 'otp_required' ||
        err.message?.includes('2FA is required');

      if (isOtpRequired) {
        setShowOtpInput(true);
        setError('Two-Factor Authentication is required for administrator accounts. Please enter your 6-digit Authenticator code above and click Verify.');
      } else {
        setError(data?.error?.message || err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleQuickFill = (type: 'admin' | 'student') => {
    if (type === 'admin') {
      setEmail('admin@cszone.io');
      setPassword('admin12345');
    } else {
      setEmail('student@cszone.io');
      setPassword('student12345');
    }
    setCaptchaInput(currentCaptcha);
    setError(null);
    setCaptchaError(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sign in to OffensiveGrid</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter your credentials and security verification to access CTF labs and tournament portals.
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Authentication Failed">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email or Username */}
        <Input
          label="Email or Username *"
          type="text"
          placeholder="trainee@cszone.io"
          maxLength={254}
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          leftIcon={<Mail className="w-4 h-4" />}
        />

        {/* Password with Eye Toggle */}
        <div className="space-y-1">
          <Input
            label="Password *"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            maxLength={128}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            leftIcon={<Lock className="w-4 h-4" />}
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
          <div className="flex justify-end pt-0.5">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        {/* 8-Character CAPTCHA with 30s Countdown (Capital Letters + Numbers Only) */}
        {!showOtpInput && (
          <>
            <CyberCaptcha
              captchaValue={currentCaptcha}
              onCaptchaChange={(code) => {
                setCurrentCaptcha(code);
                setCaptchaError(null);
              }}
              isExpired={isCaptchaExpired}
              onExpireChange={(exp) => setIsCaptchaExpired(exp)}
            />

            {/* CAPTCHA Input Field (Auto-uppercased) */}
            <div className="pt-1">
              <Input
                label="Enter 8-Character Security Code *"
                type="text"
                placeholder="TYPE CODE HERE..."
                value={captchaInput}
                onChange={(e) => {
                  setCaptchaInput(e.target.value.toUpperCase());
                  if (captchaError) setCaptchaError(null);
                }}
                required
                maxLength={8}
                autoComplete="off"
                leftIcon={<KeyRound className="w-4 h-4" />}
                error={captchaError || undefined}
                className={`font-mono text-sm tracking-widest font-bold uppercase ${
                  captchaError ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-400' : ''
                }`}
                helperText={!captchaError ? "8-character code (Capital Letters & Numbers only, expires in 30s)" : undefined}
              />
            </div>
          </>
        )}

        {/* 2FA OTP Input */}
        {showOtpInput && (
          <div className="pt-2">
            <Input
              label="6-Digit 2FA Code *"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              maxLength={6}
              autoComplete="one-time-code"
              leftIcon={<Shield className="w-4 h-4 text-indigo-500" />}
              className="font-mono text-center tracking-widest text-lg"
            />
          </div>
        )}

        {/* Dual Action Buttons (Side by Side) */}
        {!showOtpInput ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full h-11 text-xs sm:text-sm font-bold shadow-2xs"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>

            <GoogleLoginButton
              label="Google"
              onSuccess={handleGoogleSuccess}
              onError={(err) => setError(err)}
              isLoading={isGoogleLoading}
            />
          </div>
        ) : (
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-2 h-11 font-bold"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Verify 2FA & Sign In
          </Button>
        )}
      </form>

      <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-[rgba(148,163,184,0.10)]">
        Don't have a trainee account yet?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline">
          Register here
        </Link>
      </div>
      
      <TOTPSetupModal 
        isOpen={showSetupModal} 
        onSuccess={() => {
          setShowSetupModal(false);
          navigate('/admin');
        }} 
      />
    </div>
  );
};
