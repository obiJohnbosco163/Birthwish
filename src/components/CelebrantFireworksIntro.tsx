import React, { useEffect, useRef, useState } from 'react';

interface CelebrantFireworksIntroProps {
  celebrantName: string;
  celebrantImage?: string;
  celebrantDateOfBirth?: string;
  themePrimaryColor: string;
  onEnter: () => void;
}

export const CelebrantFireworksIntro: React.FC<CelebrantFireworksIntroProps> = ({
  celebrantName,
  celebrantImage,
  celebrantDateOfBirth,
  themePrimaryColor,
  onEnter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showEnterButton, setShowEnterButton] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Format date of birth nicely if available (e.g. "October 24" or "Born 1998-10-24")
  const formattedDob = React.useMemo(() => {
    if (!celebrantDateOfBirth) return '';
    try {
      const parts = celebrantDateOfBirth.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[monthIndex]} ${day}${year ? `, ${year}` : ''}`;
      }
      return celebrantDateOfBirth;
    } catch {
      return celebrantDateOfBirth;
    }
  }, [celebrantDateOfBirth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const rockets: Array<{
      x: number;
      y: number;
      targetY: number;
      vy: number;
      color: string;
    }> = [];

    const sparks: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      alpha: number;
      color: string;
      size: number;
      decay: number;
    }> = [];

    const palette = [
      themePrimaryColor,
      '#ffffff',
      '#fbbf24',
      '#f43f5e',
      '#38bdf8',
      '#a855f7',
      '#10b981',
    ];

    const launchRocket = () => {
      rockets.push({
        x: Math.random() * (width - 200) + 100,
        y: height,
        targetY: height * 0.45 * Math.random() + height * 0.15,
        vy: -(Math.random() * 4 + 7),
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    };

    const explodeRocket = (x: number, y: number, color: string) => {
      for (let i = 0; i < 65; i++) {
        const angle = ((Math.PI * 2) / 60) * i + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 5 + 1.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 2.5 + 1,
          decay: Math.random() * 0.015 + 0.015,
        });
      }
    };

    let frame = 0;
    const render = () => {
      ctx.fillStyle = 'rgba(4, 7, 20, 0.22)';
      ctx.fillRect(0, 0, width, height);

      frame++;
      if (frame % 25 === 0 && frame < 400) {
        launchRocket();
      }

      // Render rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.y += r.vy;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.shadowColor = r.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (r.y <= r.targetY) {
          explodeRocket(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Render sparks
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05; // gravity
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = Math.max(0, s.alpha);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // Glowing Title rendered onto canvas with custom celebrant name
      ctx.font = 'bold 26px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = themePrimaryColor;
      ctx.shadowColor = themePrimaryColor;
      ctx.shadowBlur = 18;

      const upperName = celebrantName.toUpperCase();
      if (width > 640) {
        ctx.fillText(`✨ HAPPY BIRTHDAY ✨`, width / 2, Math.max(50, height * 0.12));
      } else {
        ctx.fillText(`HAPPY BIRTHDAY`, width / 2, Math.max(45, height * 0.10));
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    // Show button after 1.8 seconds
    const timer = setTimeout(() => {
      setShowEnterButton(true);
    }, 1800);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      clearTimeout(timer);
    };
  }, [celebrantName, themePrimaryColor]);

  const handleEnterClick = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onEnter();
    }, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#040714' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Main Celebrant Spotlight Box on the Fireworks Screen */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-md w-full animate-fade-in pointer-events-auto">
        {/* Main Image Avatar with Glowing Ring */}
        {celebrantImage && (
          <div className="relative mb-4 group">
            <div 
              className="absolute -inset-1 rounded-full blur-md opacity-75 animate-pulse"
              style={{ backgroundColor: themePrimaryColor }}
            />
            <div 
              className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 shadow-2xl transition-transform duration-500 group-hover:scale-105"
              style={{ borderColor: themePrimaryColor }}
            >
              <img
                src={celebrantImage}
                alt={celebrantName}
                className="w-full h-full object-cover object-center"
              />
            </div>
            {/* Sparkle badge */}
            <div 
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-lg"
              style={{ backgroundColor: themePrimaryColor, color: '#fff' }}
            >
              👑
            </div>
          </div>
        )}

        {/* Celebrant Name */}
        <h1 
          className="font-orbitron font-extrabold text-2xl sm:text-3xl tracking-wider text-white uppercase drop-shadow-lg"
          style={{ textShadow: `0 0 20px ${themePrimaryColor}` }}
        >
          {celebrantName}
        </h1>

        {/* Celebrant Date of Birth Badge if provided */}
        {formattedDob && (
          <div className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-md">
            <span className="text-sm">🎂</span>
            <span className="text-xs font-semibold tracking-wider text-slate-200">
              {formattedDob}
            </span>
          </div>
        )}

        {/* Enter Button */}
        {showEnterButton && (
          <div className="mt-6 sm:mt-8 animate-fade-in text-center w-full">
            <button
              onClick={handleEnterClick}
              className="cursor-pointer uppercase tracking-widest text-white rounded-full px-8 sm:px-12 py-3.5 sm:py-4 font-orbitron font-bold text-xs sm:text-sm transition-all transform hover:scale-105 active:scale-95 shadow-2xl w-full sm:w-auto"
              style={{
                backgroundColor: 'rgba(4, 7, 20, 0.85)',
                border: `2px solid ${themePrimaryColor}`,
                boxShadow: `0 0 25px ${themePrimaryColor}80, inset 0 0 15px ${themePrimaryColor}40`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Enter Your Dream World</span>
                <span>✨</span>
              </span>
            </button>
            <p className="text-[11px] text-slate-400 font-mono-tech mt-2.5 tracking-wider">
              Click to open {celebrantName}&apos;s bespoke birthday sanctuary
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
