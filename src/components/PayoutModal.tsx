import React, { useState } from 'react';
import { Birthwish } from '../types';
import { 
  POPULAR_BANKS, 
  resolveBankAccount, 
  sendPayoutDisbursement,
  PayoutPayload,
  REGIONAL_ROUTING_MATRIX,
  resolveRegionalRouting,
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
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Globe
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
  // C. Fractional Value Conversions & Multiples
  const claimableAmount = balanceCurrencySanitizer(rawClaimable, routingRule.targetAsset);
  
  // Destination Channel: 'bank_account' or 'mobile_money' (matching PayoutPayload & Regional Routing)
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

  // Mobile Money details (Ghana - GHS / Kenya - KES)
  const [momoNumber, setMomoNumber] = useState<string>('');
  const [momoOperator, setMomoOperator] = useState<string>('mtn');

  // Sync destination channel when country changes
  const handleCountryChange = (c: 'NG' | 'GH' | 'KE') => {
    setSelectedCountry(c);
    const rule = REGIONAL_ROUTING_MATRIX[c];
    setDestinationChannel(rule.destinationChannel);
    if (c === 'GH') setMomoOperator('mtn');
    if (c === 'KE') setMomoOperator('mpesa');
  };

  // UI States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  if (!isOpen) return null;

  // Account number change handler with bank name auto-resolution
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
        }
      } catch (err) {
        console.warn('Bank resolution notice:', err);
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
        }
      } catch (err) {
        console.warn('Bank resolution notice:', err);
      } finally {
        setIsResolvingName(false);
      }
    }
  };

  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Verify Passcode if required by the creator
    if (wish.giftPasscode && wish.giftPasscode.trim()) {
      if (passcode.trim().toUpperCase() !== wish.giftPasscode.trim().toUpperCase()) {
        setErrorMsg(`Incorrect passcode! Please verify the secret passcode sent by ${wish.senderName}.`);
        return;
      }
    }

    // 2. Build PayoutPayload according to specification
    const payoutRef = `BW-WITHDRAW-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const payload: PayoutPayload = {
      amount: claimableAmount,
      currency: wish.giftCurrency || 'NGN',
      reference: payoutRef,
      narration: `Birthday gift withdrawal for ${wish.celebrantName}`,
      destination_channel: destinationChannel,
    };

    if (destinationChannel === 'bank_account') {
      if (accountNumber.length !== 10) {
        setErrorMsg('Please enter a valid 10-digit Nigerian bank account number.');
        return;
      }
      payload.bank_details = {
        account_number: accountNumber.trim(),
        bank_code: selectedBankCode,
      };
    } else {
      if (!momoNumber.trim() || momoNumber.length < 9) {
        setErrorMsg('Please enter a valid Mobile Money phone number.');
        return;
      }
      payload.momo_details = {
        phone_number: momoNumber.trim(),
        operator: momoOperator,
      };
    }

    setIsProcessing(true);

    try {
      // Execute payout through Kora Payout Engine via sendPayoutDisbursement
      const result = await sendPayoutDisbursement(payload);

      const selectedBank = POPULAR_BANKS.find(b => b.code === selectedBankCode) || POPULAR_BANKS[0];
      const selectedMomo = MOBILE_MONEY_OPERATORS.find(m => m.id === momoOperator);

      const claimDetails = {
        bankName: destinationChannel === 'bank_account' 
          ? selectedBank.name 
          : `${selectedMomo?.name || 'Mobile Money'} (${momoOperator.toUpperCase()})`,
        bankCode: destinationChannel === 'bank_account' ? selectedBankCode : momoOperator,
        accountNumber: destinationChannel === 'bank_account' ? accountNumber.trim() : momoNumber.trim(),
        accountName: accountName.trim() || `${wish.celebrantName} (Verified)`,
        claimedAt: new Date().toISOString(),
        koraReference: result.reference,
        narration: `Celebratory birthday gift payout of ₦${claimableAmount.toLocaleString()}`,
      };

      // Synchronize claimed status to LocalStorage, Supabase and Firestore
      const updatedWish = await updateWishClaim(wish.id, claimDetails);
      if (updatedWish) {
        try {
          await saveWishToFirestore(updatedWish);
        } catch {}
      }

      setSuccessResult({
        reference: result.reference,
        channel: destinationChannel,
        destinationName: destinationChannel === 'bank_account' ? selectedBank.name : selectedMomo?.name,
        accountOrPhone: destinationChannel === 'bank_account' ? accountNumber : momoNumber,
        amount: claimableAmount,
      });

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.5 },
      });

      if (onPayoutSuccess && updatedWish) {
        onPayoutSuccess(updatedWish);
      }
    } catch (err: any) {
      console.error('Payout failed:', err);
      setErrorMsg(err.message || 'Payout disbursement could not be completed. Please try again.');
    } finally {
      setIsProcessing(false);
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
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-md shrink-0 bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold text-2xl"
          >
            🎁
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white flex items-center gap-2">
              <span>Withdraw Birthday Gift</span>
            </h3>
            <p className="text-xs text-slate-400">
              Claim ₦{claimableAmount.toLocaleString()} via Kora Instant Payout Engine
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successResult ? (
          /* Payout Completed Screen */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <p className="font-bold text-sm text-white">Funds Successfully Disbursed!</p>
              </div>
              <p className="text-xs">
                ₦{successResult.amount.toLocaleString()} has been sent to your{' '}
                <span className="font-semibold text-white">{successResult.destinationName}</span> (
                <span className="font-mono text-white">{successResult.accountOrPhone}</span>).
              </p>
              <p className="text-[11px] text-emerald-400 font-mono">
                Transaction Reference: {successResult.reference}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-slate-300 flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Enjoy your special birthday gift from {wish.senderName}!</span>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono-tech transition-all cursor-pointer shadow-lg shadow-emerald-500/25"
            >
              Close
            </button>
          </div>
        ) : (
          /* Payout Form with Regional Cross-Border Routing Matrix */
          <form onSubmit={handleDisbursementSubmit} className="space-y-4">
            
            {/* D. Operational Fallback Rule Strategy Matrix: Country & Target Asset Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Country & Regional Asset</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  {routingRule.targetAsset} Rail
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { code: 'NG' as const, label: '🇳🇬 Nigeria (NGN)' },
                  { code: 'GH' as const, label: '🇬🇭 Ghana (GHS)' },
                  { code: 'KE' as const, label: '🇰🇪 Kenya (KES)' }
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleCountryChange(item.code)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer text-center ${
                      selectedCountry === item.code
                        ? 'bg-emerald-500/25 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Channel Selector: Direct Bank Account vs Mobile Money */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Destination Channel ({routingRule.description})
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDestinationChannel('bank_account')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    destinationChannel === 'bank_account'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bank Account</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDestinationChannel('mobile_money')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    destinationChannel === 'mobile_money'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile Money</span>
                </button>
              </div>
            </div>

            {/* Secret Passcode Input */}
            {wish.giftPasscode && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Secret Passcode</span>
                  <span className="text-[10px] text-pink-400">Required</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white font-mono text-xs uppercase focus:outline-none focus:border-emerald-400"
                    placeholder="Enter Secret Passcode"
                  />
                </div>
              </div>
            )}

            {/* Destination Specific Inputs */}
            {destinationChannel === 'bank_account' ? (
              /* Bank Destination Inputs */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Bank
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={handleBankChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    10-Digit Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={handleAccountChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    placeholder="e.g. 0123456789"
                  />
                  {isResolvingName && (
                    <p className="text-[11px] text-amber-400 mt-1 animate-pulse">
                      Resolving Account Name...
                    </p>
                  )}
                  {accountName && !isResolvingName && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">
                      ✓ {accountName}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* Mobile Money Destination Inputs */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Money Operator ({routingRule.targetCountry})
                  </label>
                  <select
                    value={momoOperator}
                    onChange={(e) => setMomoOperator(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-400"
                  >
                    {(routingRule.supportedOperators || MOBILE_MONEY_OPERATORS).map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile MSISDN Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={momoNumber}
                    onChange={(e) => setMomoNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/15 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-emerald-400"
                    placeholder={selectedCountry === 'GH' ? 'e.g. 0244123456 (+233)' : selectedCountry === 'KE' ? 'e.g. 0712345678 (+254)' : 'e.g. 08012345678'}
                  />
                </div>
              </div>
            )}

            {/* Amount Summary with Fractional Sanitization Rule */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block">Sanitized Settlement Asset</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Rail: {routingRule.targetAsset} ({routingRule.targetCountry})
                </span>
              </div>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {routingRule.targetAsset === 'NGN' ? '₦' : routingRule.targetAsset === 'GHS' ? 'GH₵' : routingRule.targetAsset === 'KES' ? 'KSh ' : `${routingRule.targetAsset} `}
                {claimableAmount.toLocaleString()}
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl font-bold font-mono-tech text-xs uppercase tracking-wider text-slate-950 shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
              }}
            >
              <ShieldCheck className="w-4 h-4 text-slate-950" />
              <span>
                {isProcessing
                  ? 'Processing Payout...'
                  : `Disburse ${routingRule.targetAsset} ${claimableAmount.toLocaleString()} Now`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
