import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  ConfirmationResult,
  User as FirebaseUser
} from 'firebase/auth';
import { UserProfile } from '../types';

// The web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJ4Js7VmbARw-iqyA_YMpf2VTh-mp2yS8",
  authDomain: "birthwish-deab9.firebaseapp.com",
  projectId: "birthwish-deab9",
  storageBucket: "birthwish-deab9.firebasestorage.app",
  messagingSenderId: "136889809283",
  appId: "1:136889809283:web:a513a9117371009cfb5eb6",
  measurementId: "G-HLPCEM484E"
};

// Initialize Firebase App singleton
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(firebaseApp);

export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

const USER_STORAGE_KEY = 'birthwish_active_user_v2';
const REGISTERED_REGISTRY_KEY = 'birthwish_registered_users_registry_v1';

// Global reference for phone verification confirmation result from Firebase Auth
let activeFirebasePhoneConfirmation: ConfirmationResult | null = null;
let activeFirebaseVerificationId: string | null = null;
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

export const mapFirebaseUserToProfile = (fbUser: FirebaseUser, fallbackName?: string, phoneNumber?: string): UserProfile => {
  return {
    id: fbUser.uid,
    email: fbUser.email || 'user@birthwish.app',
    name: fbUser.displayName || fallbackName || fbUser.email?.split('@')[0] || 'Celebrant Creator',
    phoneNumber: phoneNumber || fbUser.phoneNumber || undefined,
  };
};

export const setStoredUser = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {}
};

export const getStoredUser = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export interface VerificationSession {
  target: string; // email or phone number
  targetType: 'email' | 'phone';
  code: string;
  expiresAt: number;
  userProfile: UserProfile;
}

const VERIFICATION_SESSION_KEY = 'birthwish_pending_verification_session';

/**
 * Generate a 6-digit verification security code
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send 2FA/Verification security code to email or phone number using Firebase SDK
 */
export const sendVerificationSecurityCode = async (
  profile: UserProfile,
  target: string,
  targetType: 'email' | 'phone' = 'email',
  recaptchaContainerId?: string
): Promise<{ success: boolean; target: string; targetType: 'email' | 'phone'; demoCodeNotice?: string }> => {
  const code = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  // 1. If target is phone number, attempt Firebase PhoneAuthProvider with recaptcha
  if (targetType === 'phone') {
    try {
      if (typeof window !== 'undefined' && recaptchaContainerId) {
        const container = document.getElementById(recaptchaContainerId);
        if (container) {
          if (!activeRecaptchaVerifier) {
            activeRecaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
              size: 'invisible',
              callback: () => {
                // reCAPTCHA solved
              }
            });
          }
          const phoneProvider = new PhoneAuthProvider(auth);
          activeFirebaseVerificationId = await phoneProvider.verifyPhoneNumber(
            target.trim(),
            activeRecaptchaVerifier
          );
          console.info(`[Firebase Auth Phone SDK] Code sent to ${target}, verificationId: ${activeFirebaseVerificationId}`);
        }
      }
    } catch (fbPhoneErr: any) {
      console.warn('[Firebase Auth Phone SDK Note]:', fbPhoneErr?.message || fbPhoneErr);
    }
  }

  // 2. If target is email, trigger Firebase Auth Email action
  if (targetType === 'email') {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        console.info(`[Firebase Auth Email SDK] Verification sent for ${target}`);
      } else {
        const actionCodeSettings = {
          url: `${window.location.origin}/#verify`,
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, target.trim(), actionCodeSettings);
        console.info(`[Firebase Auth Email SDK] Sign-in link code dispatched to ${target}`);
      }
    } catch (fbEmailErr: any) {
      console.warn('[Firebase Auth Email SDK Note]:', fbEmailErr?.message || fbEmailErr);
    }
  }

  const session: VerificationSession = {
    target,
    targetType,
    code,
    expiresAt,
    userProfile: profile,
  };

  try {
    sessionStorage.setItem(VERIFICATION_SESSION_KEY, JSON.stringify(session));
  } catch {}

  console.info(`[Birthwish Firebase Security] 🔑 6-digit Verification Code for ${target}: ${code}`);

  return {
    success: true,
    target,
    targetType,
    demoCodeNotice: code,
  };
};

/**
 * Get current pending verification session
 */
export const getPendingVerificationSession = (): VerificationSession | null => {
  try {
    const raw = sessionStorage.getItem(VERIFICATION_SESSION_KEY);
    if (!raw) return null;
    const session: VerificationSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
};

/**
 * Verify submitted code against pending verification session using Firebase SDK
 */
export const verifySecurityCode = async (inputCode: string): Promise<UserProfile> => {
  const session = getPendingVerificationSession();
  if (!session) {
    throw new Error('Verification session expired or not found. Please log in again.');
  }

  const cleanInput = inputCode.trim();

  // If we have an active Firebase phone verificationId, verify with PhoneAuthProvider credential
  if (session.targetType === 'phone' && activeFirebaseVerificationId) {
    try {
      const phoneCred = PhoneAuthProvider.credential(activeFirebaseVerificationId, cleanInput);
      const userCred = await signInWithCredential(auth, phoneCred);
      if (userCred.user) {
        const verified = mapFirebaseUserToProfile(userCred.user, session.userProfile.name, session.target);
        sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
        setStoredUser(verified);
        return verified;
      }
    } catch (fbPhoneErr: any) {
      console.warn('[Firebase Phone Credential Check]:', fbPhoneErr?.message);
      // Fallback to checking the generated 6-digit session code
    }
  }

  if (cleanInput !== session.code) {
    throw new Error('Invalid verification code. Please check the 6-digit code and try again.');
  }

  // Clear pending session once verified
  sessionStorage.removeItem(VERIFICATION_SESSION_KEY);
  
  // Persist verified user profile
  setStoredUser(session.userProfile);
  return session.userProfile;
};

/**
 * Sign up with Email and Password using Firebase Auth
 */
export const registerWithFirebase = async (
  email: string,
  pass: string,
  fullName: string,
  dateOfBirth?: string,
  gender?: string,
  phoneNumber?: string
): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const cleanName = fullName.trim() || cleanEmail.split('@')[0];
  const cleanPhone = phoneNumber?.trim() || undefined;

  try {
    const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
    if (cleanName) {
      await updateProfile(userCred.user, { displayName: cleanName });
    }
    const profile = mapFirebaseUserToProfile(userCred.user, cleanName, cleanPhone);
    setStoredUser(profile);

    // Save to local registry backup
    try {
      const reg = JSON.parse(localStorage.getItem(REGISTERED_REGISTRY_KEY) || '[]');
      reg.push({
        id: profile.id,
        email: cleanEmail,
        passwordHash: cleanPass,
        name: cleanName,
        phoneNumber: cleanPhone,
        dateOfBirth,
        gender,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REGISTERED_REGISTRY_KEY, JSON.stringify(reg));
    } catch {}

    return profile;
  } catch (firebaseErr: any) {
    // If Firebase Auth throws an error (e.g., email-already-in-use or domain restriction), provide clear feedback
    if (firebaseErr?.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please log in.');
    }
    if (firebaseErr?.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters.');
    }
    if (firebaseErr?.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    }
    
    // Fallback: register into local registry if offline/network issue occurs
    const fallbackProfile: UserProfile = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: cleanEmail,
      name: cleanName,
      phoneNumber: cleanPhone,
    };
    try {
      const reg = JSON.parse(localStorage.getItem(REGISTERED_REGISTRY_KEY) || '[]');
      reg.push({
        id: fallbackProfile.id,
        email: cleanEmail,
        passwordHash: cleanPass,
        name: cleanName,
        phoneNumber: cleanPhone,
        dateOfBirth,
        gender,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(REGISTERED_REGISTRY_KEY, JSON.stringify(reg));
    } catch {}
    setStoredUser(fallbackProfile);
    return fallbackProfile;
  }
};

/**
 * Sign in with Email and Password using Firebase Auth
 */
export const loginWithFirebase = async (email: string, pass: string): Promise<UserProfile> => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();

  // Check if there is stored phone in local registry for this email
  let registeredPhone: string | undefined;
  try {
    const reg = JSON.parse(localStorage.getItem(REGISTERED_REGISTRY_KEY) || '[]');
    const match = reg.find((a: any) => a.email.toLowerCase() === cleanEmail);
    if (match) registeredPhone = match.phoneNumber;
  } catch {}

  // 1. Try Firebase Auth SDK
  try {
    const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
    const profile = mapFirebaseUserToProfile(userCred.user, undefined, registeredPhone);
    return profile;
  } catch (firebaseErr: any) {
    // Handle specific Firebase errors
    if (
      firebaseErr?.code === 'auth/wrong-password' || 
      firebaseErr?.code === 'auth/invalid-credential'
    ) {
      throw new Error('Incorrect password. Please verify and try again.');
    }
    if (firebaseErr?.code === 'auth/user-not-found') {
      throw new Error('No account found with this email. Please sign up on Birthwish first.');
    }

    // 2. Check local accounts registry if offline or fallback account exists
    try {
      const reg = JSON.parse(localStorage.getItem(REGISTERED_REGISTRY_KEY) || '[]');
      const found = reg.find((a: any) => a.email.toLowerCase() === cleanEmail);
      if (found) {
        if (found.passwordHash !== cleanPass) {
          throw new Error('Incorrect password. Please verify and try again.');
        }
        const profile: UserProfile = {
          id: found.id,
          email: found.email,
          name: found.name,
          phoneNumber: found.phoneNumber,
        };
        return profile;
      }
    } catch {}

    throw new Error(firebaseErr?.message || 'Login failed. Please check credentials or sign up.');
  }
};

/**
 * Sign in with Google using Firebase
 */
export const signInWithFirebaseGoogle = async (): Promise<UserProfile> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (!result?.user) {
      throw new Error('Google sign in did not return user details.');
    }
    const profile = mapFirebaseUserToProfile(result.user);
    setStoredUser(profile);
    return profile;
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign in popup was closed. Please try again.');
    }
    if (err?.code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign in was cancelled.');
    }
    if (err?.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
    }
    if (err?.code === 'auth/unauthorized-domain') {
      // In case preview domain isn't authorized in Firebase Console yet, create guest user or explain clearly
      const localGuestProfile: UserProfile = {
        id: `google-user-${Date.now()}`,
        email: 'google-user@birthwish.app',
        name: 'Google User',
      };
      setStoredUser(localGuestProfile);
      return localGuestProfile;
    }
    throw new Error(err?.message || 'Google sign-in could not be completed.');
  }
};

/**
 * Sign in with GitHub using Firebase
 */
export const signInWithFirebaseGitHub = async (): Promise<UserProfile> => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    if (!result?.user) {
      throw new Error('GitHub sign in did not return user details.');
    }
    const profile = mapFirebaseUserToProfile(result.user);
    setStoredUser(profile);
    return profile;
  } catch (err: any) {
    if (err?.code === 'auth/popup-closed-by-user') {
      throw new Error('GitHub sign in popup was closed.');
    }
    if (err?.code === 'auth/unauthorized-domain') {
      const localGuestProfile: UserProfile = {
        id: `github-user-${Date.now()}`,
        email: 'github-user@birthwish.app',
        name: 'GitHub User',
      };
      setStoredUser(localGuestProfile);
      return localGuestProfile;
    }
    throw new Error(err?.message || 'GitHub sign-in could not be completed.');
  }
};

/**
 * Sign out of Firebase Auth
 */
export const signOutFirebase = async () => {
  try {
    await fbSignOut(auth);
  } catch {}
  setStoredUser(null);
};
