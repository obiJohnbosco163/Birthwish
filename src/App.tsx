import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CreateWishWizard } from './components/CreateWishWizard';
import { CelebrantView } from './components/CelebrantView';
import { UserOnboardingModal } from './components/UserOnboardingModal';
import { OAuthConsent } from './components/OAuthConsent';
import { Birthwish, UserProfile } from './types';
import { getStoredWishes, getStoredUser, setStoredUser, signOutUser, supabase, saveWish } from './lib/supabase';
import { decodeShareableWish } from './lib/wishEncoder';

export default function App() {
  // White mode is now the DEFAULT toggle mode
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem('birthwish_theme');
      return savedTheme === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser());
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'create' | 'view' | 'oauth_consent'>('landing');
  const [wishes, setWishes] = useState<Birthwish[]>([]);
  const [activeWish, setActiveWish] = useState<Birthwish | null>(null);

  // User Tutorial / Demo Onboarding Modal state
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Sync theme with body and root classes
  useEffect(() => {
    try {
      localStorage.setItem('birthwish_theme', theme);
    } catch {}

    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.remove('bg-[#0b0f17]');
      document.body.classList.add('bg-[#f8fafc]');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('bg-[#f8fafc]');
      document.body.classList.add('bg-[#0b0f17]');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load initial wishes (strictly real user wishes, no mock data)
  useEffect(() => {
    const loaded = getStoredWishes();
    setWishes(loaded);

    // Initial check from localStorage
    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
      setCurrentView('dashboard');
    } else {
      setUser(null);
      setCurrentView('landing');
    }

    // Check Supabase session (only if active)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const supUser: UserProfile = {
          id: data.session.user.id,
          email: data.session.user.email || 'user@birthwish.app',
          name: data.session.user.user_metadata?.full_name || data.session.user.email?.split('@')[0],
        };
        setUser(supUser);
        setStoredUser(supUser);
        setCurrentView('dashboard');
      }
    });

    // Check pathname or hash for OAuth Consent or direct wish view
    const handleLocationChange = () => {
      const pathname = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Detect /oauth/consent (Supabase OAuth Server Authorization Path)
      if (pathname.includes('/oauth/consent') || hash.includes('/oauth/consent') || hash.startsWith('#oauth/consent')) {
        setCurrentView('oauth_consent');
        return;
      }

      // Check hash for shareable viewing link (e.g. #view=... or #wish-...)
      if (hash.startsWith('#view=') || hash.startsWith('#wish-')) {
        const { wishId, encodedWish } = decodeShareableWish(window.location.hash);
        
        if (encodedWish) {
          // Immediately display the birthwish created for that particular link from beginning to end
          saveWish(encodedWish);
          setWishes(prev => {
            if (!prev.some(w => w.id === encodedWish.id)) {
              return [encodedWish, ...prev];
            }
            return prev;
          });
          setActiveWish(encodedWish);
          setCurrentView('view');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        if (wishId) {
          const allWishes = getStoredWishes();
          const found = allWishes.find((w) => w.id === wishId);
          if (found) {
            setActiveWish(found);
            setCurrentView('view');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }
    };

    handleLocationChange();
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Strict pattern: If logged out, only landing, oauth_consent, or direct celebrant view can render
  useEffect(() => {
    if (!user && currentView !== 'landing' && currentView !== 'view' && currentView !== 'oauth_consent') {
      setCurrentView('landing');
    }
  }, [user, currentView]);

  const handleLoginSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setStoredUser(authenticatedUser);
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Check if user has seen onboarding tutorial
    const tutorialKey = `birthwish_tutorial_seen_${authenticatedUser.id}`;
    const hasSeen = localStorage.getItem(tutorialKey);
    if (!hasSeen) {
      setIsOnboardingOpen(true);
      localStorage.setItem(tutorialKey, 'true');
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setStoredUser(null);
    setCurrentView('landing');
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  };

  const handleCreateClick = () => {
    if (!user) {
      setCurrentView('landing');
      return;
    }
    setCurrentView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDashboardClick = () => {
    if (!user) {
      setCurrentView('landing');
      return;
    }
    setCurrentView('dashboard');
    setActiveWish(null);
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  };

  const handleLandingClick = () => {
    if (user) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('landing');
    }
    setActiveWish(null);
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  };

  const handleWishCreated = (newWish: Birthwish) => {
    setWishes((prev) => {
      const existing = prev.findIndex((w) => w.id === newWish.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = newWish;
        return copy;
      }
      return [newWish, ...prev];
    });
  };

  const handleUpdateWish = (updatedWish: Birthwish) => {
    setActiveWish(updatedWish);
    setWishes((prev) => prev.map((w) => (w.id === updatedWish.id ? updatedWish : w)));
  };

  const handlePreviewWish = (wish: Birthwish) => {
    setActiveWish(wish);
    setCurrentView('view');
    window.location.hash = `wish-${wish.id}`;
  };

  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isLight 
        ? 'bg-[#f8fafc] text-slate-800 selection:bg-pink-500 selection:text-white' 
        : 'bg-[#080c14] text-slate-100 selection:bg-pink-500 selection:text-white'
    }`}>
      {/* 
        AUTHENTICATED APPLICATION ARCHITECTURE:
        Navbar renders when user is logged in (featuring Dashboard, Create Birthwish, New Tribute, Theme toggle, and Profile/Sign Out).
        When user logs in, they are immediately in their private atelier (Dashboard/Create/View).
        There is NO "Home" tab or button for logged-in users.
      */}
      {user && currentView !== 'oauth_consent' && (
        <Navbar
          user={user}
          onOpenAuth={() => {}}
          onSignOut={handleSignOut}
          onCreateClick={handleCreateClick}
          onDashboardClick={handleDashboardClick}
          currentView={currentView}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'oauth_consent' && (
          <OAuthConsent
            user={user}
            theme={theme}
            onToggleTheme={toggleTheme}
            onConsentFinished={() => {
              if (user) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('landing');
              }
            }}
          />
        )}

        {currentView !== 'oauth_consent' && !user && (
          <LandingPage
            user={user}
            onLoginSuccess={handleLoginSuccess}
            onOpenDashboard={handleDashboardClick}
            onSignOut={handleSignOut}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}

        {currentView !== 'oauth_consent' && user && currentView === 'dashboard' && (
          <Dashboard
            user={user}
            wishes={wishes}
            onCreateClick={handleCreateClick}
            onViewWish={handlePreviewWish}
            theme={theme}
            onOpenTutorial={() => setIsOnboardingOpen(true)}
          />
        )}

        {currentView !== 'oauth_consent' && user && currentView === 'create' && (
          <CreateWishWizard
            user={user}
            onWishCreated={handleWishCreated}
            onCancel={handleDashboardClick}
            onPreviewWish={handlePreviewWish}
          />
        )}

        {currentView !== 'oauth_consent' && currentView === 'view' && activeWish && (
          <CelebrantView
            wish={activeWish}
            onBackToDashboard={user ? handleDashboardClick : handleLandingClick}
            onUpdateWish={handleUpdateWish}
            isLoggedIn={Boolean(user)}
          />
        )}
      </main>

      {/* Step-by-Step Onboarding Demo/Tutorial for New Users */}
      <UserOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onStartCreate={handleCreateClick}
        theme={theme}
        userName={user?.name}
      />
    </div>
  );
}
