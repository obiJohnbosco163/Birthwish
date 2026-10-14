import { UserProfile, Birthwish } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 🔐 FOUNDER & ADMIN IDENTIFIER
 * The premium restriction NEVER applies to the founder and creator: obijohnbosco163@gmail.com
 */
export const ADMIN_EMAIL = 'obijohnbosco163@gmail.com';

/**
 * 💳 KORA TEST MODE SUBSCRIPTION CHECKOUT LINK
 */
export const KORA_PREMIUM_CHECKOUT_URL = 'https://test-checkout.korapay.com/pay/birthwish_cash';

/**
 * 🎁 FREE QUOTA PER USER
 */
export const FREE_WISH_LIMIT = 3;

/**
 * Check if the given email corresponds to the Birthwish Admin and Founder
 */
export function isFounderAdmin(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

/**
 * Retrieve cached local premium subscription data for a user
 */
export function getLocalPremiumRecord(userId?: string, email?: string): { isPremium: boolean; expiresAt: string; subscribedAt: string } | null {
  try {
    const keysToCheck = [
      userId ? `birthwish_premium_${userId}` : null,
      email ? `birthwish_premium_${email.toLowerCase().trim()}` : null,
    ].filter(Boolean) as string[];

    for (const key of keysToCheck) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading local premium record:', e);
  }
  return null;
}

/**
 * Check if the user has an active premium subscription (or is Founder)
 */
export function isUserPremium(user: UserProfile | null): boolean {
  if (!user) return false;

  // 1. Founder & Admin has permanent lifetime unlimited access
  if (isFounderAdmin(user.email)) {
    return true;
  }

  // 2. Check UserProfile object
  if (user.isPremium && user.premiumExpiresAt) {
    if (new Date(user.premiumExpiresAt) > new Date()) {
      return true;
    }
  }

  // 3. Check persistent localStorage cache
  const localRecord = getLocalPremiumRecord(user.id, user.email);
  if (localRecord && new Date(localRecord.expiresAt) > new Date()) {
    return true;
  }

  return false;
}

/**
 * Filter wishes belonging to the current user
 */
export function getUserCreatedWishes(user: UserProfile | null, wishes: Birthwish[]): Birthwish[] {
  if (!user) return [];
  return wishes.filter(
    (w) => w.userId === user.id || (user.email && w.userId === user.email)
  );
}

export interface UserQuotaDetails {
  isUnlimited: boolean;
  isFounder: boolean;
  isPremium: boolean;
  usedCount: number;
  maxLimit: number;
  remainingCount: number;
  hasReachedLimit: boolean;
  expiresAt?: string;
  daysRemaining?: number;
  planName: 'Founder VIP' | 'Premium Unlimited' | 'Free Tier';
}

/**
 * Calculate user's current Birthwish quota status
 */
export function getUserQuota(user: UserProfile | null, wishes: Birthwish[]): UserQuotaDetails {
  // 1. Founder Admin Check
  if (isFounderAdmin(user?.email)) {
    return {
      isUnlimited: true,
      isFounder: true,
      isPremium: true,
      usedCount: getUserCreatedWishes(user, wishes).length,
      maxLimit: Infinity,
      remainingCount: Infinity,
      hasReachedLimit: false,
      planName: 'Founder VIP',
    };
  }

  // 2. Premium Subscriber Check
  const localRec = user ? getLocalPremiumRecord(user.id, user.email) : null;
  const rawExpiresAt = user?.premiumExpiresAt || localRec?.expiresAt;

  if (user && isUserPremium(user) && rawExpiresAt) {
    const diffMs = new Date(rawExpiresAt).getTime() - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      isUnlimited: true,
      isFounder: false,
      isPremium: true,
      usedCount: getUserCreatedWishes(user, wishes).length,
      maxLimit: Infinity,
      remainingCount: Infinity,
      hasReachedLimit: false,
      expiresAt: rawExpiresAt,
      daysRemaining,
      planName: 'Premium Unlimited',
    };
  }

  // 3. Free Tier User Check (3 Free Birthwishes)
  const userWishes = getUserCreatedWishes(user, wishes);
  const usedCount = userWishes.length;
  const remainingCount = Math.max(0, FREE_WISH_LIMIT - usedCount);
  const hasReachedLimit = usedCount >= FREE_WISH_LIMIT;

  return {
    isUnlimited: false,
    isFounder: false,
    isPremium: false,
    usedCount,
    maxLimit: FREE_WISH_LIMIT,
    remainingCount,
    hasReachedLimit,
    planName: 'Free Tier',
  };
}

/**
 * Activate or renew a 1-month Premium Subscription for the user
 */
export async function activateUserPremium(
  user: UserProfile, 
  durationDays: number = 30
): Promise<UserProfile> {
  const subscribedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  const updatedProfile: UserProfile = {
    ...user,
    isPremium: true,
    premiumExpiresAt: expiresAt,
    subscriptionPlan: isFounderAdmin(user.email) ? 'founder' : 'premium',
    premiumSubscribedAt: subscribedAt,
  };

  // 1. Save to local storage
  const record = {
    isPremium: true,
    expiresAt,
    subscribedAt,
    userEmail: user.email,
  };

  try {
    localStorage.setItem(`birthwish_premium_${user.id}`, JSON.stringify(record));
    if (user.email) {
      localStorage.setItem(`birthwish_premium_${user.email.toLowerCase().trim()}`, JSON.stringify(record));
    }
    localStorage.setItem('birthwish_active_user_v2', JSON.stringify(updatedProfile));
    localStorage.setItem('birthwish_user', JSON.stringify(updatedProfile));
  } catch (err) {
    console.warn('LocalStorage error saving premium record:', err);
  }

  // 2. Persist to Firestore
  try {
    await setDoc(
      doc(db, 'users', user.id),
      {
        isPremium: true,
        premiumExpiresAt: expiresAt,
        subscriptionPlan: isFounderAdmin(user.email) ? 'founder' : 'premium',
        premiumSubscribedAt: subscribedAt,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (firestoreErr) {
    console.warn('Firestore error persisting premium profile:', firestoreErr);
  }

  return updatedProfile;
}

/**
 * Detects if the user has returned from a Kora payment redirect via query params or hash
 */
export function detectSubscriptionReturnFromUrl(): { detected: boolean; reference?: string } {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    const hasParam = 
      urlParams.get('subscribed') === 'true' ||
      urlParams.get('status') === 'success' ||
      urlParams.get('payment') === 'success' ||
      urlParams.get('kora_paid') === 'true' ||
      hash.includes('subscription=success') ||
      hash.includes('payment=success');

    const reference = 
      urlParams.get('reference') || 
      urlParams.get('trxref') || 
      `KORA-SUB-${Date.now()}`;

    if (hasParam) {
      // Clean up URL parameters to keep address bar clean
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return { detected: true, reference };
    }
  } catch (e) {
    console.warn('URL check error:', e);
  }

  return { detected: false };
}
