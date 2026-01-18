import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile,
} from 'firebase/auth';

import { auth } from './config';
import { User } from '../../types';

// Map Firebase error codes to user-friendly messages
function getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up first.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-credential':
            return 'No account found with this email. Please sign up first.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Contact support.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Please login.';
        case 'auth/weak-password':
            return 'Password is too weak. Use at least 6 characters.';
        default:
            return 'Something went wrong. Please try again.';
    }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
        throw new Error(getAuthErrorMessage(error.code));
    }
}

// Create new account
export async function signUp(
    email: string,
    password: string,
    displayName?: string
): Promise<User> {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        if (displayName) {
            await updateProfile(userCredential.user, { displayName });
        }

        return mapFirebaseUser(userCredential.user);
    } catch (error: any) {
        throw new Error(getAuthErrorMessage(error.code));
    }
}

// Sign out
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

// Get current user
export function getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    return firebaseUser ? mapFirebaseUser(firebaseUser) : null;
}

// Subscribe to auth state changes
export function onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
        callback(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
    });
}

// Map Firebase user to our User type
function mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
    };
}
