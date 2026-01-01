import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import TodayStickiesWidget from '../components/TodayStickiesWidget';

export default function StickiesDemo() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setLoading(false);
            if (!currentUser) {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Today's Tasks Sticky Widget</h1>
                    <p className="text-gray-600">A macOS Stickies-inspired widget for your daily tasks</p>
                    <button
                        onClick={() => navigate('/')}
                        className="mt-4 px-6 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg shadow-md transition-colors font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {/* Widget Demo */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Main Widget */}
                    <div className="md:col-span-1">
                        <TodayStickiesWidget />
                    </div>

                    {/* Info Section */}
                    <div className="md:col-span-1 lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Features</h2>

                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">📌</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Sticky Note Design</h3>
                                        <p className="text-sm text-gray-600">Beautiful yellow sticky note aesthetic, just like macOS Stickies</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Quick Task Completion</h3>
                                        <p className="text-sm text-gray-600">Toggle task completion with a single click</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">➕</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Add Tasks Inline</h3>
                                        <p className="text-sm text-gray-600">Create new tasks right in the widget without leaving the page</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">🎨</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Priority Colors</h3>
                                        <p className="text-sm text-gray-600">Red for high priority, yellow for medium, green for low</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Progress Tracking</h3>
                                        <p className="text-sm text-gray-600">Visual progress bar shows your completion rate</p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <span className="text-2xl">🔄</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">Auto-Refresh</h3>
                                        <p className="text-sm text-gray-600">Keeps your tasks up-to-date in real-time</p>
                                    </div>
                                </li>
                            </ul>

                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
                                <p className="text-sm text-blue-800">
                                    This widget can be embedded anywhere in your application! It's perfect for dashboards,
                                    sidebar panels, or even as a standalone desktop widget.
                                </p>
                            </div>

                            <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                                <h3 className="font-semibold text-green-900 mb-2">🎯 How to Use</h3>
                                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                                    <li>Click "Add New Task" to create a task for today</li>
                                    <li>Click the checkbox to mark tasks as complete</li>
                                    <li>Click the refresh icon to reload your tasks</li>
                                    <li>Completed tasks automatically move to the bottom</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiple Widgets Demo */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Multiple Widgets Display</h2>
                    <p className="text-center text-gray-600 mb-6">You can have multiple sticky widgets on the same page!</p>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <TodayStickiesWidget />
                        <TodayStickiesWidget />
                        <TodayStickiesWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
