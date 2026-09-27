import React, { useState } from 'react';
import { Birthwish } from '../types';
import { RAINBOW_COLORS } from '../lib/colors';
import { POPULAR_BANKS, resolveBankAccount, claimFundsFromHolding } from '../lib/kora';
import { updateWishClaim } from '../lib/supabase';
import { generateStandaloneBirthwishHtml } from '../lib/htmlExporter';
import { generateShareableWishLink } from '../lib/wishEncoder';
import { happyBirthdayAudio } from '../lib/happyBirthdayAudio';
import { CelebrantSurpriseModal } from './CelebrantSurpriseModal';
import { CelebrantLastPage } from './CelebrantLastPage';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Download, 
  ShieldCheck, 
  Share2, 
  Sparkles,
  ExternalLink,
  Crown
} from 'lucide-react';

interface CelebrantViewProps {
  wish: Birthwish;
  onBackToDashboard: () => void;
  onUpdateWish?: (updated: Birthwish) => void;
  isLoggedIn?: boolean;
}

export const CelebrantView: React.FC<CelebrantViewProps> = ({
  wish,
  onBackToDashboard,
  onUpdateWish,
  isLoggedIn = false,
}) => {
  // Navigation / Cinematic Flow States
  // 1. Surprise Modal with typewriter animation (like https://happy-birthdaysir-kevin.vercel.app/)
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState<boolean>(false);
  // 2. Final Page / Epistle & Candle Blow (like https://happy-birthdaysir-kevin.vercel.app/)
  const [isFinalPageOpen, setIsFinalPageOpen] = useState<boolean>(false);

  // Audio state - start song automatically if desired, or let user toggle
  const [isPlayingSound, setIsPlayingSound] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Cash Gift / Claim States
  const hasPaymentStatus = Boolean(
    wish.giftStatus &&
    wish.giftStatus !== 'unfunded' &&
    (wish.hasGift || (wish.giftAmount && wish.giftAmount > 0) || Boolean(wish.koraPaymentReference))
  );

  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [selectedBankCode, setSelectedBankCode] = useState<string>(POPULAR_BANKS[1].code);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string>('');
  const [isResolvingName, setIsResolvingName] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccessResult, setClaimSuccessResult] = useState<any>(null);

  // Strict Major/Primary color for this tribute
  const theme = RAINBOW_COLORS[wish.colorTheme] || RAINBOW_COLORS.pink;

  // Single-song toggle
  const toggleBirthdayMusic = () => {
    happyBirthdayAudio.toggleSong((playing) => {
      setIsPlayingSound(playing);
    });
  };

  // Typewriter ticker headline on hero stage
  const teaserHeader = `🎉 Happy Birthday ${wish.celebrantNickname || wish.celebrantName}! 🎂 Click Let's Celebrate below! 💖`;
  const [tickerText, setTickerText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [charIndex, setCharIndex] = useState<number>(0);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDeleting && charIndex <= teaserHeader.length) {
        setTickerText(teaserHeader.slice(0, charIndex));
        setCharIndex((prev) => prev + 1);
      } else if (isDeleting && charIndex >= 0) {
        setTickerText(teaserHeader.slice(0, charIndex));
        setCharIndex((prev) => prev - 1);
      }

      if (charIndex > teaserHeader.length) {
        setIsDeleting(true);
      } else if (charIndex < 0) {
        setIsDeleting(false);
        setCharIndex(0);
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, teaserHeader]);

  // Clean audio on unmount
  React.useEffect(() => {
    return () => {
      happyBirthdayAudio.stop();
    };
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.3 },
      colors: theme.particleColors,
    });
  };

  // Download Standalone .HTML
  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadNotice(null);
    try {
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
    const url = generateShareableWishLink(wish);
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  // Bank resolution
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

  // Claim funds
  const handleClaimFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);

    if (!hasPaymentStatus) {
      setClaimError('No active funded holding account found for this Birthwish.');
      return;
    }
    if (!passcode.trim() || !wish.giftPasscode) {
      setClaimError('Please enter the secret passcode provided by your well-wisher.');
      return;
    }
    if (passcode.trim().toUpperCase() !== wish.giftPasscode.trim().toUpperCase()) {
      setClaimError(`Incorrect passcode! Please check with ${wish.senderName}.`);
      return;
    }
    if (accountNumber.length !== 10) {
      setClaimError('Please enter a valid 10-digit Nigerian bank account number.');
      return;
    }

    const selectedBank = POPULAR_BANKS.find(b => b.code === selectedBankCode) || POPULAR_BANKS[0];
    setIsClaiming(true);

    try {
      const claimResult = await claimFundsFromHolding({
        amount: wish.giftAmount || 0,
        currency: wish.giftCurrency || 'NGN',
        passcode: passcode.trim(),
        expectedPasscode: wish.giftPasscode || '',
        bankCode: selectedBank.code,
        bankName: selectedBank.name,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || `${wish.celebrantName} (Verified)`,
        celebrantName: wish.celebrantName,
      });

      const updated = await updateWishClaim(wish.id, {
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim() || `${wish.celebrantName} (Verified)`,
        claimedAt: claimResult.transactionTime,
        koraReference: claimResult.reference,
        narration: `Celebratory birthday gift payout of ₦${(wish.giftAmount || 0).toLocaleString()}`,
      });

      if (updated && onUpdateWish) {
        onUpdateWish(updated);
      }

      setClaimSuccessResult(claimResult);
      triggerConfetti();
      happyBirthdayAudio.playHappyBirthdayMelody();
    } catch (err: any) {
      setClaimError(err.message || 'Verification failed. Please check your passcode and bank details.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col items-center justify-between overflow-x-hidden animate-fade-in">
      {/* Dynamic Background Mesh radiating the user's chosen primary color */}
      <div 
        className="fixed inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${theme.glow} 0%, rgba(4, 7, 20, 0.98) 75%)`,
        }}
      />

      {/* Top Floating Controls Bar */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-3 pt-6 px-4 z-20">
        <div 
          className="w-full flex items-center justify-between pb-4 border-b transition-colors"
          style={{ borderColor: `${theme.primary}33` }}
        >
          {/* Celebrant Monogram & Title */}
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-mono-tech text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer mr-2"
              title={isLoggedIn ? 'Return to Dashboard' : 'Visit Birthwish'}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isLoggedIn ? 'Dashboard' : 'Birthwish'}</span>
            </button>

            <span 
              className="w-3 h-3 rounded-full animate-pulse shadow-md"
              style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}
            />
            <span className="text-xs sm:text-sm font-cinzel font-bold text-white tracking-wider">
              Happy Birthday {wish.celebrantNickname || wish.celebrantName}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Music Play/Pause */}
            <button
              onClick={toggleBirthdayMusic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: isPlayingSound ? theme.primary : 'rgba(255,255,255,0.1)',
                backgroundColor: isPlayingSound ? `${theme.primary}25` : 'rgba(15, 23, 42, 0.8)',
                color: isPlayingSound ? '#ffffff' : '#cbd5e1',
                boxShadow: isPlayingSound ? `0 0 15px ${theme.glow}` : 'none'
              }}
              title="Toggle Birthday Song"
            >
              {isPlayingSound ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 animate-pulse" style={{ color: theme.secondary }} />
                  <span className="hidden sm:inline font-mono-tech">Song Playing 🎶</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline font-mono-tech">Play Song 🎵</span>
                </>
              )}
            </button>

            {/* Confetti Cannon */}
            <button
              onClick={triggerConfetti}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-950 shadow-md transition-transform active:scale-95 cursor-pointer font-mono-tech"
              style={{
                backgroundColor: theme.secondary,
                boxShadow: `0 0 12px ${theme.glow}`
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Confetti!</span>
            </button>

            {/* Claim Cash Gift Button if Available */}
            {hasPaymentStatus && (
              <button
                onClick={() => setIsClaimModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-white shadow-md shadow-emerald-500/30 transition-transform active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>₦{wish.giftAmount?.toLocaleString()}</span>
              </button>
            )}

            {/* Share Viewing Link */}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-tech border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 transition-colors cursor-pointer"
              title="Copy shareable viewing link for this tribute"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copyFeedback ? 'Link Copied!' : 'Share Link'}</span>
            </button>

            {/* Download .HTML */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono-tech border transition-all cursor-pointer disabled:opacity-50"
              style={{
                borderColor: `${theme.primary}66`,
                backgroundColor: `${theme.primary}20`,
                color: '#ffffff'
              }}
              title="Download standalone HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isDownloading ? 'Exporting...' : 'Download .HTML'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Typewriter Ticker (Exact format from reference site) */}
        <div className="text-center py-1 min-h-[30px]">
          <span 
            className="text-xs sm:text-base font-orbitron font-bold tracking-widest text-shadow drop-shadow-md"
            style={{ color: '#ffffff', textShadow: `0 0 12px ${theme.glow}` }}
          >
            {tickerText}
            <span className="animate-pulse ml-1" style={{ color: theme.secondary }}>|</span>
          </span>
        </div>
      </div>

      {/* 2. MAIN HERO DISPLAY (Exact Hero Section from https://happy-birthdaysir-kevin.vercel.app/) */}
      <main className="w-full max-w-3xl mx-auto my-auto text-center space-y-7 px-4 py-8 z-10">
        
        {/* Cover Photo Banner with Glow Border in Chosen Primary Color */}
        <div 
          className="relative rounded-3xl overflow-hidden border shadow-2xl bg-slate-950 transition-all duration-500"
          style={{ 
            borderColor: `${theme.primary}66`, 
            boxShadow: `0 0 35px ${theme.glow}` 
          }}
        >
          <img
            src={wish.coverImage}
            alt={wish.celebrantName}
            className="w-full max-h-56 sm:max-h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040714] via-transparent to-transparent opacity-80" />
        </div>

        {/* Avatar Ring Crowned with "Birthday King / Queen" badge */}
        <div className="relative -mt-20 sm:-mt-24 inline-block">
          <div 
            className="w-36 h-36 sm:w-44 sm:h-44 rounded-full p-1.5 shadow-2xl mx-auto transition-transform hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary}, #ffffff)`,
              boxShadow: `0 0 30px ${theme.glow}`
            }}
          >
            <img
              src={wish.mainImage}
              alt={wish.celebrantName}
              className="w-full h-full object-cover object-center rounded-full border-2 border-slate-950"
            />
          </div>

          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-slate-950 px-4 py-1 rounded-full text-xs font-bold font-mono-tech uppercase tracking-wider shadow-lg flex items-center gap-1.5 whitespace-nowrap"
            style={{ backgroundColor: theme.secondary }}
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>
              {wish.celebrantGender === 'female' ? 'Birthday Queen' : wish.celebrantGender === 'male' ? 'Birthday King' : 'Celebrant of Honor'}
            </span>
          </div>
        </div>

        {/* Typography & Celebrant Identification */}
        <div className="space-y-3">
          <h1 
            className="text-3xl sm:text-6xl font-black font-cinzel text-white leading-tight tracking-tight drop-shadow-md"
            style={{ textShadow: `0 0 25px ${theme.glow}` }}
          >
            HAPPY BIRTHDAY {wish.celebrantName.toUpperCase()}
          </h1>

          {wish.celebrantNickname && (
            <div 
              className="text-lg sm:text-2xl font-bold font-cinzel"
              style={{ color: theme.secondary }}
            >
              &quot;{wish.celebrantNickname}&quot;
            </div>
          )}

          <p 
            className="text-xs sm:text-sm font-mono-tech uppercase tracking-widest"
            style={{ color: theme.secondary }}
          >
            Honoring {wish.category} · Sent with deep love by {wish.senderName} ({wish.senderRelation})
          </p>

          <p className="text-xs text-slate-400 max-w-lg mx-auto italic leading-relaxed">
            &ldquo;{wish.shortMessage}&rdquo;
          </p>
        </div>

        {/* NEON "LET'S CELEBRATE" BUTTON (Exact style and pulsing glow in user's color) */}
        <div className="pt-4">
          <button
            onClick={() => setIsSurpriseModalOpen(true)}
            className="cursor-pointer text-white uppercase tracking-wider rounded-full px-10 py-3.5 sm:py-4 font-orbitron font-extrabold text-base sm:text-lg transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            style={{
              background: `linear-gradient(135deg, rgba(14, 21, 44, 0.95), ${theme.primary}50)`,
              border: `3px solid ${theme.primary}`,
              textShadow: `0 0 10px ${theme.primary}, 0 0 20px ${theme.secondary}`,
              boxShadow: `0 0 30px ${theme.glow}`
            }}
          >
            Let&apos;s Celebrate
          </button>
        </div>
      </main>

      {/* Footer attribution */}
      <footer className="w-full text-center py-6 border-t border-slate-900/80 text-xs text-slate-500 font-mono-tech z-10">
        <p>
          A bespoke birthday celebration tribute for {wish.celebrantName} · Created with love on Birthwish by {wish.senderName}
        </p>
      </footer>

      {/* 3. SURPRISE MODAL WITH TYPEWRITER ANIMATION (Like reference site) */}
      <CelebrantSurpriseModal
        isOpen={isSurpriseModalOpen}
        onClose={() => setIsSurpriseModalOpen(false)}
        celebrantName={wish.celebrantNickname || wish.celebrantName}
        shortMessage={wish.shortMessage}
        themePrimaryColor={theme.primary}
        themeSecondaryColor={theme.secondary}
        onOpenFinalPage={() => {
          setIsSurpriseModalOpen(false);
          setIsFinalPageOpen(true);
        }}
      />

      {/* 4. FINAL PAGE / CANDLE BLOWING & HEARTFELT EPISTLE (Exact reference layout & transitions) */}
      {isFinalPageOpen && (
        <CelebrantLastPage
          wish={wish}
          themePrimaryColor={theme.primary}
          themeSecondaryColor={theme.secondary}
          onBack={() => setIsFinalPageOpen(false)}
          onClaimClick={() => setIsClaimModalOpen(true)}
          hasPaymentStatus={hasPaymentStatus}
        />
      )}

      {/* 5. CLAIM CASH GIFT MODAL DIALOG */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-[#0b1226] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 text-left shadow-2xl relative">
            <button
              onClick={() => setIsClaimModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-2xl border border-emerald-500/30">
                🎁
              </div>
              <div>
                <h3 className="font-display font-extrabold text-white text-lg">
                  Claim Birthday Gift
                </h3>
                <p className="text-xs text-emerald-400 font-semibold">
                  ₦{wish.giftAmount?.toLocaleString()} {wish.giftCurrency}
                </p>
              </div>
            </div>

            {claimSuccessResult ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <p className="font-bold text-sm">🎉 Payout Disbursed Successfully!</p>
                <p>Transfer reference: <span className="font-mono">{claimSuccessResult.reference}</span></p>
                <p>Beneficiary: <b>{claimSuccessResult.accountName}</b> ({claimSuccessResult.bankName})</p>
              </div>
            ) : (
              <form onSubmit={handleClaimFunds} className="space-y-4 text-xs">
                {claimError && (
                  <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
                    {claimError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Secret Passcode (from {wish.senderName})
                  </label>
                  <input
                    type="text"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter Secret Passcode"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Bank
                  </label>
                  <select
                    value={selectedBankCode}
                    onChange={(e) => setSelectedBankCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white focus:outline-none focus:border-emerald-400"
                  >
                    {POPULAR_BANKS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    10-Digit Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    required
                    value={accountNumber}
                    onChange={handleAccountChange}
                    placeholder="e.g. 0123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/20 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  {isResolvingName && (
                    <p className="text-[11px] text-amber-400 mt-1 animate-pulse">Resolving Account Name...</p>
                  )}
                  {accountName && !isResolvingName && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-semibold">✓ {accountName}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isClaiming}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isClaiming ? 'Processing Transfer...' : `Disburse ₦${wish.giftAmount?.toLocaleString()} Now`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating Download Toast */}
      {downloadNotice && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500/90 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-emerald-400 animate-bounce">
          <span>✓ {downloadNotice}</span>
        </div>
      )}
    </div>
  );
};
