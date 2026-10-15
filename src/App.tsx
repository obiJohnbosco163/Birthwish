import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { CreateWishWizard } from './components/CreateWishWizard';
import { CelebrantView } from './components/CelebrantView';
import { UserOnboardingModal } from './components/UserOnboardingModal';
import { OAuthConsent } from './components/OAuthConsent';
import { Birthwish, UserProfile } from './types';
import { getStoredWishes, getStoredUser, setStoredUser, signOutUser, supabase, saveWish, deleteStoredWish } from './lib/supabase';
import { onFirebaseAuthStateChanged, signOutFirebase, fetchWishesFromFirestore, deleteWishFromFirestore } from './lib/firebase';
import { decodeShareableWish } from './lib/wishEncoder';
import { checkAndNotifyBirthdays } from './lib/notificationService';
import { PremiumSubscriptionModal } from './components/PremiumSubscriptionModal';
import { 
  getUserQuota, 
  detectSubscriptionReturnFromUrl, 
  activateUserPremium 
} from './lib/subscription';
import confetti from 'canvas-confetti';

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

  // Kora Premium Plan Subscription Modal states
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const [premiumModalReason, setPremiumModalReason] = useState<'limit_reached' | 'manual_upgrade'>('limit_reached');
  const [reminderToast, setReminderToast] = useState<{ message: string; recipient: string } | null>(null);

  // Detect return from Kora payment checkout
  useEffect(() => {
    const returnCheck = detectSubscriptionReturnFromUrl();
    if (returnCheck.detected && user) {
      activateUserPremium(user, 30).then((updated) => {
        setUser(updated);
        setStoredUser(updated);
        confetti({
          particleCount: 220,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#ec4899', '#fbbf24', '#f43f5e', '#10b981', '#ffffff'],
        });
      });
    }
  }, [user]);

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

    // Listen to Firebase Auth state
    const unsubscribeFirebase = onFirebaseAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setCurrentView('dashboard');
        // Fetch wishes from Firestore
        const firestoreWishes = await fetchWishesFromFirestore(fbUser.id);
        if (firestoreWishes.length > 0) {
          setWishes(prev => {
            const merged = [...firestoreWishes];
            prev.forEach(p => {
              if (!merged.some(m => m.id === p.id)) {
                merged.push(p);
              }
            });
            return merged;
          });
        }
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
      unsubscribeFirebase();
    };
  }, []);

  // Strict pattern: If logged out, only landing, oauth_consent, or direct celebrant view can render
  useEffect(() => {
    if (!user && currentView !== 'landing' && currentView !== 'view' && currentView !== 'oauth_consent') {
      setCurrentView('landing');
    }
  }, [user, currentView]);

  // Periodic notification checker for any birthday celebrating today
  useEffect(() => {
    if (wishes.length === 0) return;
    
    // Check on startup
    checkAndNotifyBirthdays(wishes, (wish) => {
      setActiveWish(wish);
      setCurrentView('view');
      window.location.hash = `wish-${wish.id}`;
    });

    // Check once every hour in background
    const interval = setInterval(() => {
      checkAndNotifyBirthdays(wishes, (wish) => {
        setActiveWish(wish);
        setCurrentView('view');
        window.location.hash = `wish-${wish.id}`;
      });
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [wishes]);

  // Listen for background automated reminder email dispatches
  useEffect(() => {
    const handleEmailSent = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setReminderToast({
          message: detail.type === '24h' 
            ? `⏰ 24h Birthday Reminder alert dispatched for ${detail.celebrantName}!`
            : `🎂 Birthday Morning Reminder alert dispatched for ${detail.celebrantName}!`,
          recipient: detail.recipientEmail,
        });
        setTimeout(() => setReminderToast(null), 5000);
      }
    };
    window.addEventListener('birthwish-email-reminder-sent', handleEmailSent);
    return () => window.removeEventListener('birthwish-email-reminder-sent', handleEmailSent);
  }, []);

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
    try {
      await signOutFirebase();
    } catch {}
    await signOutUser();
    setUser(null);
    setStoredUser(null);
    setCurrentView('landing');
    window.history.pushState('', document.title, window.location.pathname + window.location.search);
  };

  const handleOpenUpgrade = () => {
    setPremiumModalReason('manual_upgrade');
    setIsPremiumModalOpen(true);
  };

  const handleCreateClick = () => {
    if (!user) {
      setCurrentView('landing');
      return;
    }

    // Check user's 3-wish quota (Founder obijohnbosco163@gmail.com is permanently excluded)
    const quota = getUserQuota(user, wishes);
    if (quota.hasReachedLimit) {
      setPremiumModalReason('limit_reached');
      setIsPremiumModalOpen(true);
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

  const handleDeleteWish = async (wishId: string) => {
    try {
      await deleteWishFromFirestore(wishId);
    } catch {}
    await deleteStoredWish(wishId);
    setWishes((prev) => prev.filter((w) => w.id !== wishId));
    if (activeWish?.id === wishId) {
      setActiveWish(null);
    }
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
        Navbar renders when user is logged in (featuring Dashboard, Create Birthwish, Theme toggle, and Profile/Sign Out).
        When user logs in, they are immediately in their private dashboard (Dashboard/Create/View).
        There is NO "Home" tab or button for logged-in users.
      */}
      {user && currentView !== 'oauth_consent' && (
        <Navbar
          user={user}
          wishes={wishes}
          onOpenAuth={() => {}}
          onSignOut={handleSignOut}
          onCreateClick={handleCreateClick}
          onDashboardClick={handleDashboardClick}
          onUpgradeClick={handleOpenUpgrade}
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
            onUpgradeClick={handleOpenUpgrade}
            onViewWish={handlePreviewWish}
            onDeleteWish={handleDeleteWish}
            theme={theme}
            onOpenTutorial={() => setIsOnboardingOpen(true)}
            onWishUpdated={handleUpdateWish}
          />
        )}

        {currentView !== 'oauth_consent' && user && currentView === 'create' && (
          <CreateWishWizard
            user={user}
            wishes={wishes}
            onWishCreated={handleWishCreated}
            onCancel={handleDashboardClick}
            onPreviewWish={handlePreviewWish}
            onUpgradeClick={handleOpenUpgrade}
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

      {/* Kora Payment Engine Powered Premium Plan Modal */}
      <PremiumSubscriptionModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        user={user}
        wishes={wishes}
        onSubscriptionSuccess={(updatedUser) => {
          setUser(updatedUser);
          setStoredUser(updatedUser);
        }}
        theme={theme}
        reason={premiumModalReason}
      />

      {/* Real-time Email & Browser Reminder Alert Toast */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-[#0b1329]/95 text-white text-xs font-bold shadow-2xl backdrop-blur-md flex items-start gap-3 border border-amber-400/40 animate-bounce-subtle max-w-sm">
          <span className="text-amber-400 text-base">⏰</span>
          <div className="space-y-0.5">
            <p className="font-bold text-white text-xs">{reminderToast.message}</p>
            <p className="text-[11px] text-amber-300 font-mono">Delivered to: {reminderToast.recipient}</p>
          </div>
        </div>
      )}
    </div>
  );
}
