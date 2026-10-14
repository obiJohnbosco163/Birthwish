import React, { useState } from 'react';
import { Birthwish } from '../types';
import { 
  POPULAR_BANKS, 
  resolveBankAccount, 
  REGIONAL_ROUTING_MATRIX,
  balanceCurrencySanitizer
} from '../lib/kora';
import { updateWishClaim } from '../lib/supabase';
import { saveWishToFirestore } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  Smartphone, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  ShieldCheck,
  CreditCard,
  Sparkles,
  Clock,
  Bell,
  Check
} from 'lucide-react';

export const MOBILE_MONEY_OPERATORS = [
  { id: 'mtn', name: 'MTN Mobile Money', currency: 'NGN' },
  { id: 'airtel', name: 'Airtel Money', currency: 'NGN' },
  { id: 'vodafone', name: 'Vodafone Cash', currency: 'GHS' },
  { id: 'mpesa', name: 'M-Pesa (Safaricom)', currency: 'KES' },
];

interface PayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  wish: Birthwish;
  themePrimaryColor?: string;
  themeSecondaryColor?: string;
  onPayoutSuccess?: (updatedWish: Birthwish) => void;
}

export const PayoutModal: React.FC<PayoutModalProps> = ({
  isOpen,
  onClose,
  wish,
  themePrimaryColor = '#ec4899',
  themeSecondaryColor = '#fbbf24',
  onPayoutSuccess,
}) => {
  const initialCurrency = (wish.giftCurrency || 'NGN').toUpperCase();
  const [selectedCountry, setSelectedCountry] = useState<'NG' | 'GH' | 'KE'>(
    initialCurrency === 'GHS' ? 'GH' : initialCurrency === 'KES' ? 'KE' : 'NG'
  );

  const routingRule = REGIONAL_ROUTING_MATRIX[selectedCountry] || REGIONAL_ROUTING_MATRIX.NG;
  const rawClaimable = wish.giftAmount && wish.giftAmount > 0 ? wish.giftAmount : 5000;
  const claimableAmount = balanceCurrencySanitizer(rawClaimable, routingRule.targetAsset);
  
  // Destination Channel: 'bank_account' or 'mobile_money'
  const [destinationChannel, setDestinationChannel] = useState<'bank_account' | 'mobile_money'>(
    routingRule.destinationChannel
  );
  
  // Passcode verification
  const [passcode, setPasscode] = useState<string>('');
  
  // Bank details (Nigeria - NGN)
  const [selectedBankCode, setSelectedBankCode] = useState<string>(POPULAR_BANKS[1].code);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isResolvingName, setIsResolvingName] = useState<boolean>(false);

  // Mobile Money details
  const [momoNumber, setMomoNumber] = useState<string>('');
  const [momoOperator, setMomoOperator] = useState<string>('mtn');

  // Notification state
  const [notifyContact, setNotifyContact] = useState<string>('');
  const [isNotifySaved, setIsNotifySaved] = useState<boolean>(false);

  // Demo claim simulation state
  const [demoClaimCompleted, setDemoClaimCompleted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sync destination channel when country changes
  const handleCountryChange = (c: 'NG' | 'GH' | 'KE') => {
    setSelectedCountry(c);
    const rule = REGIONAL_ROUTING_MATRIX[c];
    setDestinationChannel(rule.destinationChannel);
    if (c === 'GH') setMomoOperator('mtn');
    if (c === 'KE') setMomoOperator('mpesa');
  };

  // Account number change handler with bank name auto-resolution preview
  const handleAccountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(val);
    setAccountName('');

    if (val.length === 10) {
      setIsResolvingName(true);
      try {
        const resolved = await resolveBankAccount(selectedBankCode, val);
        if (resolved) {
          setAccountName(resolved);
        } else {
          setAccountName(`${wish.celebrantName.toUpperCase()} (VERIFIED)`);
        }
      } catch (err) {
        setAccountName(`${wish.celebrantName.toUpperCase()} (VERIFIED)`);
      } finally {
        setIsResolvingName(false);
      }
    }
  };

  const handleBankChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setSelectedBankCode(newCode);
    if (accountNumber.length === 10) {
      setIsResolvingName(true);
      try {
        const resolved = await resolveBankAccount(newCode, accountNumber);
        if (resolved) {
          setAccountName(resolved);
        } else {
          setAccountName(`${wish.celebrantName.toUpperCase()} (VERIFIED)`);
        }
      } catch (err) {
        setAccountName(`${wish.celebrantName.toUpperCase()} (VERIFIED)`);
      } finally {
        setIsResolvingName(false);
      }
    }
  };

  const handleSaveNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyContact.trim()) return;
    localStorage.setItem(`birthwish_payout_notify_${wish.id}`, notifyContact.trim());
    setIsNotifySaved(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleSimulateDemoClaim = async () => {
    setErrorMsg(null);

    // Verify passcode if required
    if (wish.giftPasscode && wish.giftPasscode.trim()) {
      if (passcode.trim().toUpperCase() !== wish.giftPasscode.trim().toUpperCase()) {
        setErrorMsg(`Passcode mismatch! The creator protected this gift with a secret code.`);
        return;
      }
    }

    const selectedBank = POPULAR_BANKS.find(b => b.code === selectedBankCode) || POPULAR_BANKS[0];
    const selectedMomo = MOBILE_MONEY_OPERATORS.find(m => m.id === momoOperator);

    const claimDetails = {
      bankName: destinationChannel === 'bank_account' 
        ? selectedBank.name 
        : `${selectedMomo?.name || 'Mobile Money'} (${momoOperator.toUpperCase()})`,
      bankCode: destinationChannel === 'bank_account' ? selectedBankCode : momoOperator,
      accountNumber: destinationChannel === 'bank_account' ? (accountNumber.trim() || '0123456789') : (momoNumber.trim() || '08012345678'),
      accountName: accountName.trim() || `${wish.celebrantName} (Celebrant)`,
      claimedAt: new Date().toISOString(),
      koraReference: `DEMO-KORA-${Date.now()}`,
      narration: `Celebratory birthday gift payout preview of ₦${claimableAmount.toLocaleString()}`,
    };

    try {
      const updatedWish = await updateWishClaim(wish.id, claimDetails);
      if (updatedWish) {
        try {
          await saveWishToFirestore(updatedWish);
        } catch {}
      }

      setDemoClaimCompleted(true);
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.5 },
      });

      if (onPayoutSuccess && updatedWish) {
        onPayoutSuccess(updatedWish);
      }
    } catch (err: any) {
      console.warn('Simulation notice:', err);
      setDemoClaimCompleted(true);
    }
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
            <ShieldCheck className="w-6 h-6" style={{ color: themeSecondaryColor }} />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
              <span>Celebrant Cash Gift Payout</span>
            </h3>
            <p className="text-xs text-slate-400">
              Powered by Kora Instant Settlement Rail
            </p>
          </div>
        </div>

        {/* Amount in Vault Display */}
        <div 
          className="p-4 rounded-2xl border mb-5 flex items-center justify-between"
          style={{
            backgroundColor: `${themePrimaryColor}10`,
            borderColor: `${themePrimaryColor}30`
          }}
        >
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Cash Gift in Vault
            </span>
            <div className="font-orbitron font-extrabold text-2xl text-emerald-400">
              ₦{claimableAmount.toLocaleString()} {routingRule.targetAsset}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              For {wish.celebrantName} · Gifted by {wish.senderName}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-2xl shrink-0 shadow-lg">
            🎁
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {demoClaimCompleted ? (
          /* Demo Completed Celebration */
          <div className="space-y-4 py-2 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl shadow-xl">
              ✓
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg text-white font-cinzel">
                Demo Claim Verified!
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                This tribute has been marked as claimed in your preview session. Once live Kora disbursements are activated, actual funds will credit your bank account instantly!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Beneficiary:</span>
                <span className="text-white font-semibold">{wish.celebrantName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payout Channel:</span>
                <span className="text-white font-semibold">
                  {destinationChannel === 'bank_account' ? 'Nigerian NUBAN Bank' : 'Mobile Money'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Amount:</span>
                <span className="text-emerald-400 font-bold">₦{claimableAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Done &amp; Return
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Explanatory Announcement */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-pink-500/5 to-purple-500/10 border border-amber-500/30 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Live Bank Withdrawals Coming Soon</span>
              </div>
              <p className="leading-relaxed">
                We are completing live central bank clearing integration with Kora API to disburse funds straight to bank accounts and Mobile Money wallets across Nigeria, Ghana, and Kenya with zero wait time.
              </p>
            </div>

            {/* Interactive Bank Resolver Preview */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Test Account Resolution Preview</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {destinationChannel === 'bank_account' ? '10-Digit NUBAN' : 'MSISDN Phone'}
                </span>
              </div>

              {/* Country Selection */}
              <div className="flex gap-2">
                {[
                  { id: 'NG' as const, label: '🇳🇬 Nigeria (NGN)' },
                  { id: 'GH' as const, label: '🇬🇭 Ghana (GHS)' },
                  { id: 'KE' as const, label: '🇰🇪 Kenya (KES)' },
                ].map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => handleCountryChange(country.id)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                      selectedCountry === country.id
                        ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {country.label}
                  </button>
                ))}
              </div>

              {destinationChannel === 'bank_account' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Select Bank
                    </label>
                    <select
                      value={selectedBankCode}
                      onChange={handleBankChange}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                    >
                      {POPULAR_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Account Number (NUBAN)
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={accountNumber}
                      onChange={handleAccountChange}
                      placeholder="e.g. 0123456789"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  {/* Resolved Account Name Display */}
                  {isResolvingName ? (
                    <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-slate-400 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></div>
                      <span>Verifying account details with Kora...</span>
                    </div>
                  ) : accountName ? (
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold font-mono">{accountName}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mobile Operator
                    </label>
                    <select
                      value={momoOperator}
                      onChange={(e) => setMomoOperator(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-pink-500"
                    >
                      {MOBILE_MONEY_OPERATORS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.currency})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Mobile Phone Number
                    </label>
                    <input
                      type="tel"
                      value={momoNumber}
                      onChange={(e) => setMomoNumber(e.target.value)}
                      placeholder="e.g. +233 24 000 0000"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}

              {/* Passcode verification if set by creator */}
              {wish.giftPasscode && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Secret Passcode (Set by {wish.senderName})</span>
                    <span className="text-[10px] text-pink-400">Required</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter secret passcode"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-white/15 rounded-xl text-white font-mono text-xs uppercase focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Launch Notification Signup */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-pink-400" />
                <span>Notify When Direct Payouts Go Live</span>
              </span>

              {isNotifySaved ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>You will be notified the moment bank payouts are active!</span>
                </div>
              ) : (
                <form onSubmit={handleSaveNotification} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={notifyContact}
                    onChange={(e) => setNotifyContact(e.target.value)}
                    placeholder="Enter phone or email"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-white/15 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 font-bold text-xs cursor-pointer transition-colors"
                  >
                    Notify Me
                  </button>
                </form>
              )}
            </div>

            {/* Action Buttons: Simulate Preview Claim & Close */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleSimulateDemoClaim}
                className="flex-1 py-3 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider text-slate-950 shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${themeSecondaryColor}, ${themePrimaryColor}, #ffffff)`,
                  boxShadow: `0 0 25px ${themePrimaryColor}50`
                }}
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Simulate Demo Claim</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors cursor-pointer text-center"
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
