import React, { useState } from 'react';
import { UserProfile, Birthwish } from '../types';
import { 
  KORA_PREMIUM_CHECKOUT_URL, 
  activateUserPremium, 
  getUserQuota, 
  isFounderAdmin 
} from '../lib/subscription';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  X, 
  Check, 
  Crown, 
  ShieldCheck, 
  CreditCard, 
  ExternalLink, 
  Zap, 
  Heart, 
  Gift, 
  Lock, 
  CheckCircle2, 
  Flame, 
  ArrowRight,
  Terminal,
  Code2,
  Clock,
  Layers
} from 'lucide-react';

interface PremiumSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  wishes: Birthwish[];
  onSubscriptionSuccess: (updatedUser: UserProfile) => void;
  theme?: 'dark' | 'light';
  reason?: 'limit_reached' | 'manual_upgrade';
}

export const PremiumSubscriptionModal: React.FC<PremiumSubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  wishes,
  onSubscriptionSuccess,
  theme = 'dark',
  reason = 'limit_reached',
}) => {
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [activationCode, setActivationCode] = useState<string>('');
  const [showManualVerify, setShowManualVerify] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const quota = getUserQuota(user, wishes);
  const isFounder = isFounderAdmin(user?.email);

  const handleOpenKoraCheckout = () => {
    // Open Kora test checkout link in new tab safely
    window.open(KORA_PREMIUM_CHECKOUT_URL, '_blank', 'noopener,noreferrer');
    setShowManualVerify(true);
  };

  const handleConfirmAndActivate = async () => {
    if (!user) return;
    setIsActivating(true);

    try {
      // Activate 30-day premium plan for user
      const updated = await activateUserPremium(user, 30);
      setSuccessNotice(true);

      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#ec4899', '#fbbf24', '#f43f5e', '#10b981', '#ffffff'],
      });

      setTimeout(() => {
        onSubscriptionSuccess(updated);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Activation failed:', err);
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[#080d1a] border border-pink-500/30 rounded-3xl p-5 sm:p-8 text-left shadow-2xl relative text-slate-100 max-h-[94vh] overflow-y-auto"
        style={{
          boxShadow: '0 0 60px rgba(236, 72, 153, 0.25), 0 25px 50px rgba(0, 0, 0, 0.9)'
        }}
      >
        {/* Subtle Kora-Style Gridlines Background Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-3xl"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Kora Developer Inspired Badge Header */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-amber-500/20 border border-pink-500/40 text-[11px] font-mono font-bold text-pink-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Kora Direct Payment Rail · 1-Month Unlimited</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-slate-400">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>test-checkout.korapay.com</span>
          </div>
        </div>

        {/* Founder Exemption Notice if Admin opens */}
        {isFounder ? (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-pink-500/15 to-purple-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3">
            <Crown className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Founder &amp; Creator Privileges Active</span>
                <span className="text-[10px] font-mono bg-amber-400/20 px-2 py-0.5 rounded text-amber-300 font-bold uppercase">
                  Permanent VIP
                </span>
              </p>
              <p className="text-slate-300 text-xs">
                As the admin and founder of Birthwish (<span className="font-mono text-white underline">{user?.email}</span>), 
                subscription limits do not apply to you. You have unrestricted lifetime access to create unlimited Birthwishes.
              </p>
            </div>
          </div>
        ) : null}

        {/* Main Title & Limit Warning */}
        <div className="relative z-10 space-y-2 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/30">
              <Crown className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {reason === 'limit_reached' 
                  ? "You've Used All 3 Free Birthwishes!" 
                  : "Upgrade to Birthwish Premium"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-sans">
                {reason === 'limit_reached'
                  ? "Each user receives 3 complimentary lucky Birthwishes. Subscribe to Premium for 1 month of unlimited creation."
                  : "Elevate your celebrations with unlimited heartfelt tributes, 3D interactive cakes, and priority support."}
              </p>
            </div>
          </div>
        </div>

        {/* Quota Meter Card (Kora Telemetry Style) */}
        {!isFounder && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 mb-6 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" />
                <span>Your Complimentary Free Quota</span>
              </span>
              <span className="font-mono font-bold text-pink-400">
                {quota.usedCount} / {quota.maxLimit} Wishes Used
              </span>
            </div>

            {/* Visual Meter Bar */}
            <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (quota.usedCount / quota.maxLimit) * 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-400 font-mono">
              <span className="text-rose-400 font-semibold">
                {quota.remainingCount === 0 ? 'Quota fully utilized' : `${quota.remainingCount} free wish remaining`}
              </span>
              <span>Reset via Premium: <strong>Unlimited</strong></span>
            </div>
          </div>
        )}

        {/* Feature Comparison Matrix: Free vs Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {/* Free Tier Card */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs space-y-3 opacity-75">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Free Tier</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400">Current</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              ₦0 <span className="text-xs text-slate-400 font-normal">/ Forever</span>
            </div>
            <ul className="space-y-2 text-slate-400 text-[11px]">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] shrink-0 font-bold">3</span>
                <span>Maximum 3 Birthwishes Total</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Basic Rainbow Theme Palette</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Shareable Web View Link</span>
              </li>
            </ul>
          </div>

          {/* Premium Tier Card (Hero) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-amber-500/15 border-2 border-pink-500/50 text-xs space-y-3 relative shadow-xl shadow-pink-500/10">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-amber-400 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-md">
              Most Loved
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-pink-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Birthwish Premium</span>
              </span>
            </div>
            <div className="text-xl font-black text-white font-mono flex items-baseline gap-1.5">
              <span>₦3,500</span>
              <span className="text-xs text-slate-300 font-normal">/ 1 Full Month (30 Days)</span>
            </div>
            <ul className="space-y-2 text-slate-200 text-[11px]">
              <li className="flex items-center gap-2 font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Unlimited Birthwishes for 1 Month</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All 8 Rainbow Color Themes &amp; Particle Effects</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>3D Interactive Cake with Candle Blowing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standalone Physical Keepsake .HTML Export</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Kora Cash Gift Vault Integration Priority</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Success Notice Animation */}
        {successNotice ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-1.5 animate-fade-in my-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-base text-white">Premium Subscription Activated! 🎉</h4>
            <p className="text-xs text-slate-200">
              Welcome to Birthwish Premium. You can now create unlimited birthwishes for the next 30 days.
            </p>
          </div>
        ) : null}

        {/* CTA Buttons */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={handleOpenKoraCheckout}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-sm shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>Pay with Kora · Subscribe for 1 Month</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Verification section after clicking checkout */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/10 text-center space-y-2">
            <p className="text-xs text-slate-300">
              Already completed payment on the Kora checkout tab?
            </p>
            <button
              type="button"
              disabled={isActivating || !user}
              onClick={handleConfirmAndActivate}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{isActivating ? 'Verifying with Kora...' : 'Confirm Payment & Activate 1-Month Plan'}</span>
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secure 256-Bit Kora Encryption</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active for 30 Full Days</span>
            </span>
            <span>·</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
