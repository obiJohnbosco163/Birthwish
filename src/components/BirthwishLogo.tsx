import React from 'react';

interface BirthwishLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
}

export const BirthwishLogo: React.FC<BirthwishLogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = 'text-white',
  className = '',
}) => {
  const pixelMap = {
    xs: 30,
    sm: 38,
    md: 48,
    lg: 72,
    xl: 104,
  };

  const dim = pixelMap[size];

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      <div 
        className="relative flex-shrink-0 transition-transform duration-500 ease-out hover:scale-105"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-[0_4px_16px_rgba(236,72,153,0.22)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Elegant warm silk ivory background */}
            <radialGradient id="bwLuxBg" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#FCF9F6" />
              <stop offset="100%" stopColor="#F5EFE6" />
            </radialGradient>

            {/* Couture pink signature gradient */}
            <linearGradient id="bwCouturePink" x1="10%" y1="15%" x2="90%" y2="85%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="45%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#BE185D" />
            </linearGradient>

            {/* Hairline champagne gold rim */}
            <linearGradient id="bwFineGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2BD77" />
              <stop offset="50%" stopColor="#F6E2B3" />
              <stop offset="100%" stopColor="#C99E55" />
            </linearGradient>
          </defs>

          {/* Circular Frame - Minimalist Haute Horlogerie / Atelier Seal */}
          <circle cx="50" cy="50" r="47" fill="url(#bwLuxBg)" stroke="url(#bwFineGold)" strokeWidth="1.2" />
          <circle cx="50" cy="50" r="43.5" fill="none" stroke="#FCE7F3" strokeWidth="0.8" opacity="0.9" />

          {/* Micro signature accent - delicate heart spark at top */}
          <circle cx="50" cy="14" r="1.2" fill="#EC4899" />

          {/* Ultra-fine, artistic signature monogram 'BW' */}
          <path
            d="M 28 26
               C 27.5 24.5 28.5 23 30.5 23
               C 34 23 36 25 36 29
               L 36 71
               C 36 73 34.5 75 32 75
               C 30 75 28.5 73.5 29 72"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d="M 36 28
               C 44 26 53 28 53 37
               C 53 44 47 47.5 40 48"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />

          <path
            d="M 38 48
               C 47 47.5 56 50 56 60
               C 56 68 47 71 36 71"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />

          <path
            d="M 37 71
               C 44 71 49 68 53 62
               C 55 58 57 52 59 40"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.85"
          />

          <path
            d="M 54 36
               C 56 46 58 60 60 72
               C 60.5 73.5 61.8 74 63 73"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />

          <path
            d="M 62 72
               L 69 44
               C 69.5 42 70.8 42 71.5 44"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          <path
            d="M 71 44
               L 76 72
               C 76.5 73.5 77.8 74 79 73"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.6"
            strokeLinecap="round"
          />

          <path
            d="M 78 72
               C 82 58 84 45 87 34
               C 88 30 90 31 88.5 34
               C 87 37 84 43 83 48"
            stroke="url(#bwCouturePink)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-signature text-3xl sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 tracking-wide font-normal ${textClassName}`}>
              Birthwish
            </span>
            <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/25 font-semibold">
              Atelier
            </span>
          </div>
          <span className="text-[11px] text-slate-400 tracking-wide font-medium font-editorial">
            Celebrate the ones you love
          </span>
        </div>
      )}
    </div>
  );
};
