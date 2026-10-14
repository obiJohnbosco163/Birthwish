import React, { useState, useEffect } from 'react';
import { Birthwish } from '../types';
import confetti from 'canvas-confetti';
import { 
  CreditCard, 
  X, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  Gift,
  Bell,
  Check,
  Building2,
  Smartphone,
  ArrowRight,
  Clock
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  wish: Birthwish;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  onPaymentSuccess?: (response: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  wish,
  themePrimaryColor = '#ec4899',
  themeSecondaryColor = '#fbbf24',
}) => {
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'preview'>('overview');
  const [previewAmount, setPreviewAmount] = useState<number>(wish.giftAmount || 5000);
  const [previewPasscode, setPreviewPasscode] = useState<string>(wish.giftPasscode || 'QUEEN2026');

  useEffect(() => {
    // Check if user already joined waitlist
    const stored = localStorage.getItem('birthwish_kora_waitlist');
    if (stored) {
      setIsJoined(true);
      setWaitlistEmail(stored);
    }
  }, []);

  if (!isOpen) return null;

  const handleJoinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail.trim() || !waitlistEmail.includes('@')) return;

    localStorage.setItem('birthwish_kora_waitlist', waitlistEmail.trim());
    setIsJoined(true);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#fbbf24', '#10b981', '#3b82f6']
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0c101d] border rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative text-slate-100 max-h-[92vh] overflow-y-auto"
        style={{
          borderColor: `${themePrimaryColor}50`,
          boxShadow: `0 0 50px ${themePrimaryColor}30, 0 20px 40px rgba(0,0,0,0.9)`
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Coming Soon Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/30 mb-4">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Feature Preview · Coming Soon</span>
        </div>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0"
            style={{ 
              backgroundColor: `${themePrimaryColor}20`,
              borderColor: `${themePrimaryColor}40`
            }}
          >
            <Gift className="w-6 h-6" style={{ color: themeSecondaryColor }} />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
              <span>Birthday Cash Gift Vault</span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Powered by Kora Payment Gateway</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-emerald-400 font-mono">In Integration</span>
            </p>
          </div>
        </div>

        {/* Celebrant Target Summary */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs mb-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={wish.mainImage}
                alt={wish.celebrantName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />
              <span className="absolute -bottom-1 -right-1 text-xs">👑</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">{wish.celebrantName}</p>
              <p className="text-[11px] text-slate-400">
                Celebration Tribute by <span className="text-pink-400 font-semibold">{wish.senderName}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold font-mono uppercase">
              Vault Ready
            </span>
          </div>
        </div>

        {/* Tabs: Overview vs How It Works */}
        <div className="flex border-b border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Launch Notice &amp; VIP Waitlist
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 px-3 text-xs font-semibold cursor-pointer border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            How Kora Vault Will Work
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-5">
            {/* Announcement Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Launching Soon on Birthwish</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct monetary gifts with instant settlement are undergoing final merchant bank clearance with Kora Pay. To ensure a flawless banking experience with zero failed transactions, live checkout links are temporarily paused.
              </p>
            </div>

            {/* What's Coming Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cards &amp; USSD</span>
                </div>
                <p className="text-[11px] text-slate-400">Pay with Visa, Mastercard, Verve, or direct bank transfer.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Passcode Lock</span>
                </div>
                <p className="text-[11px] text-slate-400">Cash is locked in holding until the celebrant enters the secret passcode.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Building2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>Direct Bank Payout</span>
                </div>
                <p className="text-[11px] text-slate-400">Instant withdrawal to Access, GTBank, Zenith, Kuda, Moniepoint &amp; OPay.</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mobile Money</span>
                </div>
                <p className="text-[11px] text-slate-400">Cross-border payout support for MTN MoMo (Ghana) &amp; M-Pesa (Kenya).</p>
              </div>
            </div>

            {/* VIP Waitlist / Notification Form */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Bell className="w-4 h-4 text-pink-400" />
                <span>Get Notified First When Cash Gifts Launch</span>
              </div>

              {isJoined ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <div>
                    <p className="font-bold">You are on the Priority VIP List!</p>
                    <p className="text-[11px] text-emerald-400/80">
                      We will notify you at <span className="font-mono underline">{waitlistEmail}</span> the instant Kora Cash Gifting is officially switched on.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleJoinWaitlist} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-lg shadow-pink-500/25 shrink-0"
                    >
                      Notify Me
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Zero spam. We will only send a single notification when live Kora payments are live.
                  </p>
                </form>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
              >
                Return to Celebration
              </button>
            </div>
          </div>
        ) : (
          /* Preview Interactive Spec */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3 text-xs">
              <p className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>The 3-Step Vault Architecture</span>
              </p>

              <div className="space-y-2 text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <p><strong className="text-white">Giver deposits cash:</strong> You fund an amount (e.g. ₦5,000) using Kora&apos;s checkout gateway.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <p><strong className="text-white">Escrow Holding:</strong> Money sits safely in the Birthwish Vault protected by your secret passcode.</p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <p><strong className="text-white">Instant Disbursal:</strong> On celebration day, {wish.celebrantName} enters the passcode and funds disburse directly to their bank account.</p>
                </div>
              </div>
            </div>

            {/* Sample Calculator Preview */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Sample Gift Value Simulation
              </label>
              <div className="flex items-center gap-2">
                {[2000, 5000, 10000, 25000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPreviewAmount(amt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      previewAmount === amt
                        ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs flex justify-between items-center font-mono">
                <span className="text-slate-400">Net Received by Celebrant:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  ₦{previewAmount.toLocaleString()} NGN (100%)
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-pink-500/20"
              >
                Join VIP Waitlist
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
