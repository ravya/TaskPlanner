import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './config';
import { User } from '../../types';

// Complete pending auth sessions
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
const GOOGLE_WEB_CLIENT_ID = '721399293084-msqg42f42jme551a19vbrgosrbemutdi.apps.googleusercontent.com';

// Create redirect URI using Expo's utility
// This generates: taskplanner://auth (must be added to Google Cloud Console)
const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'taskplanner',
    path: 'auth',
});

// Hook for Google Sign-In
export function useGoogleAuth() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        clientId: GOOGLE_WEB_CLIENT_ID,
        redirectUri,
        // Add iOS and Android client IDs when you have them:
        // iosClientId: 'YOUR_IOS_CLIENT_ID',
        // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleCredential(id_token);
        } else if (response?.type === 'error') {
            setError(response.error?.message || 'Google sign-in failed');
            setLoading(false);
        }
    }, [response]);

    const handleGoogleCredential = async (idToken: string) => {
        try {
            const credential = GoogleAuthProvider.credential(idToken);
            await signInWithCredential(auth, credential);
            // Auth state listener will handle navigation
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setLoading(true);
        setError(null);
        await promptAsync();
    };

    return {
        signInWithGoogle,
        loading,
        error,
        disabled: !request,
    };
}

// Map Firebase user to our User type
function mapFirebaseUser(firebaseUser: any): User {
    return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
    };
}
