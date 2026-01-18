import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayTasks = loadedTasks.filter(task => {
        if (!task.startDate) return false;
        // Ensure we're comparing dates correctly (YYYY-MM-DD format)
        const taskDate = task.startDate.split('T')[0];
        return taskDate === today;
      });

      // Sort by status, then by time
      const sortedTasks = todayTasks.sort((a, b) => {
        // Completed tasks go to end
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // Sort by time
        const timeA = a.startTime || '23:59';
        const timeB = b.startTime || '23:59';
        return timeA.localeCompare(timeB);
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
        const today = format(new Date(), 'yyyy-MM-dd');

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

  const stats = {
    total: todaysTasks.length,
    completed: todaysTasks.filter(t => t.completed).length,
    pending: todaysTasks.filter(t => !t.completed).length,
    completionRate: todaysTasks.length > 0
      ? Math.round((todaysTasks.filter(t => t.completed).length / todaysTasks.length) * 100)
      : 0
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center py-12 px-4">
      <div className="relative w-full max-w-[340px] aspect-square bg-[#FEF3C7] shadow-[0_10px_20px_rgba(0,0,0,0.1)] p-8 transform rotate-1 hover:rotate-0 transition-transform duration-500 ease-out">
        {/* Tape effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-8 bg-white/60 backdrop-blur-sm border border-black/5 rotate-[-2deg] shadow-sm"></div>

        <div className="h-full flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold text-amber-900/80">Today's Focus</h1>
              <p className="text-[10px] uppercase tracking-wider text-amber-900/40 font-bold">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  window.open('/widget', 'TaskPlannerWidget', 'width=340,height=450,menubar=no,toolbar=no,location=no,status=no');
                }}
                className="p-1 hover:bg-amber-900/5 rounded-full transition-colors"
                title="Pop out sticky note"
              >
                <svg className="w-4 h-4 text-amber-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <button
                onClick={() => loadTodaysTasks(user?.uid)}
                className="p-1 hover:bg-amber-900/5 rounded-full transition-colors"
                title="Refresh"
              >
                <svg className="w-4 h-4 text-amber-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-amber-900/20 border-t-amber-900/60 rounded-full animate-spin"></div>
              </div>
            ) : todaysTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <p className="text-sm font-medium text-amber-900">All clear!</p>
                <p className="text-[10px] text-amber-900">Enjoy your day 🌿</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`mt-1 flex-shrink-0 w-4 h-4 rounded border transition-all ${task.completed
                        ? 'bg-amber-900/20 border-transparent text-amber-900/60'
                        : 'border-amber-900/20 hover:border-amber-900/40'
                        }`}
                    >
                      {task.completed && (
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 12l2 2 4-4" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${task.completed ? 'line-through text-amber-900/30' : 'text-amber-900/80'
                        }`}>
                        {task.title}
                      </p>
                      {task.isRepeating && (
                        <svg className="w-3 h-3 text-amber-900/40 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-amber-900/10 flex justify-between items-center">
            <div className="text-[10px] font-bold text-amber-900/40 uppercase tracking-tighter">
              {stats.completed}/{stats.total} COMPLETED
            </div>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.floor(stats.completionRate / 33) ? 'bg-amber-900/40' : 'bg-amber-900/10'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PWA Instructions */}
      <div className="mt-16 w-full max-w-[340px] px-8 py-10 bg-white/40 backdrop-blur-md rounded-[2rem] border border-white/50 shadow-sm">
        <h2 className="text-gray-900 font-bold mb-6 tracking-tight">Add to Home Screen</h2>

        <div className="space-y-8 text-left">
          <div>
            <h3 className="text-[11px] font-bold text-blue-600/70 uppercase tracking-widest mb-2.5">Safari (iOS)</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Tap the <b>Share</b> button <svg className="inline w-4 h-4 mb-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-4 4m4-4l4 4m-7 6H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-4" /></svg> in the bottom bar, scroll down and select <b>"Add to Home Screen"</b>.
            </p>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-amber-600/70 uppercase tracking-widest mb-2.5">Chrome (Android/Desktop)</h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                <b>On Android:</b> Tap <b>More</b> <svg className="inline w-4 h-4 mb-1 text-amber-600" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" /></svg> → <b>"Add to Home Screen"</b>. If not visible, look for <b>"Install app"</b>.
              </p>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/50">
                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">On Desktop:</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Tap <b>More</b> → <b>"Cast, Save, and Share"</b> → <b>"Install TaskPlanner"</b>.
                  <span className="block mt-1 text-[10px] text-amber-600/60 font-medium italic">Note: This installs TaskPlanner as a standalone browser window.</span>
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Can't find "Add to Home Screen"?</h3>
            <p className="text-[11px] text-gray-500 leading-tight italic">
              On Android/Chrome, look for <b>"Install App"</b>. On iOS/Safari, ensure you are in <b>Safari browser</b> and not an in-app viewer (like from a link).
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-10 text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors tracking-widest uppercase block mx-auto"
        >
          [ Close Widget setup ]
        </button>
      </div>
    </div>
  );
}
