import { useState, useEffect } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  startDate: string;
  status: string;
  completed: boolean;
  createdAt: any;
  completedAt: any;
  userId: string;
}

interface DailyStats {
  date: string;
  total: number;
  completed: number;
  completionRate: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<'week' | 'month' | '3months'>('week');
  const [viewOption, setViewOption] = useState<'count' | 'rate'>('count');

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;


    if (currentUser) {
      loadTasks(currentUser.uid);
    } else {
      navigate('/login');
    }
  }, [navigate]);

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

  // Calculate daily statistics
  const getDailyStats = (): DailyStats[] => {
    const now = new Date();
    const daysToShow = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
    const stats: DailyStats[] = [];

    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t => t.startDate === dateStr);
      const completedTasks = dayTasks.filter(t => t.status === 'completed' || t.completed);

      stats.push({
        date: dateStr,
        total: dayTasks.length,
        completed: completedTasks.length,
        completionRate: dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0
      });
    }

    return stats;
  };

  // Calculate average tasks per day
  const getAverageTasksPerDay = (): number => {
    const dailyStats = getDailyStats();
    const daysWithTasks = dailyStats.filter(d => d.total > 0);
    if (daysWithTasks.length === 0) return 0;

    const totalTasks = daysWithTasks.reduce((sum, day) => sum + day.total, 0);
    return Math.round((totalTasks / daysWithTasks.length) * 10) / 10;
  };

  // Calculate average completion rate
  const getAverageCompletionRate = (): number => {
    const dailyStats = getDailyStats();
    const daysWithTasks = dailyStats.filter(d => d.total > 0);
    if (daysWithTasks.length === 0) return 0;

    const totalRate = daysWithTasks.reduce((sum, day) => sum + day.completionRate, 0);
    return Math.round(totalRate / daysWithTasks.length);
  };

  // Suggest target task count
  const getSuggestedTargetRange = (): { min: number; max: number; message: string } | null => {
    const dailyStats = getDailyStats();
    const daysWithTasks = dailyStats.filter(d => d.total > 0);

    // Need at least 7 consecutive days of data for weekly pattern
    if (timeRange === 'week' && daysWithTasks.length >= 7) {
      const completedCounts = daysWithTasks.map(d => d.completed);
      const avgCompleted = completedCounts.reduce((a, b) => a + b, 0) / completedCounts.length;
      const avgCompletionRate = getAverageCompletionRate();

      // If completion rate is good (>70%), suggest current range
      if (avgCompletionRate >= 70) {
        return {
          min: Math.floor(avgCompleted * 0.9),
          max: Math.ceil(avgCompleted * 1.1),
          message: `Great job! You're completing ${avgCompletionRate}% of your tasks. Keep your daily tasks between ${Math.floor(avgCompleted * 0.9)}-${Math.ceil(avgCompleted * 1.1)} to maintain this performance.`
        };
      } else if (avgCompletionRate >= 50) {
        // Moderate completion, suggest slightly fewer tasks
        return {
          min: Math.floor(avgCompleted * 0.7),
          max: Math.ceil(avgCompleted * 0.9),
          message: `You're completing ${avgCompletionRate}% of your tasks. Try reducing your daily tasks to ${Math.floor(avgCompleted * 0.7)}-${Math.ceil(avgCompleted * 0.9)} to improve completion rate.`
        };
      } else {
        // Low completion, suggest significant reduction
        return {
          min: Math.floor(avgCompleted * 0.5),
          max: Math.ceil(avgCompleted * 0.7),
          message: `Your completion rate is ${avgCompletionRate}%. Consider reducing your daily tasks to ${Math.floor(avgCompleted * 0.5)}-${Math.ceil(avgCompleted * 0.7)} for better success.`
        };
      }
    }

    // For 3 weeks of data
    if (timeRange === '3months' && daysWithTasks.length >= 21) {
      const completedCounts = daysWithTasks.map(d => d.completed);
      const avgCompleted = completedCounts.reduce((a, b) => a + b, 0) / completedCounts.length;
      const avgCompletionRate = getAverageCompletionRate();

      if (avgCompletionRate >= 70) {
        return {
          min: Math.floor(avgCompleted * 0.9),
          max: Math.ceil(avgCompleted * 1.1),
          message: `Excellent consistency over 3 weeks! ${avgCompletionRate}% completion rate. Maintain ${Math.floor(avgCompleted * 0.9)}-${Math.ceil(avgCompleted * 1.1)} tasks daily.`
        };
      } else {
        return {
          min: Math.floor(avgCompleted * 0.6),
          max: Math.ceil(avgCompleted * 0.8),
          message: `Based on 3 weeks of data (${avgCompletionRate}% completion), aim for ${Math.floor(avgCompleted * 0.6)}-${Math.ceil(avgCompleted * 0.8)} tasks daily.`
        };
      }
    }

    return null;
  };

  const dailyStats = getDailyStats();
  const maxTasks = Math.max(...dailyStats.map(d => d.total), 1);
  const avgTasksPerDay = getAverageTasksPerDay();
  const avgCompletionRate = getAverageCompletionRate();
  const targetRange = getSuggestedTargetRange();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Task Analytics</h1>
              <p className="mt-1 text-sm text-gray-500">
                Insights into your task completion patterns
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setTimeRange('week')}
                  className={`px-4 py-2 rounded-md font-medium ${timeRange === 'week'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => setTimeRange('month')}
                  className={`px-4 py-2 rounded-md font-medium ${timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setTimeRange('3months')}
                  className={`px-4 py-2 rounded-md font-medium ${timeRange === '3months'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Last 90 Days
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Average Tasks/Day</h3>
                <div className="text-3xl font-bold text-blue-600">{avgTasksPerDay}</div>
                <p className="text-xs text-gray-500 mt-2">Tasks scheduled per day</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completion Rate</h3>
                <div className="text-3xl font-bold text-green-600">{avgCompletionRate}%</div>
                <p className="text-xs text-gray-500 mt-2">Average completion rate</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tasks</h3>
                <div className="text-3xl font-bold text-purple-600">{tasks.length}</div>
                <p className="text-xs text-gray-500 mt-2">All time</p>
              </div>
            </div>

            {/* Target Suggestion */}
            {targetRange && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg shadow-lg p-6">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">Suggested Daily Target</h3>
                    <p className="text-sm text-blue-800 mb-3">{targetRange.message}</p>
                    <div className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md font-bold">
                      Target: {targetRange.min} - {targetRange.max} tasks/day
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Daily Completion Graph */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Task Activity</h2>
                  <p className="text-sm text-gray-500">Distribution of tasks over time</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg self-stretch sm:self-auto">
                  <button
                    onClick={() => setViewOption('count')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewOption === 'count' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Task Count
                  </button>
                  <button
                    onClick={() => setViewOption('rate')}
                    className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-md transition-all ${viewOption === 'rate' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Completion %
                  </button>
                </div>
              </div>

              <div className="relative h-72 flex items-end gap-1.5 sm:gap-3 mb-4 min-w-[300px] overflow-x-auto pb-10 pt-4 scrollbar-hide px-2">
                {/* Y-axis line (subtle) */}
                <div className="absolute left-0 top-4 bottom-10 w-[1px] bg-gray-200"></div>

                {/* X-axis line */}
                <div className="absolute left-0 right-0 bottom-10 h-[1px] bg-gray-300"></div>
                {dailyStats.map((stat, index) => {
                  const maxVal = viewOption === 'count' ? Math.max(maxTasks, 5) : 100;
                  const currentVal = viewOption === 'count' ? stat.total : stat.completionRate;
                  const heightPercentage = (currentVal / maxVal) * 100;

                  return (
                    <div key={index} className="flex-1 min-w-[14px] flex flex-col items-center gap-0 group relative h-full">
                      {/* Bar Container */}
                      <div className="w-full flex flex-col justify-end bg-transparent overflow-hidden h-full group-hover:bg-gray-50/50 transition-colors pb-[1px]">
                        <div className="w-full flex flex-col justify-end bg-gray-50 rounded-t-lg overflow-hidden h-full border-x border-t border-gray-100/50">
                          {viewOption === 'count' ? (
                            <>
                              {/* Completed part */}
                              <div
                                className="bg-blue-600 transition-all duration-700 ease-out"
                                style={{ height: `${(stat.completed / maxVal) * 100}%` }}
                              />
                              {/* Pending part */}
                              <div
                                className="bg-blue-200 transition-all duration-700 ease-out"
                                style={{ height: `${((stat.total - stat.completed) / maxVal) * 100}%` }}
                              />
                            </>
                          ) : (
                            <div
                              className="bg-indigo-500 rounded-t-lg transition-all duration-700 ease-out"
                              style={{ height: `${heightPercentage}%` }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Tick mark */}
                      <div className="w-[1px] h-2 bg-gray-300 mb-1"></div>

                      {/* Date Label */}
                      <div className="absolute -bottom-6 text-[10px] text-gray-500 font-bold whitespace-nowrap rotate-45 origin-left">
                        {formatDate(stat.date)}
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block z-20 pointer-events-none">
                        <div className="bg-gray-900/95 backdrop-blur-sm text-white text-[10px] py-2 px-3 rounded-lg shadow-xl whitespace-nowrap border border-white/10">
                          <div className="font-bold border-b border-white/10 pb-1 mb-1">{formatDate(stat.date)}</div>
                          {viewOption === 'count' ? (
                            <>
                              <div className="flex justify-between gap-4"><span>Total:</span> <span className="font-bold">{stat.total}</span></div>
                              <div className="flex justify-between gap-4 text-green-400"><span>Done:</span> <span className="font-bold">{stat.completed}</span></div>
                              <div className="flex justify-between gap-4 text-blue-300"><span>Left:</span> <span className="font-bold">{stat.total - stat.completed}</span></div>
                            </>
                          ) : (
                            <div className="text-center font-bold text-lg">{Math.round(stat.completionRate)}%</div>
                          )}
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                {viewOption === 'count' ? (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-sm shadow-sm"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-sm shadow-sm"></div>
                      <span>Remaining</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-indigo-500 rounded-sm shadow-sm"></div>
                    <span>Success Rate %</span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Best Performing Days</h3>
                {dailyStats
                  .filter(d => d.total > 0)
                  .sort((a, b) => b.completionRate - a.completionRate)
                  .slice(0, 5)
                  .map((day, index) => (
                    <div key={day.date} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}</span>
                        <span className="font-medium text-gray-700">{formatDate(day.date)}</span>
                      </div>
                      <span className="text-green-600 font-semibold">{Math.round(day.completionRate)}%</span>
                    </div>
                  ))}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Busiest Days</h3>
                {dailyStats
                  .filter(d => d.total > 0)
                  .sort((a, b) => b.total - a.total)
                  .slice(0, 5)
                  .map((day, index) => (
                    <div key={day.date} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{index === 0 ? '📈' : '📊'}</span>
                        <span className="font-medium text-gray-700">{formatDate(day.date)}</span>
                      </div>
                      <span className="text-purple-600 font-semibold">{day.total} tasks</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
