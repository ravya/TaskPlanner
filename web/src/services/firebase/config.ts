import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if we should use emulators
const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true' || import.meta.env.DEV;

// Initialize Firebase app (singleton pattern)
function initializeFirebaseApp(): FirebaseApp {
  const apps = getApps();
  if (apps.length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Initialize Firebase services
export const app: FirebaseApp = initializeFirebaseApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Connect to emulators in development - MUST be done before any operations
if (useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('🔧 Connected to Auth emulator at http://127.0.0.1:9099');
  } catch (error: any) {
    // Ignore "already connected" errors (common during hot reload)
    if (error?.message?.includes('already been called') || error?.message?.includes('already connected')) {
      console.log('🔧 Auth emulator already connected');
    } else {
      console.warn('⚠️ Could not connect to Auth emulator:', error);
    }
  }

  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8085);
    console.log('🔧 Connected to Firestore emulator at 127.0.0.1:8085');
  } catch (error: any) {
    // Ignore "already connected" errors (common during hot reload)
    if (error?.message?.includes('already been called') || error?.message?.includes('already connected')) {
      console.log('🔧 Firestore emulator already connected');
    } else {
      console.warn('⚠️ Could not connect to Firestore emulator:', error);
    }
  }
}

// Initialize Messaging (only if supported)
let messaging: Messaging | null = null;

// Check if messaging is supported and initialize
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
});

export { messaging };

// Firebase configuration object for components
export const firebaseSettings = {
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;

// Firebase service availability checks
export const serviceAvailability = {
  auth: !!auth,
  firestore: !!db,
  messaging: !!messaging,
} as const;

// Export types
export type { FirebaseApp, Auth, Firestore, Messaging };