import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Cake } from 'lucide-react';

interface CelebrantSurpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebrantName: string;
  shortMessage: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  onOpenFinalPage: () => void;
}

export const CelebrantSurpriseModal: React.FC<CelebrantSurpriseModalProps> = ({
  isOpen,
  onClose,
  celebrantName,
  shortMessage,
  themePrimaryColor,
  themeSecondaryColor,
  onOpenFinalPage,
}) => {
  const [typedMessage, setTypedMessage] = useState<string>('');

  // Display the user's exact typed short message
  const fullText = shortMessage?.trim() || `Happy Birthday, ${celebrantName}! Wishing you endless smiles, divine health, supernatural wisdom, and global impact. May all your dreams and glorious visions come true.`;

  useEffect(() => {
    if (!isOpen) {
      setTypedMessage('');
      return;
    }

    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.5 },
      colors: [themePrimaryColor, themeSecondaryColor, '#ffffff', '#fbbf24', '#38bdf8'],
    });

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setTypedMessage(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [isOpen, fullText, themePrimaryColor, themeSecondaryColor]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="w-full max-w-lg rounded-3xl p-6 sm:p-9 text-center shadow-2xl relative transition-transform animate-scale-up"
        style={{
          backgroundColor: '#0b1226f2',
          border: `1.5px solid ${themePrimaryColor}66`,
          boxShadow: `0 0 50px ${themePrimaryColor}40, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center text-lg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-4">
          {/* Gift Icon Badge */}
          <div 
            className="w-14 h-14 mx-auto rounded-2xl p-0.5 shadow-xl"
            style={{
              background: `linear-gradient(135deg, ${themePrimaryColor}, ${themeSecondaryColor})`,
              boxShadow: `0 0 20px ${themePrimaryColor}50`
            }}
          >
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-2xl">
              🎁
            </div>
          </div>

          <h3 
            className="text-2xl sm:text-3xl font-bold font-cinzel text-white drop-shadow-md"
            style={{ textShadow: `0 0 15px ${themePrimaryColor}90` }}
          >
            A Little Surprise 🎁
          </h3>

          <p 
            className="text-xs font-mono-tech uppercase tracking-widest"
            style={{ color: themeSecondaryColor }}
          >
            Made With Honor Just For You · {celebrantName}
          </p>

          {/* Typewriter Body Text */}
          <div className="py-4 min-h-[90px] text-slate-200 text-sm sm:text-base leading-relaxed font-light text-left sm:text-center italic px-2">
            <span>{typedMessage}</span>
            {typedMessage.length < fullText.length && (
              <span 
                className="inline-block w-1.5 h-4 ml-1 animate-pulse"
                style={{ backgroundColor: themePrimaryColor }}
              />
            )}
          </div>

          {/* Tri-color glowing dots */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span 
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md"
              style={{ backgroundColor: themePrimaryColor, boxShadow: `0 0 8px ${themePrimaryColor}` }}
            />
            <span 
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md"
              style={{ backgroundColor: themeSecondaryColor, boxShadow: `0 0 8px ${themeSecondaryColor}` }}
            />
            <span 
              className="w-2.5 h-2.5 rounded-full animate-pulse shadow-md bg-white"
              style={{ boxShadow: '0 0 8px #ffffff' }}
            />
          </div>

          {/* Final Message / Next Button */}
          <div className="pt-4">
            <button
              onClick={() => {
                onClose();
                onOpenFinalPage();
              }}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-orbitron font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-950 shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${themeSecondaryColor}, ${themePrimaryColor}, #ffffff)`,
                boxShadow: `0 0 25px ${themePrimaryColor}70`
              }}
            >
              <Cake className="w-4 h-4 text-slate-950" />
              <span>Final Message 🎂</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
