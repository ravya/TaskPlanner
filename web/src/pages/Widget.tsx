import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  startTime?: string;
  status: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  isRepeating?: boolean;
  repeatFrequency?: 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  userId?: string;
}

export default function Widget() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadTodaysTasks(currentUser.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadTodaysTasks(user.uid);
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const loadTodaysTasks = async (userId: string) => {
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

      // Filter today's tasks - only show tasks with startDate exactly equal to today
      const today = new Date().toISOString().split('T')[0];
      const todayTasks = loadedTasks.filter(task => {
        if (!task.startDate) return false;
        // Ensure we're comparing dates correctly (YYYY-MM-DD format)
        const taskDate = task.startDate.split('T')[0]; // Handle any time component
        return taskDate === today;
      });

      // Sort by priority (high first) then by completion status (active first)
      const sortedTasks = todayTasks.sort((a, b) => {
        // Completed tasks go to end
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Sort by priority
        const priorityValue = { high: 3, medium: 2, low: 1 };
        return priorityValue[b.priority] - priorityValue[a.priority];
      });

      setTodaysTasks(sortedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextOccurrenceDate = (currentDate: string, frequency: 'daily' | 'weekly' | 'monthly'): string => {
    const date = new Date(currentDate);
    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
    }
    return date.toISOString().split('T')[0];
  };

  const shouldCreateNextOccurrence = (task: Task): boolean => {
    if (!task.isRepeating || !task.repeatFrequency) return false;
    if (task.repeatEndDate) {
      const endDate = new Date(task.repeatEndDate);
      const nextDate = new Date(getNextOccurrenceDate(task.startDate, task.repeatFrequency));
      return nextDate <= endDate;
    }
    return true; // No end date, repeat indefinitely
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', task.id);

      const newStatus = task.completed ? 'active' : 'completed';
      const newCompleted = !task.completed;

      await updateDoc(taskRef, {
        status: newStatus,
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : null,
        updatedAt: new Date()
      });

      // If task is being marked as complete and is repeating, create next occurrence
      if (newCompleted && shouldCreateNextOccurrence(task) && task.userId) {
        const nextDate = getNextOccurrenceDate(task.startDate, task.repeatFrequency!);
        const today = new Date().toISOString().split('T')[0];
        
        // Only create if next occurrence is in the future or today
        if (nextDate >= today) {
          const nextTaskData = {
            title: task.title,
            description: task.description,
            startDate: nextDate,
            startTime: task.startTime || null,
            status: 'todo',
            priority: task.priority,
            tags: task.tags || [],
            isRepeating: task.isRepeating,
            repeatFrequency: task.repeatFrequency,
            repeatEndDate: task.repeatEndDate || null,
            userId: task.userId,
            createdAt: Timestamp.now(),
            completed: false
          };

          await addDoc(collection(db, 'tasks'), nextTaskData);
        }
      }

      // Reload tasks
      if (user) {
        await loadTodaysTasks(user.uid);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (time?: string) => {
    if (!time) return 'All day';
    return time;
  };

  const stats = {
    total: todaysTasks.length,
    completed: todaysTasks.filter(t => t.completed).length,
    pending: todaysTasks.filter(t => !t.completed).length,
    completionRate: todaysTasks.length > 0
      ? Math.round((todaysTasks.filter(t => t.completed).length / todaysTasks.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Today's Tasks</h1>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={() => loadTodaysTasks(user?.uid)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Refresh"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-blue-700">Total</div>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs text-green-700">Done</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center">
              <div className="text-xl font-bold text-purple-600">{stats.completionRate}%</div>
              <div className="text-xs text-purple-700">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Loading...
            </div>
          ) : todaysTasks.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-600 font-medium mb-1">No tasks for today</p>
              <p className="text-xs text-gray-500">Enjoy your free day! 🎉</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto">
              {todaysTasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-full h-full text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* Priority Indicator */}
                    <div className={`flex-shrink-0 w-1 h-5 rounded-full ${getPriorityColor(task.priority)}`}></div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${
                        task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className={`text-xs mt-0.5 ${
                          task.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.description.length > 50
                            ? task.description.substring(0, 50) + '...'
                            : task.description
                          }
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTime(task.startTime)}
                        </span>
                        {task.tags && task.tags.length > 0 && (
                          <span className="text-xs text-gray-400">
                            • {task.tags[0]}
                            {task.tags.length > 1 && ` +${task.tags.length - 1}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
          >
            Open Full App →
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
