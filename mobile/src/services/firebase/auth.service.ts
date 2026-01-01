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

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUser(userCredential.user);
}

// Create new account
export async function signUp(
    email: string,
    password: string,
    displayName?: string
): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    if (displayName) {
        await updateProfile(userCredential.user, { displayName });
    }

    return mapFirebaseUser(userCredential.user);
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
    };
}
