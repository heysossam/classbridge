import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, Auth, GoogleAuthProvider, signInWithPopup, 
  signInAnonymously, signOut, onAuthStateChanged, User 
} from 'firebase/auth';
import { getFirestore, Firestore, doc, getDoc } from 'firebase/firestore';

// Environment-driven Firebase Configuration (no hardcoded credentials)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.apiKey && !!firebaseConfig.projectId;
}

// Initialize Firebase App safely
export const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(
      isFirebaseConfigured() 
        ? firebaseConfig 
        : { apiKey: 'dummy', projectId: 'dummy' }
    ) 
  : getApp();

// Initialize Firebase Services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

export async function loginAnonymouslyStudent(): Promise<User> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutFirebaseUser(): Promise<void> {
  if (auth.currentUser) {
    await signOut(auth);
  }
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Check if the authenticated Google user UID is registered in authorizedUsers/{uid}
 * with role === 'teacher' | 'admin'
 */
export async function checkAuthorizedUser(uid: string): Promise<{
  isAuthorized: boolean;
  role?: 'teacher' | 'admin';
  displayName?: string;
  email?: string;
  assignedSide?: 'Korea Class' | 'Taiwan Class';
  roomIds?: string[];
}> {
  if (!isFirebaseConfigured()) {
    return { isAuthorized: false };
  }

  try {
    const userDocRef = doc(db, 'authorizedUsers', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      // Requirement A & 4: Must verify active === true (support both boolean true and string 'true')
      const isActive = data.active === true || data.active === 'true';
      if (isActive && (data.role === 'teacher' || data.role === 'admin')) {
        return {
          isAuthorized: true,
          role: data.role,
          displayName: data.displayName || data.name,
          email: data.email,
          assignedSide: data.assignedSide,
          roomIds: Array.isArray(data.roomIds) ? data.roomIds : []
        };
      }
    }
    return { isAuthorized: false };
  } catch (error) {
    console.warn('Error checking authorizedUsers collection:', error);
    return { isAuthorized: false };
  }
}
