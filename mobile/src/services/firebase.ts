import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration - same as web app
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};

// Initialize Firebase App (singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulators in development
const USE_EMULATORS = __DEV__; // true in development

if (USE_EMULATORS) {
  try {
    // Auth Emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    console.log('🔧 Connected to Auth emulator at http://127.0.0.1:9099');

    // Firestore Emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('🔧 Connected to Firestore emulator at 127.0.0.1:8080');
  } catch (error) {
    console.warn('⚠️ Could not connect to emulators:', error);
  }
}

export default app;
