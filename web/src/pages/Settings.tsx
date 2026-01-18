import { useAuthStore } from '../store/slices/authSlice';
import { useUIStore } from '../store/slices/uiSlice';

export default function Settings() {
    const { user } = useAuthStore();
    const {
        theme, setTheme,
        startOfWeek, setStartOfWeek,
        defaultMode, setDefaultMode
    } = useUIStore();

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-700">Profile</h2>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center space-x-4">
                                <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-gray-900">{user?.displayName || 'User'}</h3>
                                    <p className="text-gray-500">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-700">Appearance</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Theme</p>
                                    <p className="text-sm text-gray-500">Choose how TaskPlanner looks to you</p>
                                </div>
                                <select
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                >
                                    <option value="system">System Default</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark (Coming Soon)</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Reduced Motion</p>
                                    <p className="text-sm text-gray-500">Minimize animations</p>
                                </div>
                                <div className="h-6 w-11 bg-gray-200 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-700">Notifications</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Email Updates</p>
                                    <p className="text-sm text-gray-500">Receive a weekly summary of your productivity</p>
                                </div>
                                <div className="h-6 w-11 bg-blue-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Get instant alerts for task deadlines and reminders</p>
                                </div>
                                <div className="h-6 w-11 bg-gray-200 rounded-full relative cursor-pointer">
                                    <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Workflow Section */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-medium text-gray-700">Workflow</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">Default Task Mode</p>
                                    <p className="text-sm text-gray-500">The default mode for new tasks</p>
                                </div>
                                <select
                                    value={defaultMode}
                                    onChange={(e) => setDefaultMode(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                >
                                    <option value="personal">Personal</option>
                                    <option value="professional">Professional</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Start of Week</p>
                                    <p className="text-sm text-gray-500">Choose which day your week starts on</p>
                                </div>
                                <select
                                    value={startOfWeek}
                                    onChange={(e) => setStartOfWeek(e.target.value as any)}
                                    className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                                >
                                    <option value="Sunday">Sunday</option>
                                    <option value="Monday">Monday</option>
                                    <option value="Tuesday">Tuesday</option>
                                    <option value="Wednesday">Wednesday</option>
                                    <option value="Thursday">Thursday</option>
                                    <option value="Friday">Friday</option>
                                    <option value="Saturday">Saturday</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Default View</p>
                                    <p className="text-sm text-gray-500">The first page you see after log in</p>
                                </div>
                                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                                    <option>Dashboard</option>
                                    <option>Upcoming</option>
                                    <option>Today</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div>
                                    <p className="font-medium text-gray-900">Auto-hide Completed Tasks</p>
                                    <p className="text-sm text-gray-500">Hide tasks immediately after completion</p>
                                </div>
                                <div className="h-6 w-11 bg-blue-600 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full shadow" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Section */}
                    <div className="bg-white shadow rounded-lg overflow-hidden border border-red-100">
                        <div className="px-6 py-4 border-b border-red-100 bg-red-50">
                            <h2 className="text-lg font-medium text-red-700">Danger Zone</h2>
                        </div>
                        <div className="p-6">
                            <button className="text-red-600 font-medium hover:text-red-700">Delete Account and Data</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
