import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import TodayStickiesWidget from '../components/TodayStickiesWidget';

export default function WidgetOnly() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showLogin, setShowLogin] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setLoading(false);
            if (!user) setShowLogin(true);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            // Try to create account if login fails
            try {
                const auth = getAuth();
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr: any) {
                setError(createErr.message || 'Login failed');
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (!isAuthenticated && showLogin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4" style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
            }}>
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">🔐 Login</h2>
                    {error && <p className="text-red-500 text-xs mb-2 text-center">{error}</p>}
                    <form onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mb-2 border border-gray-300 rounded text-sm"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 mb-3 border border-gray-300 rounded text-sm"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded font-medium text-sm"
                        >
                            Sign In
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                        New? Enter email & password to create account
                    </p>
                </div>
            </div>
        );
    }

    // Widget-only view - no padding, no extra UI
    return (
        <div style={{
            minHeight: '100vh',
            background: 'transparent',
            padding: '0'
        }}>
            <TodayStickiesWidget />
        </div>
    );
}
