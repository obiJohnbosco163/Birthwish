import React, { useState, useRef, useEffect } from 'react';
import { BirthwishLogo } from './BirthwishLogo';
import { ThemeToggle } from './ThemeToggle';
import { Sparkles, PlusCircle, LogOut, ShieldCheck, LayoutDashboard, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onCreateClick: () => void;
  onDashboardClick: () => void;
  onLandingClick?: () => void;
  currentView: 'landing' | 'dashboard' | 'create' | 'view';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onSignOut,
  onCreateClick,
  onDashboardClick,
  onLandingClick,
  currentView,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`sticky top-0 z-40 w-full border-b backdrop-blur-2xl transition-colors duration-300 ${
      isLight 
        ? 'bg-white/90 border-slate-200 text-slate-800' 
        : 'bg-[#080c14]/90 border-white/10 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo with Haute-Couture Monogram & Signature Title */}
        <button 
          onClick={user ? onDashboardClick : onLandingClick}
          className="flex items-center text-left focus:outline-none group cursor-pointer"
        >
          <BirthwishLogo size="md" showText={true} />
        </button>

        {/* Center Navigation Links - STRICTLY VISIBLE ONLY WHEN LOGGED IN (Dashboard & Create only, No Home tab) */}
        {user ? (
          <nav className={`hidden md:flex items-center gap-1 p-1.5 rounded-full border shadow-inner animate-fade-in ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-white/[0.04] border-white/10'
          }`}>
            <button
              onClick={onDashboardClick}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? isLight ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/15 text-white shadow-sm'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={onCreateClick}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'create'
                  ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-white/50' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Create Birthwish</span>
            </button>
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs font-editorial tracking-wider">
            <span className="font-signature text-pink-500 text-2xl">Celebrate</span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
              the ones you love with heartfelt epistles &amp; gifts
            </span>
          </div>
        )}

        {/* Right Action & User Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dark / White Mode Toggle */}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active &amp; Secure</span>
          </div>

          {/* New Tribute button */}
          {user && (
            <button
              onClick={onCreateClick}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white text-xs font-bold shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Tribute</span>
            </button>
          )}

          {/* User Account / Profile Dropdown with Logout */}
          {user ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-full border transition-all cursor-pointer ${
                  isLight 
                    ? 'hover:bg-slate-100 border-slate-200 bg-white' 
                    : 'hover:bg-white/10 border-white/10 bg-white/5'
                }`}
                title="Click to view profile & log out"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-amber-400 p-0.5 shadow-md">
                  <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs ${
                    isLight ? 'bg-white text-pink-600' : 'bg-[#0b0f17] text-pink-300'
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <p className={`text-xs font-bold truncate max-w-[140px] leading-tight ${
                    isLight ? 'text-slate-900' : 'text-slate-100'
                  }`}>
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold leading-none">View Profile</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-2xl border shadow-2xl p-3 z-50 animate-fade-in ${
                  isLight 
                    ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/70' 
                    : 'bg-[#0f1623] border-white/15 text-white shadow-black/80'
                }`}>
                  <div className="flex items-center gap-3 pb-3 border-b border-white/10 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-amber-400 p-0.5">
                      <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-sm ${
                        isLight ? 'bg-white text-pink-600' : 'bg-[#0b0f17] text-pink-300'
                      }`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{user.name || 'Celebrant Creator'}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onDashboardClick();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-pink-500" />
                      <span>Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onCreateClick();
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 text-emerald-500" />
                      <span>Create Birthwish</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Please log in to continue
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
