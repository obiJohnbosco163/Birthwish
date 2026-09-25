import React, { useState } from 'react';
import { Birthwish } from '../types';
import { RAINBOW_COLORS } from '../lib/colors';
import { POPULAR_BANKS, claimFundsFromHolding, resolveBankAccount } from '../lib/kora';
import { updateWishClaim } from '../lib/supabase';
import { generateStandaloneBirthwishHtml } from '../lib/htmlExporter';
import { BirthwishLogo } from './BirthwishLogo';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  Building2, 
  CreditCard, 
  Share2, 
  Heart,
  ExternalLink
} from 'lucide-react';

interface CelebrantViewProps {
  wish: Birthwish;
  onBackToDashboard: () => void;
  onUpdateWish?: (updated: Birthwish) => void;
}

export const CelebrantView: React.FC<CelebrantViewProps> = ({
  wish,
  onBackToDashboard,
  onUpdateWish,
}) => {
  const [stage, setStage] = useState<number>(1);
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Check if wish includes an active payment status
  const hasPaymentStatus = Boolean(
    wish.giftStatus &&
    wish.giftStatus !== 'unfunded' &&
    (wish.hasGift || (wish.giftAmount && wish.giftAmount > 0) || Boolean(wish.koraPaymentReference))
  );

  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [isClaimVaultExpanded, setIsClaimVaultExpanded] = useState<boolean>(false);

  // Claim State
  const [passcode, setPasscode] = useState<string>('');
  const [selectedBankCode, setSelectedBankCode] = useState<string>(POPULAR_BANKS[1].code); // GTBank default
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isResolvingName, setIsResolvingName] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccessResult, setClaimSuccessResult] = useState<any>(null);

  const theme = RAINBOW_COLORS[wish.colorTheme] || RAINBOW_COLORS.pink;

  // Web Audio Birthday Chime
  const playBirthdayChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.14);
        osc.stop(ctx.currentTime + idx * 0.14 + 0.7);
      });
      setIsPlayingSound(true);
      setTimeout(() => setIsPlayingSound(false), 1200);
    } catch {
      // Audio policy
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: theme.particleColors,
    });
  };

  const goToStage = (target: number) => {
    setStage(target);
    triggerConfetti();
    playBirthdayChime();
  };

  // Resolve bank account on 10 digits
  const handleAccountChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setAccountNumber(val);
    if (val.length === 10) {
      setIsResolvingName(true);
      try {
        const resolved = await resolveBankAccount(selectedBankCode, val);
        setAccountName(resolved);
      } finally {
        setIsResolvingName(false);
      }
    } else {
      setAccountName('');
    }
  };

  const handleClaimFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);

    // 1. Verify wish includes active payment status
    if (!hasPaymentStatus) {
      setClaimError('Payment verification failed: No active funded holding account found for this Birthwish.');
      return;
    }

    // 2. Validate current Kora payment state
    if (wish.giftStatus === 'unfunded') {
      setClaimError('Payment state verification failed: This Birthwish does not have funded holding credits.');
      return;
    }

    if (wish.giftStatus === 'claimed' && !claimSuccessResult) {
      setClaimError('These funds have already been claimed and disbursed to the beneficiary.');
      return;
    }

    // 3. Validate Secret Passcode
    if (!passcode.trim()) {
      setClaimError('Please enter the secret passcode sent by your well-wisher.');
      return;
    }
    if (!wish.giftPasscode) {
      setClaimError('No claim passcode is configured for this holding payment.');
      return;
    }
    if (passcode.trim().toUpperCase() !== wish.giftPasscode.trim().toUpperCase()) {
      setClaimError(`Incorrect secret passcode! Please check with ${wish.senderName} for the exact passcode.`);
      return;
    }

    // 4. Validate Bank Account Details
    if (accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      setClaimError('Please enter a valid 10-digit Nigerian bank account number.');
      return;
    }
    if (!selectedBankCode) {
      setClaimError('Please select a destination bank.');
      return;
    }

    const selectedBank = POPULAR_BANKS.find(b => b.code === selectedBankCode) || POPULAR_BANKS[0];

    setIsClaiming(true);
    try {
      // 5. Validate against Kora payment state and disburse
      const result = await claimFundsFromHolding({
        amount: wish.giftAmount || 0,
        currency: wish.giftCurrency || 'NGN',
        passcode,
        expectedPasscode: wish.giftPasscode || '',
        bankCode: selectedBankCode,
        bankName: selectedBank.name,
        accountNumber,
        accountName: accountName || wish.celebrantName,
        celebrantName: wish.celebrantName,
      });

      if (!result.success || result.status !== 'successful') {
        throw new Error(result.message || 'Kora payment state could not be validated.');
      }

      setClaimSuccessResult(result);

      // Update Supabase and local cache
      const updatedWish = await updateWishClaim(wish.id, {
        bankName: selectedBank.name,
        bankCode: selectedBankCode,
        accountNumber,
        accountName: accountName || wish.celebrantName,
        claimedAt: new Date().toISOString(),
        koraReference: result.reference,
        narration: 'Birthday Cash Gift Claim via Kora Settlement',
      });

      if (updatedWish && onUpdateWish) {
        onUpdateWish(updatedWish);
      }

      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#10b981', '#34d399', '#fde047', '#f43f5e'],
      });
      playBirthdayChime();
    } catch (err: any) {
      setClaimError(err.message || 'Verification failed. Please check your passcode and bank details and try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadNotice(null);
    try {
      // Serialize current Birthwish state including live claim info
      const currentWishState: Birthwish = {
        ...wish,
        giftStatus: claimSuccessResult ? 'claimed' : wish.giftStatus,
        giftClaimedAt: claimSuccessResult ? (claimSuccessResult.transactionTime || new Date().toISOString()) : wish.giftClaimedAt,
        claimDetails: claimSuccessResult ? {
          bankName: claimSuccessResult.bankName,
          bankCode: selectedBankCode,
          accountNumber: claimSuccessResult.accountNumber,
          accountName: claimSuccessResult.accountName,
          claimedAt: claimSuccessResult.transactionTime || new Date().toISOString(),
          koraReference: claimSuccessResult.reference,
          narration: 'Birthday Cash Gift Claim via Kora Settlement',
        } : wish.claimDetails,
      };

      const htmlContent = generateStandaloneBirthwishHtml(currentWishState);
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (wish.celebrantName || 'Celebrant')
        .trim()
        .replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '-')
        .replace(/-+/g, '-');
      a.download = `Birthwish-for-${safeName}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadNotice(`Saved "Birthwish-for-${safeName}.html"!`);
      triggerConfetti();
      setTimeout(() => setDownloadNotice(null), 4000);
    } catch (err: any) {
      console.error('Error generating standalone HTML package:', err);
      setDownloadNotice('Download error: could not serialize HTML.');
      setTimeout(() => setDownloadNotice(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const maxStages = hasPaymentStatus ? 5 : 4;

  return (
    <div className="relative min-h-[90vh] py-8 px-4 flex flex-col items-center justify-center">
      {/* Background Radial Mesh with Rainbow Theme */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${theme.glow} 0%, rgba(9, 13, 22, 0.98) 75%)`,
        }}
      />

      {/* Top Floating Controls */}
      <div className="w-full max-w-3xl flex items-center justify-between mb-6 px-2">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {hasPaymentStatus && (
            <button
              onClick={() => goToStage(5)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                stage === 5
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Claim Funds (₦{wish.giftAmount?.toLocaleString()})</span>
            </button>
          )}

          <button
            onClick={playBirthdayChime}
            title="Play celebration chime"
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            {isPlayingSound ? (
              <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copyFeedback ? 'Link Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-xs font-bold text-white shadow-md shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-70"
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating .html...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-yellow-300" />
                <span>Download .html</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Download Success Toast */}
      {downloadNotice && (
        <div className="w-full max-w-md mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-xl backdrop-blur-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{downloadNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">Portable HTML</span>
        </div>
      )}

      {/* Journey Stages Navigation Dots */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: maxStages }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToStage(idx + 1)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              stage === idx + 1
                ? 'w-8 h-2.5 bg-pink-500 shadow-md shadow-pink-500/50'
                : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
            }`}
            title={`Go to Stage ${idx + 1}`}
          />
        ))}
      </div>

      {/* ================= CHAPTER 1: THE UNWRAP BOX & COVER PHOTO ================= */}
      {stage === 1 && (
        <div className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl text-center animate-fade-in relative overflow-hidden">
          <div className="relative h-64 sm:h-72 rounded-2xl overflow-hidden mb-6 border border-white/10 shadow-inner group">
            <img 
              src={wish.coverImage} 
              alt="Celebrant Cover" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
              <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                A Tribute for {wish.category}
              </span>
              <span className="text-[11px] text-pink-300 font-semibold bg-pink-500/20 px-2.5 py-0.5 rounded-full border border-pink-500/30">
                Chapter 1
              </span>
            </div>
          </div>

          <span className="px-3.5 py-1 rounded-full bg-pink-500/15 text-pink-300 text-xs font-semibold uppercase tracking-wider border border-pink-500/30">
            Exclusive Birthday Surprise
          </span>

          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Happy Birthday, <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300">{wish.celebrantName}</span>!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-md mx-auto mt-3 leading-relaxed">
            Prepared with intense love by <b>{wish.senderName}</b> ({wish.senderRelation}). Step inside to unwrap your special wishes, memories, and surprises!
          </p>

          <div className="mt-8">
            <button
              onClick={() => goToStage(2)}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-pink-500/30 flex items-center gap-2.5 mx-auto transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-yellow-200" />
              <span>Unwrap Birthday Surprise</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= CHAPTER 2: THE SURPRISE MESSAGE & PRAYER ================= */}
      {stage === 2 && (
        <div className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl text-center animate-fade-in relative">
          <div className="text-5xl mb-4 animate-bounce">🎂✨🕊️</div>
          <span className="px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
            Chapter 2: Surprise Blessing
          </span>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-3 mb-6">
            A Whispered Prayer for &quot;{wish.celebrantNickname || wish.celebrantName}&quot;
          </h2>

          <div className="p-6 sm:p-8 rounded-2xl bg-white/[0.04] border-l-4 border-pink-500 border-t border-r border-b border-white/10 text-left text-slate-100 text-base sm:text-lg leading-relaxed shadow-lg mb-8">
            &ldquo;{wish.shortMessage}&rdquo;
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStage(1)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => goToStage(3)}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>The Spotlight Portrait</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= CHAPTER 3: THE STAR PORTRAIT SPOTLIGHT ================= */}
      {stage === 3 && (
        <div className="w-full max-w-2xl glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl text-center animate-fade-in relative">
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
            Chapter 3: The Star of the Day
          </span>

          {/* Celebrant Main Hero Portrait */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto my-6">
            <div 
              className="absolute inset-0 rounded-full blur-xl opacity-70 animate-pulse"
              style={{ backgroundColor: theme.primary }}
            />
            <div className="relative w-full h-full rounded-full p-1.5 bg-gradient-to-tr from-pink-500 via-yellow-400 to-rose-500 shadow-2xl">
              <img
                src={wish.mainImage}
                alt={wish.celebrantName}
                className="w-full h-full object-cover rounded-full border-4 border-[#0b0f17]"
              />
            </div>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {wish.celebrantName}
          </h2>
          {wish.celebrantNickname && (
            <p className="text-pink-400 font-semibold text-lg mt-0.5">
              &quot;{wish.celebrantNickname}&quot;
            </p>
          )}

          <div className="flex flex-wrap justify-center gap-2 my-5">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/15">
              Honoring: {wish.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold border border-white/15">
              Sent with love by: {wish.senderRelation}
            </span>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={() => setStage(2)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => goToStage(4)}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
            >
              <span>Read The Heartfelt Epistle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= CHAPTER 4: THE HEARTFELT EPISTLE ================= */}
      {stage === 4 && (
        <div className="w-full max-w-3xl glass-card rounded-3xl p-6 sm:p-10 border border-white/15 shadow-2xl animate-fade-in relative text-left">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <span className="px-3 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-semibold uppercase tracking-wider border border-rose-500/30">
              Chapter 4: The Heartfelt Epistle
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              Written from the heart
            </span>
          </div>

          <div className="font-serif-luxury text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line space-y-4 mb-8">
            {wish.finalEpistle}
          </div>

          {/* Signature Card */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs text-slate-400">Penned with all my love,</p>
              <h4 className="font-display text-lg font-bold text-pink-400 mt-0.5">
                {wish.senderName}
              </h4>
              <p className="text-xs text-slate-400 font-medium">{wish.senderRelation}</p>
            </div>
            {hasPaymentStatus && (
              <div className="text-left sm:text-right">
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  🎁 Cash Gift Attached ({wish.giftStatus ? wish.giftStatus.toUpperCase() : 'HOLDING'})
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  ₦{wish.giftAmount?.toLocaleString()} in Kora Vault
                </p>
              </div>
            )}
          </div>

          {/* Hidden Claim Funds Callout Banner in Epistle (only if wish includes payment status) */}
          {hasPaymentStatus && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#0f1523] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fade-in shadow-lg shadow-emerald-950/20">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl border border-emerald-500/30 shrink-0">
                  🎁
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-bold text-white text-sm sm:text-base">
                      Secret Birthday Cash Gift Available
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40">
                      Kora Holding
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    <b>{wish.senderName}</b> funded <b>₦{wish.giftAmount?.toLocaleString()}</b>. Reveal the vault to unlock it with your secret passcode.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => goToStage(5)}
                className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Reveal &amp; Claim Funds</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              onClick={() => setStage(3)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {hasPaymentStatus ? (
              <button
                onClick={() => goToStage(5)}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Unlock Cash Gift (₦{wish.giftAmount?.toLocaleString()})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={triggerConfetti}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-pink-500/25 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrate Joyfully!</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= CHAPTER 5: HIDDEN CLAIM FUNDS SECTION ================= */}
      {/* Revealed ONLY if the wish includes an active payment status */}
      {hasPaymentStatus && stage === 5 && (
        <div 
          id="claim-funds-section"
          className="w-full max-w-xl glass-card rounded-3xl p-6 sm:p-10 border border-emerald-500/30 shadow-2xl animate-fade-in text-center relative overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
              Kora Holding Vault
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-mono border border-white/15">
              Status: {wish.giftStatus ? wish.giftStatus.toUpperCase() : 'HOLDING'}
            </span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Claim Your ₦{wish.giftAmount?.toLocaleString()} Cash Gift
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 mb-6 leading-relaxed">
            Gifted by <b>{wish.senderName}</b>. Enter the secret passcode they gave you along with your bank account details. We will validate against the Kora payment state before releasing the funds.
          </p>

          {/* Kora Payment State Info Badge */}
          <div className="mb-6 p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left text-xs font-mono flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Kora Payment State:</span>
              <span className="text-emerald-400 font-bold">{wish.giftStatus === 'claimed' ? 'DISBURSED' : 'HOLDING VERIFIED'}</span>
            </div>
            <span className="text-slate-500 text-[11px] truncate max-w-[140px]">
              {wish.koraPaymentReference || 'BW-HOLDING-SECURED'}
            </span>
          </div>

          {/* If already claimed or newly claimed */}
          {wish.giftStatus === 'claimed' || claimSuccessResult ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-4 animate-fade-in">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-display font-bold text-emerald-300 text-base">
                    Funds Successfully Claimed &amp; Disbursed!
                  </h4>
                  <p className="text-xs text-emerald-200/80">
                    Transferred to {wish.claimDetails?.bankName || claimSuccessResult?.bankName} ({wish.claimDetails?.accountNumber || claimSuccessResult?.accountNumber})
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/50 font-mono text-xs text-slate-300 space-y-2 border border-white/5">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Kora Ref:</span>
                  <span className="text-emerald-400 font-bold">{wish.claimDetails?.koraReference || claimSuccessResult?.reference}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="text-white">{wish.claimDetails?.accountName || claimSuccessResult?.accountName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Bank Destination:</span>
                  <span>{wish.claimDetails?.bankName || claimSuccessResult?.bankName} ({wish.claimDetails?.accountNumber || claimSuccessResult?.accountNumber})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-slate-500">Amount:</span>
                  <span className="text-emerald-400 font-bold">₦{wish.giftAmount?.toLocaleString()} NGN</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-500">Settlement Status:</span>
                  <span className="text-emerald-400 font-bold">CLEARED &amp; DISBURSED VIA KORA</span>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaimFunds} className="space-y-4 text-left">
              {claimError && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  <span>{claimError}</span>
                </div>
              )}

              {/* Field 1: Secret Passcode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Secret Passcode (Case-insensitive) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 w-4 h-4 text-amber-400" />
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. MIMI24"
                    className="w-full pl-10 pr-16 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono tracking-wider text-amber-300 placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Must match the exact secret passcode provided by {wish.senderName}.
                </span>
              </div>

              {/* Field 2: Destination Bank Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Destination Bank <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#121826] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 3: 10-Digit Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  10-Digit Nigerian Bank Account Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={accountNumber}
                    onChange={handleAccountChange}
                    placeholder="0123456789"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                {isResolvingName && (
                  <span className="text-[11px] text-amber-400 mt-1 block animate-pulse">
                    Resolving account name with Kora API...
                  </span>
                )}
                {accountName && !isResolvingName && (
                  <div className="mt-1.5 text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Beneficiary Name: {accountName}</span>
                  </div>
                )}
              </div>

              {/* Submission Button */}
              <button
                type="submit"
                disabled={isClaiming}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] mt-3"
              >
                {isClaiming ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Validating Kora Payment State...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Validate &amp; Disburse ₦{wish.giftAmount?.toLocaleString()}</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6">
            <button
              onClick={() => setStage(4)}
              className="px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Epistle</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Packaging HTML...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Save Offline HTML</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
