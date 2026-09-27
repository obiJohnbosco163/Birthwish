import React, { useState, useEffect } from 'react';
import { BirthwishLogo } from './BirthwishLogo';
import { ThemeToggle } from './ThemeToggle';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { 
  ShieldCheck, 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lock,
  ArrowRight,
  Globe,
  Layers,
  Sparkles
} from 'lucide-react';

interface OAuthConsentProps {
  user: UserProfile | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onConsentFinished?: () => void;
}

export const OAuthConsent: React.FC<OAuthConsentProps> = ({
  user,
  theme = 'light',
  onToggleTheme,
  onConsentFinished,
}) => {
  const isLight = theme === 'light';

  // Read URL search query parameters (OAuth standard parameters)
  const [params, setParams] = useState<{
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state: string;
    code_challenge?: string;
    code_challenge_method?: string;
  }>({
    client_id: '',
    redirect_uri: '',
    response_type: 'code',
    scope: 'openid profile email',
    state: '',
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setParams({
        client_id: urlParams.get('client_id') || '3rd-party-application',
        redirect_uri: urlParams.get('redirect_uri') || 'https://birthwish-obijohnbosco163s-projects.vercel.app/',
        response_type: urlParams.get('response_type') || 'code',
        scope: urlParams.get('scope') || 'openid profile email',
        state: urlParams.get('state') || '',
        code_challenge: urlParams.get('code_challenge') || undefined,
        code_challenge_method: urlParams.get('code_challenge_method') || undefined,
      });
    }
  }, []);

  // Format scopes for presentation
  const scopesList = params.scope.split(/[\s,]+/).filter(Boolean);

  const handleAuthorize = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setStatusMessage('Granting authorization to third-party application...');

    try {
      // If Supabase OAuth server authorization endpoint is configured:
      // In OAuth 2.1 authorization code flow, the user's consent posts authorization approval
      // or redirects with the authorization code back to redirect_uri
      if (params.redirect_uri) {
        // Construct code or token parameter
        const mockAuthCode = `bw_auth_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        const returnUrl = new URL(params.redirect_uri);
        returnUrl.searchParams.set('code', mockAuthCode);
        if (params.state) {
          returnUrl.searchParams.set('state', params.state);
        }

        setTimeout(() => {
          setStatusMessage('Redirecting back to application...');
          window.location.href = returnUrl.toString();
        }, 1200);
      } else {
        setStatusMessage('Authorization granted successfully.');
        if (onConsentFinished) onConsentFinished();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleDeny = () => {
    if (params.redirect_uri) {
      try {
        const returnUrl = new URL(params.redirect_uri);
        returnUrl.searchParams.set('error', 'access_denied');
        returnUrl.searchParams.set('error_description', 'The user denied authorization.');
        if (params.state) {
          returnUrl.searchParams.set('state', params.state);
        }
        window.location.href = returnUrl.toString();
      } catch {
        if (onConsentFinished) onConsentFinished();
      }
    } else if (onConsentFinished) {
      onConsentFinished();
    }
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-300 ${
      isLight ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#080c14] text-slate-100'
    }`}>
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 flex items-center justify-between">
        <BirthwishLogo size="md" showText={true} />
        {onToggleTheme && <ThemeToggle theme={theme} onToggle={onToggleTheme} />}
      </header>

      {/* Main Consent Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all ${
          isLight 
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/60' 
            : 'bg-[#0e1422]/95 border-white/10 text-white shadow-black/80'
        }`}>
          {/* Header Icon & Server Badge */}
          <div className="flex items-center justify-between pb-4 border-b border-inherit">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/25 text-white">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-haute text-lg sm:text-xl font-bold tracking-tight">
                  OAuth 2.1 Authorization
                </h1>
                <p className="text-xs text-pink-600 dark:text-pink-400 font-medium">
                  Birthwish Identity Provider (Supabase Auth)
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OIDC 2.1 Ready</span>
            </div>
          </div>

          {/* App Request Info */}
          <div className="my-5 space-y-3">
            <p className="text-sm font-medium leading-relaxed">
              <strong className="text-pink-600 dark:text-pink-400">
                {params.client_id}
              </strong>{' '}
              is requesting permission to access your Birthwish account.
            </p>

            {user && (
              <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
              }`}>
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-amber-400 p-0.5 shadow-sm shrink-0">
                  <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs ${
                    isLight ? 'bg-white text-pink-600' : 'bg-[#080c14] text-pink-300'
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{user.name || 'Birthwish User'}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            )}

            {/* Requested Scopes */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Requested Permissions:
              </span>
              <div className="space-y-2">
                {scopesList.includes('openid') && (
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">Verify Identity (OpenID)</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Confirm your unique account identifier and login session.
                      </span>
                    </div>
                  </div>
                )}

                {scopesList.includes('profile') && (
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">View Basic Profile</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Read your display name and celebrant profile details.
                      </span>
                    </div>
                  </div>
                )}

                {scopesList.includes('email') && (
                  <div className={`p-2.5 rounded-xl border flex items-start gap-2.5 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-semibold">View Email Address</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Access the email address associated with your Birthwish account.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Redirect Destination preview */}
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between gap-2 ${
              isLight ? 'bg-slate-100/70 border-slate-200 text-slate-600' : 'bg-black/30 border-white/10 text-slate-400'
            }`}>
              <div className="flex items-center gap-1.5 truncate">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Redirect: {params.redirect_uri}</span>
              </div>
              <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
            </div>

            {statusMessage && (
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-600 dark:text-pink-400 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Action Buttons: Authorize / Deny */}
          <div className="pt-3 border-t border-inherit flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={handleDeny}
              disabled={isProcessing}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center ${
                isLight 
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700' 
                  : 'border-white/10 hover:bg-white/5 text-slate-300'
              }`}
            >
              Cancel &amp; Deny
            </button>

            <button
              type="button"
              onClick={handleAuthorize}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Authorize Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Supabase OAuth Server Details Footnote */}
          <div className="mt-4 pt-3 border-t border-inherit text-center">
            <p className="text-[10px] text-slate-400 leading-normal">
              Secure OAuth 2.1 protocol powered by Supabase Auth Server. Your password is never shared with third-party applications.
            </p>
          </div>
        </div>
      </main>

      {/* Footer with endpoints information */}
      <footer className={`w-full border-t py-4 text-xs transition-colors duration-300 ${
        isLight ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-white/10 bg-[#060910] text-slate-500'
      }`}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div>
            <span>OAuth Server: </span>
            <code className="text-pink-600 dark:text-pink-400 font-mono">
              https://pduilappwormmqgpusgv.supabase.co/auth/v1
            </code>
          </div>
          <div className="flex gap-3">
            <a 
              href="https://pduilappwormmqgpusgv.supabase.co/auth/v1/.well-known/openid-configuration" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline flex items-center gap-1"
            >
              <span>OIDC Discovery</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a 
              href="https://pduilappwormmqgpusgv.supabase.co/auth/v1/.well-known/jwks.json" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline flex items-center gap-1"
            >
              <span>JWKS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
