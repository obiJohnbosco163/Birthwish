import React, { useState, useRef, useEffect } from 'react';
import { BirthwishLogo } from './BirthwishLogo';
import { ThemeToggle } from './ThemeToggle';
import { Sparkles, PlusCircle, LogOut, ShieldCheck, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Birthwish, UserProfile } from '../types';
import { getUserQuota } from '../lib/subscription';
import { Crown, Zap } from 'lucide-react';

interface NavbarProps {
  user: UserProfile | null;
  wishes?: Birthwish[];
  onOpenAuth: () => void;
  onSignOut: () => void;
  onCreateClick: () => void;
  onDashboardClick: () => void;
  onUpgradeClick?: () => void;
  onLandingClick?: () => void;
  currentView: 'landing' | 'dashboard' | 'create' | 'view';
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  wishes = [],
  onOpenAuth,
  onSignOut,
  onCreateClick,
  onDashboardClick,
  onUpgradeClick,
  onLandingClick,
  currentView,
  theme,
  onToggleTheme,
}) => {
  const quota = getUserQuota(user, wishes);
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

          {/* Plan Status Badges & Controls */}
          {user && (
            <>
              {quota.isFounder ? (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span>Founder VIP</span>
                </div>
              ) : quota.isPremium ? (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-bold font-mono">
                  <Crown className="w-3.5 h-3.5 text-pink-400" />
                  <span>Premium Active</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-pink-500/15 hover:from-amber-500/25 hover:to-pink-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold font-mono transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Upgrade to unlimited Birthwishes"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upgrade ({quota.remainingCount}/3 left)</span>
                </button>
              )}
            </>
          )}

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active &amp; Secure</span>
          </div>


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

                  {/* Subscription Plan Status in Menu */}
                  <div className="p-2.5 my-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Plan</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        quota.isFounder 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : quota.isPremium 
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' 
                          : 'bg-white/10 text-slate-300'
                      }`}>
                        {quota.planName}
                      </span>
                    </div>

                    {!quota.isUnlimited && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                          <span>Usage:</span>
                          <span>{quota.usedCount} / 3 Free Wishes</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            if (onUpgradeClick) onUpgradeClick();
                          }}
                          className="w-full mt-1 py-1.5 px-2 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Upgrade to Unlimited</span>
                        </button>
                      </div>
                    )}

                    {quota.isPremium && !quota.isFounder && (
                      <p className="text-[10px] text-pink-400 font-mono">
                        Active for next {quota.daysRemaining} days
                      </p>
                    )}
                  </div>

                  <div className="py-1 space-y-1">
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
