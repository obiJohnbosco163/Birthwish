import React, { useState } from 'react';
import { Birthwish } from '../types';
import { initializeKoraHoldingPayment, KoraInitializeResponse } from '../lib/kora';
import { 
  CreditCard, 
  X, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck,
  Gift
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  wish: Birthwish;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  onPaymentSuccess?: (response: KoraInitializeResponse) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  wish,
  themePrimaryColor = '#ec4899',
  themeSecondaryColor = '#fbbf24',
  onPaymentSuccess,
}) => {
  const initialAmount = wish.giftAmount && wish.giftAmount > 0 ? wish.giftAmount : 5000;
  const [amount, setAmount] = useState<number>(initialAmount);
  const [senderName, setSenderName] = useState<string>(wish.senderName || '');
  const [senderEmail, setSenderEmail] = useState<string>('sender@birthwish.app');
  const [passcode, setPasscode] = useState<string>(wish.giftPasscode || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [initResult, setInitResult] = useState<KoraInitializeResponse | null>(null);

  if (!isOpen) return null;

  const handleInitializePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 500) {
      setErrorMsg('The minimum monetary gift amount is ₦500.');
      return;
    }
    if (!senderEmail.trim()) {
      setErrorMsg('Please enter an email address for payment notification receipts.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      // Trigger the Kora payment initialization endpoint passing wish amount & celebrant details
      const response = await initializeKoraHoldingPayment({
        amount,
        currency: wish.giftCurrency || 'NGN',
        senderName: senderName.trim() || 'Well-Wisher',
        senderEmail: senderEmail.trim(),
        celebrantName: wish.celebrantName,
        passcode: passcode.trim(),
      });

      setInitResult(response);
      if (onPaymentSuccess) {
        onPaymentSuccess(response);
      }

      // If Kora returned a live checkout URL, offer 1-click launch
      if (response.checkoutUrl) {
        window.open(response.checkoutUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      setErrorMsg(err.message || 'Payment initialization encountered an issue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#0c101d] border rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative text-slate-100"
        style={{
          borderColor: `${themePrimaryColor}50`,
          boxShadow: `0 0 40px ${themePrimaryColor}25, 0 20px 40px rgba(0,0,0,0.8)`
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0"
            style={{ 
              backgroundColor: `${themePrimaryColor}20`,
              borderColor: `${themePrimaryColor}40`
            }}
          >
            <CreditCard className="w-6 h-6" style={{ color: themeSecondaryColor }} />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
              <span>Send Birthday Cash Gift</span>
            </h3>
            <p className="text-xs text-slate-400">
              Powered by Kora Payment Gateway · Held in vault for {wish.celebrantName}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {initResult ? (
          /* Payment Initiated Success Screen */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-white">Payment Checkout Generated!</p>
                <p>
                  Kora Payment Reference: <span className="font-mono font-semibold">{initResult.reference}</span>
                </p>
                <p className="text-emerald-400 font-semibold">
                  Amount: ₦{initResult.amount.toLocaleString()} {initResult.currency}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-slate-300 space-y-2">
              <p className="font-medium text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Vault Security Active</span>
              </p>
              <p>
                Once paid, the funds will be placed in secure holding. {wish.celebrantName} can claim the cash gift directly into their Nigerian bank account using your secret passcode.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {initResult.checkoutUrl && (
                <a
                  href={initResult.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono-tech transition-all shadow-lg shadow-emerald-500/25"
                >
                  <span>Open Kora Checkout</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Payment Initialization Form */
          <form onSubmit={handleInitializePayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gift Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₦</span>
                <input
                  type="number"
                  min={500}
                  step={500}
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-pink-500"
                  placeholder="5000"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                {[2000, 5000, 10000, 25000, 50000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold border transition-colors cursor-pointer ${
                      amount === preset
                        ? 'bg-pink-500/25 border-pink-500 text-pink-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Receipt Email
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Secret Passcode for Celebrant Claim</span>
                <span className="text-[10px] text-pink-400 font-normal">Confidential</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white font-mono text-xs uppercase focus:outline-none focus:border-pink-500"
                  placeholder="e.g. QUEEN2026"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                The celebrant must enter this exact secret passcode to disburse the funds into their bank account.
              </p>
            </div>

            {/* Celebrant summary banner */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <img
                  src={wish.mainImage}
                  alt={wish.celebrantName}
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
                <div>
                  <p className="font-bold text-white">{wish.celebrantName}</p>
                  <p className="text-[10px] text-slate-400">Recipient Celebrant</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-emerald-400 font-extrabold text-sm">
                  ₦{amount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider text-slate-950 shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${themeSecondaryColor}, ${themePrimaryColor}, #ffffff)`,
                boxShadow: `0 0 25px ${themePrimaryColor}50`
              }}
            >
              <Gift className="w-4 h-4 text-slate-950" />
              <span>{isLoading ? 'Generating Kora Checkout URL...' : 'Generate Kora Checkout URL'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
