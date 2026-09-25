import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: () => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className = '' }) => {
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isLight ? 'Switch to Dark Mode' : 'Switch to White Mode'}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 cursor-pointer shadow-sm border ${
        isLight
          ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
          : 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
      } ${className}`}
      aria-label="Toggle dark and white mode"
    >
      {isLight ? (
        <>
          <Moon className="w-3.5 h-3.5 text-indigo-600 transition-transform duration-300 rotate-0" />
          <span className="text-[11px] font-medium text-slate-700">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-amber-300 transition-transform duration-300 hover:rotate-45" />
          <span className="text-[11px] font-medium text-slate-200">White Mode</span>
        </>
      )}
    </button>
  );
};
