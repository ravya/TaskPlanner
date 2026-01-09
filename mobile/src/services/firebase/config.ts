import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration - same as web app
const firebaseConfig = {
    apiKey: "AIzaSyC5WpGFSO4LOpO8mFa_8hyIf9bflVsrWyo",
    authDomain: "taskplanner-mvp.firebaseapp.com",
    projectId: "taskplanner-mvp",
    storageBucket: "taskplanner-mvp.firebasestorage.app",
    messagingSenderId: "574857486152",
    appId: "1:574857486152:web:af4c6cf9c4d86a2fad9d7d",
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
