import { getAuth, signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  startTime?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  isRepeating: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  userId: string;
  createdAt: any;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setUser(currentUser);

    // Check if we should show email verification banner
    if (currentUser && !currentUser.emailVerified) {
      const createdAt = currentUser.metadata.creationTime;
      const accountAge = Date.now() - new Date(createdAt || 0).getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;

      // Show banner if account is less than 1 week old
      if (accountAge < oneWeek) {
        setShowEmailVerification(true);
      }
    }

    if (currentUser) {
      loadTasks(currentUser.uid);
    }
  }, []);

  const loadTasks = async (userId: string) => {
    setLoading(true);
    try {
      const db = getFirestore();
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const loadedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        loadedTasks.push({ id: doc.id, ...doc.data() } as Task);
      });

      setTasks(loadedTasks);

      // Filter today's tasks
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = loadedTasks.filter(task => {
        if (task.startDate) {
          return task.startDate === today;
        }
        return false;
      });
      setTodaysTasks(todayTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return '';
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString();
    if (time) {
      return `${dateStr} ${time}`;
    }
    return dateStr;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Home</h1>
              <p className="text-sm text-gray-500 mt-1">
                Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Verification Banner - Only show if not verified and account < 1 week */}
        {showEmailVerification && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-amber-800">Email Verification Pending</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Please verify your email address to access all features.
                </p>
              </div>
              <button
                onClick={() => setShowEmailVerification(false)}
                className="ml-auto flex-shrink-0 text-amber-400 hover:text-amber-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Task Statistics - 3 Main Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* All Tasks */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Tasks</h3>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-4">{totalTasks}</div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Pending:</span>
                <span className="font-medium text-gray-900">{pendingTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">In Progress:</span>
                <span className="font-medium text-gray-900">{inProgressTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-gray-900">{completedTasks}</span>
              </div>
            </div>
            <Link
              to="/tasks"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>

          {/* Task Progress */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Task Progress</h3>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <div className="text-4xl font-bold text-green-600">{completionRate}%</div>
              <div className="text-sm text-gray-500 pb-1">complete</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">
              {completedTasks} of {totalTasks} tasks
            </p>
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">{todaysTasks.length}</div>
            <p className="text-sm text-gray-500">
              {todaysTasks.filter(t => t.status === 'completed').length} completed
            </p>
          </div>
        </div>

        {/* Today's Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Today's Tasks</h2>
            <Link
              to="/tasks"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all tasks →
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tasks...</div>
          ) : todaysTasks.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-3">No tasks scheduled for today</p>
              <Link
                to="/tasks"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
              >
                Add a task
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {todaysTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    disabled
                    className="h-5 w-5 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-base font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {task.startTime || 'All day'}
                  </span>
                </div>
              ))}
              {todaysTasks.length > 5 && (
                <div className="p-4 text-center">
                  <Link
                    to="/tasks"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View {todaysTasks.length - 5} more tasks →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
