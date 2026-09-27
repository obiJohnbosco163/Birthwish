import React, { useEffect, useRef, useState } from 'react';

interface CelebrantFireworksIntroProps {
  celebrantName: string;
  themePrimaryColor: string;
  onEnter: () => void;
}

export const CelebrantFireworksIntro: React.FC<CelebrantFireworksIntroProps> = ({
  celebrantName,
  themePrimaryColor,
  onEnter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showEnterButton, setShowEnterButton] = useState<boolean>(false);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

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
      ctx.font = 'bold 24px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = themePrimaryColor;
      ctx.shadowColor = themePrimaryColor;
      ctx.shadowBlur = 18;

      const upperName = celebrantName.toUpperCase();
      if (width > 640) {
        ctx.fillText(`HAPPY BIRTHDAY ${upperName}`, width / 2, height * 0.35);
      } else {
        ctx.fillText(`HAPPY BIRTHDAY`, width / 2, height * 0.32);
        ctx.fillText(upperName, width / 2, height * 0.38);
      }
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();

    // Show button after 2.2 seconds
    const timer = setTimeout(() => {
      setShowEnterButton(true);
    }, 2200);

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

      {showEnterButton && (
        <div className="relative z-10 animate-fade-in text-center px-4 mt-48 sm:mt-56">
          <button
            onClick={handleEnterClick}
            className="cursor-pointer uppercase tracking-widest text-white rounded-full px-8 sm:px-12 py-3.5 sm:py-4 font-orbitron font-bold text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            style={{
              backgroundColor: 'rgba(4, 7, 20, 0.85)',
              border: `2px solid ${themePrimaryColor}`,
              boxShadow: `0 0 25px ${themePrimaryColor}80, inset 0 0 15px ${themePrimaryColor}40`,
            }}
          >
            <span className="flex items-center gap-2">
              <span>Enter Your Dream World</span>
              <span>✨</span>
            </span>
          </button>
          <p className="text-xs text-slate-400 font-mono-tech mt-3 tracking-wider">
            Click to enter {celebrantName}&apos;s bespoke birthday sanctuary
          </p>
        </div>
      )}
    </div>
  );
};
