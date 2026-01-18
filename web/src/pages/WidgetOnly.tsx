import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TodayStickiesWidget from '../components/TodayStickiesWidget';
import { useAuthStore } from '../store/slices/authSlice';

export default function WidgetOnly() {
    const { user, isLoading } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !user) {
            // Redirect to main login with a return path
            navigate('/login?redirect=/w');
        }
    }, [user, isLoading, navigate]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-yellow-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via useEffect
    }

    // Widget-only view - no padding, no extra UI, clean background
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#fef3c7', // Matching sticky note yellow-ish background
            padding: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
        }}>
            <TodayStickiesWidget />
        </div>
    );
}
