import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  deleteDoc, 
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Birthwish, UserProfile } from '../types';

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Initialize Firestore targeting the provisioned database ID
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Validate connection to Firestore as per blueprint constraint
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice. Please check network connectivity.');
    }
  }
}
testFirestoreConnection();

/**
 * Sign in using Google with Firebase Auth
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const fbUser = result.user;
  
  const userProfile: UserProfile = {
    id: fbUser.uid,
    email: fbUser.email || 'user@birthwish.app',
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Celebrant Creator',
    avatarUrl: fbUser.photoURL || undefined,
    photoURL: fbUser.photoURL || undefined,
  };

  // Upsert user profile to Firestore
  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...userProfile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to upsert user profile to Firestore:', err);
  }

  // Also store in localStorage for offline fast fallback
  localStorage.setItem('birthwish_active_user_v2', JSON.stringify(userProfile));

  return userProfile;
}

// Alias for backwards compatibility
export const signInWithFirebaseGoogle = signInWithGoogle;

/**
 * Login using Email & Password via Firebase Auth
 */
export async function loginWithFirebase(email: string, pass: string): Promise<UserProfile> {
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  const fbUser = cred.user;

  const profile: UserProfile = {
    id: fbUser.uid,
    email: fbUser.email || email,
    name: fbUser.displayName || email.split('@')[0],
    avatarUrl: fbUser.photoURL || undefined,
    photoURL: fbUser.photoURL || undefined,
  };

  localStorage.setItem('birthwish_active_user_v2', JSON.stringify(profile));
  return profile;
}

/**
 * Register using Email & Password via Firebase Auth
 */
export async function registerWithFirebase(
  email: string, 
  pass: string, 
  displayName: string,
  dateOfBirth?: string,
  gender?: string
): Promise<UserProfile> {
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const fbUser = cred.user;

  await updateProfile(fbUser, { displayName });

  const profile: UserProfile = {
    id: fbUser.uid,
    email: fbUser.email || email,
    name: displayName,
    avatarUrl: fbUser.photoURL || undefined,
    photoURL: fbUser.photoURL || undefined,
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...profile,
      dateOfBirth,
      gender,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore user profile register error:', err);
  }

  localStorage.setItem('birthwish_active_user_v2', JSON.stringify(profile));
  return profile;
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  await fbSignOut(auth);
  localStorage.removeItem('birthwish_active_user_v2');
}

/**
 * Subscribe to Auth State changes
 */
export function onFirebaseAuthStateChanged(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const userProfile: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || 'user@birthwish.app',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Celebrant Creator',
        avatarUrl: fbUser.photoURL || undefined,
        photoURL: fbUser.photoURL || undefined,
      };
      localStorage.setItem('birthwish_active_user_v2', JSON.stringify(userProfile));
      callback(userProfile);
    } else {
      callback(null);
    }
  });
}

/**
 * Two-Factor Security Code Helpers (used by TwoFactorAuthModal)
 */
interface VerificationSession {
  code: string;
  target: string;
  targetType: 'email' | 'phone';
  userProfile: UserProfile;
}

let pendingVerificationSession: VerificationSession | null = null;

export async function sendVerificationSecurityCode(
  userProfile: UserProfile,
  target: string, 
  type: 'email' | 'phone',
  _containerId?: string
): Promise<{ code: string; demoCodeNotice?: string }> {
  // Generate a realistic 6-digit verification code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  pendingVerificationSession = { 
    code, 
    target, 
    targetType: type,
    userProfile
  };
  return { 
    code,
    demoCodeNotice: code
  };
}

export async function verifySecurityCode(inputCode: string): Promise<UserProfile> {
  if (!pendingVerificationSession || pendingVerificationSession.code !== inputCode) {
    throw new Error('Invalid verification code entered.');
  }

  const profile = pendingVerificationSession.userProfile;
  pendingVerificationSession = null;
  return profile;
}

export function getPendingVerificationSession(): VerificationSession | null {
  return pendingVerificationSession;
}

/**
 * Save Birthwish to Firestore and Local Storage
 */
export async function saveWishToFirestore(wish: Birthwish): Promise<Birthwish> {
  try {
    const docRef = doc(db, 'birthwishes', wish.id);
    await setDoc(docRef, {
      ...wish,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.warn('Firestore save notice:', err);
  }
  return wish;
}

/**
 * Load Birthwishes for user from Firestore
 */
export async function fetchWishesFromFirestore(userId: string): Promise<Birthwish[]> {
  try {
    const q = query(collection(db, 'birthwishes'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const wishes: Birthwish[] = [];
    snapshot.forEach((d) => {
      wishes.push(d.data() as Birthwish);
    });
    return wishes;
  } catch (err) {
    console.warn('Failed to load from Firestore:', err);
    return [];
  }
}

/**
 * Delete a Birthwish from Firestore
 */
export async function deleteWishFromFirestore(wishId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'birthwishes', wishId));
  } catch (err) {
    console.warn('Failed to delete from Firestore:', err);
  }
}
