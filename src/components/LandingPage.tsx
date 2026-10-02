import React, { useState } from 'react';
import { BirthwishLogo } from './BirthwishLogo';
import { Interactive3DCake } from './Interactive3DCake';
import { ThemeToggle } from './ThemeToggle';
import { UserProfile, Birthwish } from '../types';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';
import { 
  loginWithFirebase, 
  registerWithFirebase, 
  signInWithFirebaseGoogle 
} from '../lib/firebase';
import { 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Mail, 
  Lock, 
  LogIn, 
  PlusCircle, 
  X, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  LogOut,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  user: UserProfile | null;
  wishes?: Birthwish[];
  onViewWish?: (wish: Birthwish) => void;
  onCreateClick?: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onOpenDashboard: () => void;
  onSignOut?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  user,
  onLoginSuccess,
  onOpenDashboard,
  onSignOut,
  theme = 'light',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Facebook-Style Sign Up Modal state
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [birthMonth, setBirthMonth] = useState('Jan');
  const [birthDay, setBirthDay] = useState('1');
  const [birthYear, setBirthYear] = useState('2000');
  const [gender, setGender] = useState('female');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  // Handle Login via Email & Password using Firebase Authentication
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both your email address and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // First attempt Firebase SDK login
      try {
        const fbProfile = await loginWithFirebase(loginEmail, loginPassword);
        onLoginSuccess(fbProfile);
        return;
      } catch (fbErr: any) {
        // Fallback to Supabase/local accounts if needed
        const profile = await signInWithEmail(loginEmail, loginPassword);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login could not be completed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Facebook-Style Sign Up using Firebase Authentication
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !signUpEmail.trim() || !signUpPassword.trim()) {
      setSignUpError('Please fill in all required fields.');
      return;
    }

    setIsSigningUp(true);
    setSignUpError(null);

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const monthMap: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
      };
      const formattedMonth = monthMap[birthMonth] || '01';
      const formattedDay = birthDay.padStart(2, '0');
      const dateOfBirth = `${birthYear}-${formattedMonth}-${formattedDay}`;

      // Register using Firebase Auth SDK
      try {
        const fbProfile = await registerWithFirebase(signUpEmail, signUpPassword, fullName, dateOfBirth, gender);
        // Also register in supabase/local registry backup
        await signUpWithEmail(signUpEmail, signUpPassword, fullName, dateOfBirth, gender).catch(() => {});
        setIsSignUpModalOpen(false);
        onLoginSuccess(fbProfile);
        return;
      } catch (fbErr: any) {
        const profile = await signUpWithEmail(signUpEmail, signUpPassword, fullName, dateOfBirth, gender);
        setIsSignUpModalOpen(false);
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setSignUpError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  // Handle Continue with Google via Firebase
  const handleGoogleAuth = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      const profile = await signInWithFirebaseGoogle();
      if (profile) {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Google sign in could not be completed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex flex-col justify-between overflow-x-hidden transition-colors duration-300 ${
      isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#080c14] text-slate-100'
    }`}>
      
      {/* 
        VERY TOP BAR:
        - TOP LEFT CORNER: Standalone Monogram Seal Logo (NOT grouped with the text Birthwish)
        - TOP RIGHT: Dark / White Mode Toggle
      */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2 flex items-center justify-between z-20">
        <div className="flex items-center">
          <BirthwishLogo size="md" showText={false} />
        </div>

        <div>
          {onToggleTheme && (
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          )}
        </div>
      </header>

      {/* Ambient Lighting Mesh */}
      <div 
        className="fixed inset-0 pointer-events-none -z-10 transition-opacity duration-500"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 18% 22%, rgba(236,72,153,0.08) 0%, transparent 45%), radial-gradient(circle at 82% 65%, rgba(226,189,119,0.06) 0%, transparent 55%), #f8fafc'
            : 'radial-gradient(circle at 18% 22%, rgba(236,72,153,0.14) 0%, transparent 45%), radial-gradient(circle at 82% 65%, rgba(226,189,119,0.09) 0%, transparent 55%), #080c14',
        }}
      />

      {/* Main Facebook-Style 2-Column Split Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-2 pb-16 flex-1 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        
        {/* ================= LEFT COLUMN: BIRTHWISH HEADLINE & REAL 3-TIER 3D CAKE ================= */}
        <div className="w-full lg:w-7/12 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4">
          
          {/* Main Headline & Signature Title (Clean, standalone without inline logo) */}
          <div className="space-y-2 max-w-xl">
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-2.5">
                <h1 className="font-signature text-6xl sm:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 tracking-wide font-normal">
                  Birthwish
                </h1>
                <span className={`font-editorial text-xs tracking-widest uppercase px-2.5 py-0.5 rounded-full font-semibold border ${
                  isLight 
                    ? 'bg-pink-50 text-pink-600 border-pink-200' 
                    : 'bg-pink-500/10 text-pink-300 border-pink-500/25'
                }`}>
                  Atelier
                </span>
              </div>
              <p className={`font-editorial text-xs tracking-widest uppercase font-medium mt-1 ${
                isLight ? 'text-amber-700' : 'text-amber-200/90'
              }`}>
                The Sanctuary for Birthday Love
              </p>
            </div>

            <p className={`font-editorial text-xl sm:text-2xl font-normal leading-relaxed tracking-wide pt-1 ${
              isLight ? 'text-slate-700' : 'text-slate-100'
            }`}>
              Connect with the people you love and celebrate their birthdays with heartfelt epistles, chapters of devotion, and secure cash gifts.
            </p>
          </div>

          {/* Realistic 3-Tier Layer Cake (With ONLY "Click to blow candle" badge) */}
          <div className="w-full pt-1">
            <Interactive3DCake />
          </div>

          {/* Trust Badges Below Cake Intact */}
          <div className={`pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-3.5 text-xs ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-medium">Kora Settlement Vault</span>
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium">Passcode Protected Holding</span>
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
            }`}>
              <Heart className="w-3.5 h-3.5 text-pink-500" />
              <span className="font-medium">Sign in to unlock studio</span>
            </span>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: FACEBOOK-STYLE LOGIN & SIGN UP CARD ================= */}
        <div className="w-full lg:w-5/12 max-w-md mx-auto">
          {user ? (
            /* Logged-In Active State */
            <div className={`glass-card rounded-3xl p-8 border shadow-2xl space-y-6 text-center animate-fade-in ${
              isLight ? 'border-slate-200 shadow-slate-200/60' : 'border-white/15'
            }`}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-amber-400 p-0.5 mx-auto">
                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xl ${
                  isLight ? 'bg-white text-pink-600' : 'bg-[#0b0f17] text-pink-300'
                }`}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </div>
              </div>

              <div>
                <h3 className={`font-haute text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Welcome back, {user.name || user.email.split('@')[0]}!
                </h3>
                <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  You are currently signed in as {user.email}.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-pink-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <span>Enter My Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onSignOut && (
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out of this Account</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Facebook-Style Authentic Login & Sign Up Card */
            <div className={`glass-card rounded-3xl p-6 sm:p-8 border shadow-2xl space-y-4 ${
              isLight ? 'border-slate-200 shadow-slate-200/80 bg-white' : 'border-white/15 shadow-black/80'
            }`}>
              
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-3.5 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Email address or username"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                          : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-3.5 w-4 h-4 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Password"
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                        isLight 
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                          : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Primary Log In Button */}
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-base shadow-xl shadow-pink-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isLoggingIn ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Log In</span>
                    </>
                  )}
                </button>
              </form>

              {/* Continue with Google (Active Firebase OAuth) */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoggingIn}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer border hover:scale-[1.01] active:scale-[0.99] ${
                  isLight 
                    ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm' 
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.97 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="font-bold">Continue with Google</span>
              </button>

              {/* Forgot password */}
              <div className={`text-center pt-1 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <button
                  type="button"
                  onClick={() => setIsSignUpModalOpen(true)}
                  className="hover:text-pink-500 transition-colors cursor-pointer"
                >
                  Forgotten password?
                </button>
              </div>

              {/* Facebook Horizontal Divider */}
              <div className="relative flex items-center justify-center py-1">
                <div className={`border-t w-full ${isLight ? 'border-slate-200' : 'border-white/10'}`} />
              </div>

              {/* Facebook-Style Green "Create new account" Button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSignUpError(null);
                    setIsSignUpModalOpen(true);
                  }}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create new account</span>
                </button>
              </div>
            </div>
          )}

          {/* Underneath Card */}
          <div className={`mt-5 text-center text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className={`font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Sign up or Log in</span> to create a Birthday tribute for a{' '}
            <button
              onClick={() => setIsSignUpModalOpen(true)}
              className="font-bold text-pink-500 hover:text-pink-600 underline cursor-pointer"
            >
              Father, Mother, Sister, Brother, or Friend
            </button>
            .
          </div>
        </div>
      </div>

      {/* ================= FULLY VISIBLE & RESPONSIVE SIGN UP MODAL (NEVER CUT OFF) ================= */}
      {isSignUpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className={`relative w-full max-w-lg my-auto border rounded-3xl p-5 sm:p-7 shadow-2xl max-h-[92vh] flex flex-col justify-between overflow-y-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300' : 'bg-[#0e1422] border-white/15 text-white shadow-black'
          }`}>
            
            {/* Close Button */}
            <button
              onClick={() => setIsSignUpModalOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer z-10 ${
                isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className={`border-b pb-3 mb-4 pr-8 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
              <h2 className={`font-haute text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Sign Up
              </h2>
              <p className={`font-editorial text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                It&apos;s quick and easy to start creating Birthwishes for your loved ones.
              </p>
            </div>

            {signUpError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{signUpError}</span>
              </div>
            )}

            {/* Sign Up Form */}
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              
              {/* First Name & Surname */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                    className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                        : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Surname"
                    className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                      isLight 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                        : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="Mobile number or email address"
                  className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                      : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Password */}
              <div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className={`w-full px-3 py-2 border rounded-xl text-xs sm:text-sm focus:outline-none focus:border-pink-500 transition-colors ${
                    isLight 
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400' 
                      : 'bg-white/5 border-white/10 text-white placeholder-slate-500'
                  }`}
                />
              </div>

              {/* Date of Birth Selectors */}
              <div>
                <label className={`block text-[11px] font-semibold mb-1 flex items-center gap-1.5 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <Calendar className="w-3 h-3 text-pink-500" />
                  <span>Date of birth</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    className={`px-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121826] border-white/10 text-white'
                    }`}
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthMonth}
                    onChange={(e) => setBirthMonth(e.target.value)}
                    className={`px-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121826] border-white/10 text-white'
                    }`}
                  >
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>

                  <select
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    className={`px-2 py-1.5 border rounded-xl text-xs focus:outline-none focus:border-pink-500 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-[#121826] border-white/10 text-white'
                    }`}
                  >
                    {Array.from({ length: 70 }, (_, i) => 2026 - i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className={`block text-[11px] font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'female', label: 'Female' },
                    { id: 'male', label: 'Male' },
                    { id: 'custom', label: 'Custom' },
                  ].map((g) => (
                    <label
                      key={g.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        gender === g.id
                          ? 'border-pink-500 bg-pink-500/15 text-pink-500 font-semibold'
                          : isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'
                      }`}
                    >
                      <span>{g.label}</span>
                      <input
                        type="radio"
                        name="gender"
                        value={g.id}
                        checked={gender === g.id}
                        onChange={() => setGender(g.id)}
                        className="text-pink-500 focus:ring-0 w-3 h-3"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <p className={`text-[10px] leading-tight pt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                By clicking Sign Up, you agree to our Terms and Data Policy to create birthday wishes and cash gifts via Kora.
              </p>

              {/* Green Sign Up Button */}
              <button
                type="submit"
                disabled={isSigningUp}
                className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
              >
                {isSigningUp ? (
                  <span>Creating Account...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sign Up</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Multilingual Facebook-Style Footer */}
      <footer className={`w-full border-t py-6 text-xs transition-colors duration-300 ${
        isLight ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-white/10 bg-[#060910] text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
          <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b pb-3 ${
            isLight ? 'border-slate-200 text-slate-600' : 'border-white/5 text-slate-400'
          }`}>
            <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>English (US)</span>
            <span className="hover:underline cursor-pointer">Français (France)</span>
            <span className="hover:underline cursor-pointer">Español</span>
            <span className="hover:underline cursor-pointer">Português (Brasil)</span>
            <span className="hover:underline cursor-pointer">Italiano</span>
            <span className="hover:underline cursor-pointer">Deutsch</span>
            <span className="hover:underline cursor-pointer">Igbo</span>
            <span className="hover:underline cursor-pointer">Yorùbá</span>
            <span className="hover:underline cursor-pointer">Hausa</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
            <div className="flex flex-wrap gap-4">
              <span>Sign Up</span>
              <span>Log In</span>
              <span>Kora Pay Holding</span>
              <span>Supabase Cloud</span>
              <a 
                href="#oauth/consent" 
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = 'oauth/consent';
                }}
                className="hover:underline cursor-pointer text-pink-600 dark:text-pink-400 font-semibold"
              >
                OAuth 2.1 Server
              </a>
              <span>GDG Owerri Hackathon 2026</span>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
            <div>
              Birthwish &copy; 2026. Made with love for birthdays worldwide.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
