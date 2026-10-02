import React, { useState, useEffect } from 'react';
import { Birthwish } from '../types';
import { happyBirthdayAudio } from '../lib/happyBirthdayAudio';
import { Interactive3DCake } from './Interactive3DCake';
import { RAINBOW_COLORS } from '../lib/colors';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Download, 
  Sparkles, 
  RotateCcw, 
  ShieldCheck,
  Heart,
  Printer
} from 'lucide-react';

interface CelebrantLastPageProps {
  wish: Birthwish;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onBack: () => void;
  onClaimClick: () => void;
  hasPaymentStatus: boolean;
}

export const CelebrantLastPage: React.FC<CelebrantLastPageProps> = ({
  wish,
  themePrimaryColor,
  themeSecondaryColor,
  onBack,
  onClaimClick,
  hasPaymentStatus,
}) => {
  const [candlesLit, setCandlesLit] = useState<boolean>(true);
  const [blownNotice, setBlownNotice] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(happyBirthdayAudio.isPlaying());

  useEffect(() => {
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.4 },
      colors: [themePrimaryColor, themeSecondaryColor, '#ffffff', '#fbbf24', '#10b981'],
    });
  }, [themePrimaryColor, themeSecondaryColor]);

  const handleToggleMusic = () => {
    happyBirthdayAudio.toggleSong((playing) => {
      setIsPlaying(playing);
    });
  };

  // Blow candle action
  const handleBlowCandle = () => {
    setCandlesLit(false);
    setBlownNotice(true);

    // Audio chime & explosion
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: [themePrimaryColor, themeSecondaryColor, '#ffffff', '#fbbf24'],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: [themePrimaryColor, themeSecondaryColor, '#ffffff', '#f43f5e'],
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4 sm:p-8 animate-fade-in text-slate-100"
      style={{
        background: `radial-gradient(circle at 50% 20%, ${themePrimaryColor}25 0%, #030712 85%)`
      }}
    >
      {/* Top Navbar */}
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 py-4 px-2 border-b border-white/10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-mono-tech transition-colors cursor-pointer border"
          style={{ borderColor: `${themePrimaryColor}40`, color: themeSecondaryColor }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back To Celebration</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleMusic}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer font-mono-tech"
            style={{
              borderColor: isPlaying ? themePrimaryColor : 'rgba(255,255,255,0.15)',
              backgroundColor: isPlaying ? `${themePrimaryColor}25` : 'rgba(15, 23, 42, 0.9)',
              color: isPlaying ? '#ffffff' : '#cbd5e1',
              boxShadow: isPlaying ? `0 0 12px ${themePrimaryColor}60` : 'none'
            }}
          >
            {isPlaying ? (
              <>
                <Volume2 className="w-3.5 h-3.5 animate-pulse" style={{ color: themeSecondaryColor }} />
                <span>Music Playing 🎶</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Play Music 🎵</span>
              </>
            )}
          </button>

          {hasPaymentStatus && (
            <button
              onClick={onClaimClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs font-mono-tech transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Claim ₦{wish.giftAmount?.toLocaleString()}</span>
            </button>
          )}

          {/* Print Keepsake Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/40 text-amber-200 font-bold text-xs font-mono-tech transition-all shadow-md cursor-pointer"
            title="Print tribute or save as PDF keepsake"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Print Keepsake</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-3xl mx-auto space-y-10 my-6">
        
        {/* Celebrant Avatar & 3-Tier Layered Cake */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1 shadow-2xl mx-auto"
              style={{
                background: `linear-gradient(135deg, ${themePrimaryColor}, ${themeSecondaryColor}, #ffffff)`,
                boxShadow: `0 0 30px ${themePrimaryColor}60`
              }}
            >
              <img
                src={wish.mainImage}
                alt={wish.celebrantName}
                className="w-full h-full object-cover object-center rounded-full border-2 border-slate-950"
              />
            </div>
            <div 
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-slate-950 px-3.5 py-0.5 rounded-full text-xs font-bold font-mono-tech uppercase tracking-wider shadow-md whitespace-nowrap"
              style={{ backgroundColor: themeSecondaryColor }}
            >
              👑 {wish.celebrantNickname || wish.celebrantName}
            </div>
          </div>

          {/* Realistic 3D Interactive Cake in Celebrant's Rainbow Theme Color */}
          <div className="py-2 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-[440px] flex justify-center">
              <Interactive3DCake
                primaryColor={themePrimaryColor}
                secondaryColor={themeSecondaryColor}
                particleColors={RAINBOW_COLORS[wish.colorTheme]?.particleColors}
                isBlownExternal={!candlesLit}
                onBlow={handleBlowCandle}
                celebrantName={wish.celebrantName}
              />
            </div>

            {/* Candle Status & Blow Button */}
            <div className="mt-3">
              {candlesLit ? (
                <button
                  onClick={handleBlowCandle}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold text-xs uppercase tracking-wider shadow-xl transform hover:scale-105 active:scale-95 transition-all cursor-pointer font-mono-tech"
                  style={{
                    background: `linear-gradient(90deg, #f43f5e, ${themePrimaryColor})`,
                    boxShadow: `0 0 25px ${themePrimaryColor}60`
                  }}
                >
                  <span>Blow Out The Candle 💨</span>
                </button>
              ) : (
                <div className="space-y-3 text-center">
                  <p 
                    className="font-cinzel font-bold text-sm sm:text-base animate-bounce"
                    style={{ color: themeSecondaryColor }}
                  >
                    🎉 WISH GRANTED! MAY YOUR NEW AGE BE FILLED WITH BOUNDLESS FAVOR &amp; JOY! 🎉
                  </p>
                  <button
                    onClick={() => {
                      setCandlesLit(true);
                      setBlownNotice(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 border border-white/20 hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                    style={{ color: themeSecondaryColor }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Relight Candle</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Titles */}
          <div className="space-y-2">
            <h1 
              className="text-3xl sm:text-5xl font-black font-cinzel text-white tracking-tight drop-shadow-md"
              style={{ textShadow: `0 0 25px ${themePrimaryColor}` }}
            >
              HAPPY BIRTHDAY {wish.celebrantName.toUpperCase()}
            </h1>
            <p 
              className="text-xs sm:text-sm font-mono-tech uppercase tracking-widest"
              style={{ color: themeSecondaryColor }}
            >
              Honoring {wish.category} · Crafted with eternal love by {wish.senderName}
            </p>
          </div>
        </div>

        {/* The Heartfelt Epistle Glass Panel (Exact reference formatting, borders & typography) */}
        <div 
          className="rounded-3xl p-8 sm:p-14 border shadow-2xl space-y-6 text-slate-200 text-sm sm:text-base leading-relaxed text-left"
          style={{
            backgroundColor: 'rgba(11, 18, 38, 0.95)',
            borderColor: `${themePrimaryColor}66`,
            boxShadow: `0 0 40px ${themePrimaryColor}30, 0 20px 40px rgba(0,0,0,0.8)`
          }}
        >
          <div 
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: `${themePrimaryColor}33` }}
          >
            <h2 
              className="text-2xl sm:text-3xl font-bold font-cinzel"
              style={{ color: themeSecondaryColor }}
            >
              HAPPY BIRTHDAY, {wish.celebrantNickname || wish.celebrantName} 🎉
            </h2>
            <span className="flex items-center gap-1 text-xs text-rose-400 font-mono-tech">
              <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              <span>Personal Epistle</span>
            </span>
          </div>

          {/* User's Epistle text formatted beautifully */}
          <div className="font-editorial text-slate-100 text-base sm:text-lg leading-relaxed whitespace-pre-line space-y-4">
            {wish.finalEpistle}
          </div>

          {/* Highlight quote banner in chosen theme colors */}
          <div 
            className="pl-4 border-l-3 space-y-1.5 py-1 text-sm italic font-mono-tech"
            style={{
              borderColor: themePrimaryColor,
              color: '#ffffff',
              backgroundColor: `${themePrimaryColor}10`
            }}
          >
            &ldquo;{wish.shortMessage}&rdquo;
          </div>

          <p 
            className="text-xl sm:text-2xl font-bold font-cinzel pt-4 text-center"
            style={{ 
              color: '#ffffff',
              textShadow: `0 0 20px ${themePrimaryColor}`
            }}
          >
            Your story is still being written.
          </p>

          {/* Signature block */}
          <div 
            className="pt-6 border-t text-center space-y-1 text-xs font-mono-tech"
            style={{ borderColor: `${themePrimaryColor}33`, color: '#94a3b8' }}
          >
            <p className="font-semibold text-sm" style={{ color: themeSecondaryColor }}>
              With highest love, honor, admiration and gratitude,
            </p>
            <p className="text-white font-bold">
              {wish.senderName} ({wish.senderRelation})
            </p>
          </div>
        </div>

        {/* Bottom Celebration Action Buttons */}
        <div className="text-center pt-4 pb-12 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => {
              confetti({
                particleCount: 220,
                spread: 100,
                origin: { y: 0.6 },
                colors: [themePrimaryColor, themeSecondaryColor, '#ffffff', '#fbbf24', '#10b981'],
              });
            }}
            className="px-8 py-3.5 rounded-full font-bold font-orbitron text-xs sm:text-sm uppercase tracking-wider text-slate-950 shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${themeSecondaryColor}, ${themePrimaryColor}, #ffffff)`,
              boxShadow: `0 0 25px ${themePrimaryColor}60`
            }}
          >
            <Sparkles className="w-4 h-4 inline-block mr-2 text-slate-950" />
            <span>Celebrate Again 🎊</span>
          </button>

          {hasPaymentStatus && (
            <button
              onClick={onClaimClick}
              className="px-8 py-3.5 rounded-full font-bold font-orbitron text-xs sm:text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>Disburse Gift ₦{wish.giftAmount?.toLocaleString()}</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-8 py-3.5 rounded-full font-bold font-orbitron text-xs sm:text-sm uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <Printer className="w-4 h-4 fill-current" />
            <span>Print Physical Keepsake</span>
          </button>
        </div>
      </div>
    </div>
  );
};
