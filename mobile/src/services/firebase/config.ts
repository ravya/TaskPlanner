import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration - same as web app
const firebaseConfig = {
    apiKey: "AIzaSyDOCAbC123dEf456GhI789jKl01-MnsOpQ",
    authDomain: "taskflow-demo.firebaseapp.com",
    projectId: "taskflow-demo",
    storageBucket: "taskflow-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456",
};

// Initialize Firebase app (singleton)
function initializeFirebaseApp(): FirebaseApp {
    const apps = getApps();
    if (apps.length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

export const app: FirebaseApp = initializeFirebaseApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Export for use in services
export const firebaseSettings = {
    projectId: firebaseConfig.projectId,
};
