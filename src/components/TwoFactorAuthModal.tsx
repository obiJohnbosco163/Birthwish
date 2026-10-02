import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  Smartphone, 
  ArrowRight, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  X
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  sendVerificationSecurityCode, 
  verifySecurityCode, 
  getPendingVerificationSession 
} from '../lib/firebase';

interface TwoFactorAuthModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  initialTarget?: string;
  theme?: 'dark' | 'light';
  onVerified: (user: UserProfile) => void;
  onCancel: () => void;
}

export const TwoFactorAuthModal: React.FC<TwoFactorAuthModalProps> = ({
  isOpen,
  userProfile,
  initialTarget,
  theme = 'light',
  onVerified,
  onCancel,
}) => {
  const isLight = theme === 'light';

  // Target channel: email or phone
  const defaultTargetType = initialTarget?.includes('@') || !initialTarget ? 'email' : 'phone';
  const [targetType, setTargetType] = useState<'email' | 'phone'>(defaultTargetType);
  const [targetValue, setTargetValue] = useState<string>(
    initialTarget || userProfile.phoneNumber || userProfile.email
  );

  // Verification code input
  const [code, setCode] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [simulatedSecurityCode, setSimulatedSecurityCode] = useState<string | null>(null);

  // Automatically dispatch code on mount or when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Check if there is already an active session
    const existing = getPendingVerificationSession();
    if (existing && existing.userProfile.id === userProfile.id) {
      setTargetValue(existing.target);
      setTargetType(existing.targetType);
      setCodeSent(true);
      setSimulatedSecurityCode(existing.code);
      setSuccessNotice(`Verification code sent to ${existing.target}`);
      return;
    }

    // Trigger initial code dispatch
    const defaultVal = targetType === 'phone' 
      ? (userProfile.phoneNumber || targetValue)
      : userProfile.email;
    
    dispatchCode(defaultVal, targetType);
  }, [isOpen]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const dispatchCode = async (target: string, type: 'email' | 'phone') => {
    if (!target.trim()) {
      setError(type === 'email' ? 'Please specify a valid email address.' : 'Please enter a valid phone number.');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      const res = await sendVerificationSecurityCode(
        userProfile, 
        target.trim(), 
        type, 
        'recaptcha-verifier-container'
      );
      setCodeSent(true);
      setSimulatedSecurityCode(res.demoCodeNotice || null);
      setSuccessNotice(`A 6-digit verification code has been dispatched to your ${type === 'email' ? 'Email' : 'Phone Number'}: ${target.trim()}`);
      setCountdown(45);
    } catch (err: any) {
      setError(err?.message || 'Failed to dispatch verification code. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || code.trim().length < 6) {
      setError('Please enter the full 6-digit security code.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const verifiedProfile = await verifySecurityCode(code.trim());
      // Attach verified phone if target was phone
      if (targetType === 'phone') {
        verifiedProfile.phoneNumber = targetValue.trim();
      }
      onVerified(verifiedProfile);
    } catch (err: any) {
      setError(err?.message || 'Invalid security code. Please check and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSwitchChannel = (newType: 'email' | 'phone') => {
    setTargetType(newType);
    const newTarget = newType === 'email' 
      ? userProfile.email 
      : (userProfile.phoneNumber || targetValue || '+1');
    setTargetValue(newTarget);
    setCode('');
    setError(null);
    dispatchCode(newTarget, newType);
  };

  const handleAutoFillDemoCode = () => {
    if (simulatedSecurityCode) {
      setCode(simulatedSecurityCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl relative transition-all ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900 shadow-slate-200/80' 
            : 'bg-[#0f1422] border-white/15 text-white shadow-black/80'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'
          }`}
          title="Cancel Verification"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-500/10 text-pink-500 border border-pink-500/20">
              Firebase Security Verification
            </span>
            <h2 className="font-haute text-xl sm:text-2xl font-bold mt-0.5">
              Two-Factor Authentication
            </h2>
          </div>
        </div>

        <p className={`text-xs mb-5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
          To protect your Birthwish creator account and celebrate with security, enter the 6-digit confirmation code dispatched to your account.
        </p>

        {/* Channel Selection Toggle */}
        <div className={`p-1 rounded-2xl flex gap-1 mb-5 border ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
        }`}>
          <button
            type="button"
            onClick={() => handleSwitchChannel('email')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'email'
                ? isLight 
                  ? 'bg-white text-pink-600 shadow-sm' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send to Email</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchChannel('phone')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              targetType === 'phone'
                ? isLight 
                  ? 'bg-white text-pink-600 shadow-sm' 
                  : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Send to Phone / SMS</span>
          </button>
        </div>

        {/* Target Destination Display */}
        <div className={`p-3.5 rounded-2xl mb-4 border flex items-center justify-between text-xs ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.03] border-white/10'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            {targetType === 'email' ? (
              <Mail className="w-4 h-4 text-pink-500 shrink-0" />
            ) : (
              <Smartphone className="w-4 h-4 text-emerald-500 shrink-0" />
            )}
            <span className="font-semibold truncate">{targetValue}</span>
          </div>

          <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Code Sent</span>
          </span>
        </div>

        {/* Demo Simulated Banner / Instant Fill Assist */}
        {simulatedSecurityCode && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[11px]">Demo Security Dispatch:</span>
              <span className="font-mono font-bold tracking-widest text-sm bg-amber-500/20 px-2 py-0.5 rounded">
                {simulatedSecurityCode}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemoCode}
              className="underline text-[11px] font-bold hover:text-amber-400 cursor-pointer"
            >
              Autofill
            </button>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 6-Digit Code Form */}
        <form onSubmit={handleVerifySubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Enter 6-Digit Verification Code
            </label>
            <div className="relative">
              <Lock className={`absolute left-3.5 top-3.5 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="• • • • • •"
                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-center font-mono font-bold tracking-[0.5em] text-lg sm:text-xl focus:outline-none focus:border-pink-500 transition-colors ${
                  isLight 
                    ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                    : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                }`}
              />
            </div>
          </div>

          {/* Submit & Verify */}
          <button
            type="submit"
            disabled={isVerifying || code.length < 6}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Confirm & Enter Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend actions */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <button
            type="button"
            disabled={isSending || countdown > 0}
            onClick={() => dispatchCode(targetValue, targetType)}
            className={`font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
              isLight ? 'text-pink-600 hover:text-pink-700' : 'text-pink-400 hover:text-pink-300'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
            <span>
              {countdown > 0 ? `Resend Code in ${countdown}s` : 'Resend Code'}
            </span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className={`transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cancel and Back
          </button>
        </div>
        {/* Invisible Recaptcha Container for Firebase Phone Auth SDK */}
        <div id="recaptcha-verifier-container" className="hidden"></div>
      </div>
    </div>
  );
};
