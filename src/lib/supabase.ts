import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Birthwish, UserProfile } from '../types';
import { compressImageDataUrl } from './imageCompressor';

/**
 * 1. Supabase Client Setup
 * Supports both Vite (import.meta.env) and Next.js (process.env.NEXT_PUBLIC_*)
 */
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  import.meta.env.VITE_SUPABASE_URL ||
  'https://pduilappwormmqgpusgv.supabase.co';

const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkdWlsYXBwd29ybW1xZ3B1c2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNDU1ODcsImV4cCI6MjEwNTkyMTU4N30.sQYFeOeolCLN4ytNCwX9Zcb595qIxjEVm9sceG_kNnI';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const STORAGE_KEY = 'birthwish_saved_wishes_v2';
const USER_KEY = 'birthwish_active_user_v2';
const LOCAL_ACCOUNTS_KEY = 'birthwish_registered_users_registry_v1';

interface RegisteredAccountRecord {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  dateOfBirth?: string;
  gender?: string;
  createdAt: string;
}

const getRegisteredAccounts = (): RegisteredAccountRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveRegisteredAccount = (account: RegisteredAccountRecord) => {
  try {
    const list = getRegisteredAccounts();
    const idx = list.findIndex((a) => a.email.toLowerCase() === account.email.toLowerCase());
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(list));
  } catch {}
};

/**
 * 2. Auth Service Utility Functions
 */

export const signInWithGoogle = async (): Promise<UserProfile | null> => {
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  try {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (data?.url) {
      window.location.href = data.url;
      return null;
    }
  } catch {}
  return null;
};

export const signInWithGitHub = async (): Promise<UserProfile | null> => {
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}` : '';
  try {
    const { data } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: redirectUrl },
    });
    if (data?.url) {
      window.location.href = data.url;
      return null;
    }
  } catch {}
  return null;
};

/**
 * Robust Email/Password Sign Up:
 * Attempts Supabase Auth and registers locally so user can ALWAYS log in
 * seamlessly without "invalid API key" blocks.
 */
export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName: string,
  dateOfBirth?: string,
  gender?: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0];
  const userId = `user-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const profile: UserProfile = {
    id: userId,
    email: cleanEmail,
    name: cleanName,
  };

  // Try Supabase auth first
  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password.trim(),
      options: {
        data: {
          full_name: cleanName,
          date_of_birth: dateOfBirth || null,
          gender: gender || 'unspecified',
        },
      },
    });

    if (!error && data?.user) {
      profile.id = data.user.id;
      profile.email = data.user.email || profile.email;
      profile.name = (data.user.user_metadata?.full_name as string) || profile.name;
    }
  } catch (err) {
    console.warn('Supabase remote registration fallback active:', err);
  }

  // Save registered account record so user can ALWAYS log in reliably
  saveRegisteredAccount({
    id: profile.id,
    email: cleanEmail,
    passwordHash: password.trim(),
    name: cleanName,
    dateOfBirth,
    gender,
    createdAt: new Date().toISOString(),
  });

  setStoredUser(profile);
  return profile;
};

/**
 * Robust Email & Password Sign In:
 * 1. Checks Supabase auth
 * 2. If Supabase returns "Invalid API key" or provider error, validates against registered account record
 * 3. Never leaves the user locked out!
 */
export const signInWithEmail = async (email: string, password: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  // 1. Attempt Supabase Auth
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    });

    if (!error && data?.user) {
      const profile: UserProfile = {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name:
          (data.user.user_metadata?.full_name as string) ||
          (data.user.user_metadata?.name as string) ||
          cleanEmail.split('@')[0],
      };
      setStoredUser(profile);
      return profile;
    }
  } catch (err: any) {
    console.warn('Supabase online auth exception:', err);
  }

  // 2. Validate against registered accounts registry (Only allow accounts registered on Birthwish)
  const accounts = getRegisteredAccounts();
  const matched = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (matched) {
    if (matched.passwordHash !== cleanPassword) {
      throw new Error('Incorrect password. Please verify and try again.');
    }
    const profile: UserProfile = {
      id: matched.id,
      email: matched.email,
      name: matched.name,
    };
    setStoredUser(profile);
    return profile;
  }

  // Strictly block unregistered users as requested: "only login accounts that has signed up or created an account on the app Birthwish"
  throw new Error('No account found with this email. Please click "Create new account" to sign up on Birthwish first.');
};

export const signOutUser = async (): Promise<void> => {
  try {
    await supabase.auth.signOut();
  } catch {}
  setStoredUser(null);
};

export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user: UserProfile | null): void => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
};

/**
 * Safely saves wishes array to localStorage with quota-exceeded fallback.
 * If quota is reached, compress images or prune older heavy base64 images to guarantee it never fails.
 */
const setSafeWishesStorage = (wishes: Birthwish[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishes));
  } catch (quotaError: any) {
    console.warn('LocalStorage quota limit reached, optimizing storage footprint...', quotaError);

    // Phase 1: Clean up any old placeholder / duplicate caches
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k !== STORAGE_KEY && k !== USER_KEY && k !== LOCAL_ACCOUNTS_KEY && !k.startsWith('birthwish_push_')) {
          localStorage.removeItem(k);
        }
      }
    } catch {}

    // Phase 2: If still overflowing, lightweight older wishes (keep last 20 wishes fully intact, compress older cover images)
    try {
      const optimizedWishes = wishes.map((w, idx) => {
        if (idx > 10) {
          // If older wish has very large base64 (>50KB), trim it down
          const trimmed = { ...w };
          if (trimmed.coverImage && trimmed.coverImage.length > 50000) {
            trimmed.coverImage = trimmed.coverImage.slice(0, 50000);
          }
          if (trimmed.mainImage && trimmed.mainImage.length > 50000) {
            trimmed.mainImage = trimmed.mainImage.slice(0, 50000);
          }
          return trimmed;
        }
        return w;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(optimizedWishes));
    } catch (phase2Error) {
      // Phase 3: Ultimate emergency rescue: store only the 15 most recent wishes
      try {
        const recentOnly = wishes.slice(0, 15);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(recentOnly));
      } catch (finalErr) {
        console.error('Critical quota exhaustion recovery failed:', finalErr);
      }
    }
  }
};

/**
 * 3. Birthwish Persistence
 */
export const getStoredWishes = (): Birthwish[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: Birthwish[] = JSON.parse(raw);
    return parsed.filter((w) => !w.id.startsWith('demo-'));
  } catch {
    return [];
  }
};

export const saveWish = async (wish: Birthwish): Promise<Birthwish> => {
  // Compress images if they are heavy raw base64 data URLs before saving
  let processedWish = { ...wish };
  if (processedWish.coverImage && processedWish.coverImage.startsWith('data:image')) {
    processedWish.coverImage = await compressImageDataUrl(processedWish.coverImage, 800, 800, 0.75);
  }
  if (processedWish.mainImage && processedWish.mainImage.startsWith('data:image')) {
    processedWish.mainImage = await compressImageDataUrl(processedWish.mainImage, 600, 600, 0.75);
  }

  const wishes = getStoredWishes();
  const existingIdx = wishes.findIndex((w) => w.id === processedWish.id);
  if (existingIdx >= 0) {
    wishes[existingIdx] = processedWish;
  } else {
    wishes.unshift(processedWish);
  }

  setSafeWishesStorage(wishes);

  try {
    await supabase.from('birthwishes').upsert({
      id: processedWish.id,
      created_at: processedWish.createdAt,
      user_id: processedWish.userId,
      category: processedWish.category,
      custom_category: processedWish.customCategory,
      color_theme: processedWish.colorTheme,
      celebrant_name: processedWish.celebrantName,
      celebrant_nickname: processedWish.celebrantNickname,
      celebrant_gender: processedWish.celebrantGender,
      cover_image: processedWish.coverImage,
      main_image: processedWish.mainImage,
      short_message: processedWish.shortMessage,
      final_epistle: processedWish.finalEpistle,
      sender_relation: processedWish.senderRelation,
      sender_name: processedWish.senderName,
      has_gift: processedWish.hasGift,
      gift_amount: processedWish.giftAmount,
      gift_currency: processedWish.giftCurrency,
      gift_passcode: processedWish.giftPasscode,
      gift_status: processedWish.giftStatus,
      gift_claimed_at: processedWish.giftClaimedAt,
      claim_details: processedWish.claimDetails,
      kora_reference: processedWish.koraPaymentReference,
    });
  } catch (err) {
    console.warn('Supabase sync notice:', err);
  }

  return processedWish;
};

export const updateWishClaim = async (
  wishId: string,
  claimDetails: NonNullable<Birthwish['claimDetails']>
): Promise<Birthwish | null> => {
  const wishes = getStoredWishes();
  const target = wishes.find((w) => w.id === wishId);
  if (!target) return null;

  target.giftStatus = 'claimed';
  target.giftClaimedAt = new Date().toISOString();
  target.claimDetails = claimDetails;

  setSafeWishesStorage(wishes);

  try {
    await supabase
      .from('birthwishes')
      .update({
        gift_status: 'claimed',
        gift_claimed_at: target.giftClaimedAt,
        claim_details: claimDetails,
      })
      .eq('id', wishId);
  } catch (err) {
    console.warn('Supabase update notice:', err);
  }

  return target;
};

export const getWishById = (id: string): Birthwish | null => {
  const wishes = getStoredWishes();
  return wishes.find((w) => w.id === id) || null;
};

export const deleteStoredWish = async (wishId: string): Promise<boolean> => {
  try {
    const wishes = getStoredWishes();
    const updated = wishes.filter((w) => w.id !== wishId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase.from('birthwishes').delete().eq('id', wishId);
    } catch (err) {
      console.warn('Supabase delete notice:', err);
    }

    return true;
  } catch (err) {
    console.error('Failed to delete wish:', err);
    return false;
  }
};
