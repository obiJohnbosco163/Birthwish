import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { happyBirthdayAudio } from '../lib/happyBirthdayAudio';
import { Sparkles, Volume2, VolumeX, Heart, Flame } from 'lucide-react';

interface CelebrantCakeBlowProps {
  celebrantName: string;
  themePrimaryColor?: string;
  onCandleBlown?: () => void;
}

export const CelebrantCakeBlow: React.FC<CelebrantCakeBlowProps> = ({
  celebrantName,
  themePrimaryColor = '#ec4899',
  onCandleBlown,
}) => {
  const [isBlown, setIsBlown] = useState<boolean>(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState<boolean>(false);
  const [wishMade, setWishMade] = useState<boolean>(false);

  // Sync with audio service state
  React.useEffect(() => {
    happyBirthdayAudio.setListener((playing) => {
      setIsPlayingMusic(playing);
    });
    return () => {
      // Don't kill abruptly if user moves between tabs, but ensure clean cleanup on unmount
    };
  }, []);

  const handleBlowCandle = () => {
    if (isBlown) {
      // Allow relighting
      setIsBlown(false);
      setWishMade(false);
      return;
    }

    setIsBlown(true);
    setWishMade(true);

    // Trigger massive celebratory confetti burst
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#ec4899', '#f43f5e', '#eab308', '#06b6d4', '#a855f7'],
    });

    // Start repeating continuous Happy Birthday loop until turned off by the user
    happyBirthdayAudio.startLoopingSong();
    setIsPlayingMusic(true);

    if (onCandleBlown) {
      onCandleBlown();
    }
  };

  const toggleMusic = () => {
    happyBirthdayAudio.toggleSong((playing) => {
      setIsPlayingMusic(playing);
    });
  };

  return (
    <div className="w-full flex flex-col items-center justify-center my-6 p-6 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/15 shadow-2xl relative overflow-hidden text-center">
      {/* Glow behind the cake */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40 transition-all duration-700"
        style={{
          backgroundColor: isBlown ? '#ec4899' : '#f59e0b',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Stage Badge & Header */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-400 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Make a Birthday Wish, {celebrantName}!</span>
        </div>

        <h3 className="font-haute text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
          {isBlown ? '🎉 Wish Sent to the Heavens! 🎉' : 'Blow Out the Candle & Make a Wish'}
        </h3>
        <p className="text-xs text-slate-300 max-w-xs mb-6">
          {isBlown
            ? 'The Happy Birthday anthem is playing in continuous loop! Tap the music button to toggle mute anytime.'
            : 'Close your eyes, think of your sweetest dream, and click the cake candle to blow it out.'}
        </p>

        {/* ================= INTERACTIVE 3-TIER BIRTHDAY CAKE ================= */}
        <div 
          onClick={handleBlowCandle}
          className="relative cursor-pointer group flex flex-col items-center select-none py-4 transition-transform hover:scale-105 active:scale-95"
          title={isBlown ? 'Click to re-light the candle' : 'Click to blow out the candle!'}
        >
          {/* Flame & Candle Wick */}
          <div className="relative flex flex-col items-center -mb-1">
            {!isBlown ? (
              <div className="relative flex flex-col items-center animate-bounce">
                {/* Candle Flame (Warm Yellow / Orange Glowing Tear-drop) */}
                <div className="w-5 h-7 rounded-full bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 shadow-[0_0_20px_#f59e0b] animate-pulse" />
                <div className="w-2.5 h-3.5 -mt-3.5 rounded-full bg-blue-300/80 blur-[1px]" />
              </div>
            ) : (
              /* Smoke effect when blown out */
              <div className="h-7 flex flex-col items-center animate-fade-in">
                <div className="w-1.5 h-4 bg-slate-400/50 rounded-full blur-[1.5px] -translate-y-1 animate-pulse" />
                <span className="text-[10px] text-pink-400 font-bold tracking-widest uppercase">
                  💨 BLOWN!
                </span>
              </div>
            )}
            
            {/* Candle Stick */}
            <div className="w-3.5 h-8 bg-gradient-to-r from-pink-300 via-white to-pink-200 rounded-t shadow-md border border-pink-400/30 flex items-center justify-center">
              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,#f43f5e_3px,#f43f5e_6px)] opacity-60 rounded-t" />
            </div>
          </div>

          {/* Tier 1 (Top Small Tier) */}
          <div className="w-24 h-9 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-300 to-pink-400 shadow-md border-b-4 border-rose-500 flex items-center justify-center relative overflow-hidden">
            {/* White Frosting Drips */}
            <div className="absolute top-0 w-full h-2.5 bg-white/90 rounded-b-xl shadow-inner" />
            <span className="text-[10px] font-bold text-rose-900 tracking-wider">★ LOVE ★</span>
          </div>

          {/* Tier 2 (Middle Tier) */}
          <div className="w-36 h-11 -mt-1.5 rounded-2xl bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 shadow-lg border-b-4 border-amber-400 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-3 bg-pink-100/90 rounded-b-xl shadow-inner" />
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-pink-500" />
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
          </div>

          {/* Tier 3 (Bottom Large Tier) */}
          <div className="w-52 h-14 -mt-1.5 rounded-2xl bg-gradient-to-r from-rose-400 via-pink-400 to-rose-400 shadow-xl border-b-4 border-rose-600 flex items-center justify-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-3.5 bg-white/95 rounded-b-xl shadow-inner" />
            <p className="font-signature text-xl text-white drop-shadow-md">
              Happy Birthday {celebrantName}
            </p>
          </div>

          {/* Cake Stand / Plate */}
          <div className="w-60 h-3 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-300 shadow-xl -mt-1 border border-slate-200/50" />
        </div>

        {/* Action Controls & Repeating Audio Toggle Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleBlowCandle}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
              isBlown
                ? 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 animate-pulse'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>{isBlown ? 'Relight Candle 🕯️' : 'Click to Blow Candle 🎂'}</span>
          </button>

          {/* Repeating Happy Birthday Song Button */}
          <button
            type="button"
            onClick={toggleMusic}
            className={`px-4 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
              isPlayingMusic
                ? 'bg-pink-500 text-white border-pink-400 shadow-lg shadow-pink-500/25 animate-pulse'
                : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
            }`}
            title="Music loops repeatedly until turned off"
          >
            {isPlayingMusic ? (
              <>
                <Volume2 className="w-4 h-4 text-white" />
                <span>Birthday Song: Playing 🎵</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-300" />
                <span>Play Birthday Song 🎵</span>
              </>
            )}
          </button>
        </div>

        {wishMade && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <Heart className="w-4 h-4 text-emerald-400 shrink-0 fill-emerald-400" />
            <span>May all your quiet and deepest prayers turn into wonderful loud testimonies!</span>
          </div>
        )}
      </div>
    </div>
  );
};
