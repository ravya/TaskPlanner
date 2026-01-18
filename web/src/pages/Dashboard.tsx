import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import AddTaskInline from '../components/AddTaskInline';
import ModeSlider from '../components/ModeSlider';
import { useUIStore } from '../store/slices/uiSlice';

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
  completed?: boolean;
  deletedOccurrences?: string[]; // Array of YYYY-MM-DD dates that were explicitly deleted
  isDeleted?: boolean; // Soft delete flag for parent recurring tasks
  mode?: 'personal' | 'professional'; // Task mode
}

export default function Dashboard() {
  const { defaultMode } = useUIStore();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showAllTodayTasks, setShowAllTodayTasks] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [modeFilter, setModeFilter] = useState<'all' | 'personal' | 'professional'>(() => {
    return (localStorage.getItem('taskModeFilter') as any) || defaultMode || 'all';
  });

  // Project state - keep selectedProjectId for task filtering
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setUser(currentUser);

    // Check if we should show email verification banner
    const isGoogleUser = currentUser?.providerData.some(p => p.providerId === 'google.com');

    if (currentUser && !currentUser.emailVerified && !isGoogleUser) {
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

  // Reset project selection when mode changes to 'all'
  useEffect(() => {
    if (modeFilter === 'all') {
      setSelectedProjectId(undefined);
    }
  }, [modeFilter]);

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

  const generateMissingRepeatingOccurrences = async (tasks: Task[], userId: string) => {
    const db = getFirestore();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const createdTasks: string[] = [];

    for (const task of tasks) {
      // Only process the original repeating task (not occurrences)
      // Original tasks are those that match the original startDate
      if (!task.isRepeating || !task.repeatFrequency || !task.startDate) continue;

      // Skip if this is already an occurrence (check if there's a task with earlier date and same title)
      const isOriginalTask = !tasks.some(t =>
        t.id !== task.id &&
        t.isRepeating === task.isRepeating &&
        t.repeatFrequency === task.repeatFrequency &&
        t.title === task.title &&
        t.userId === task.userId &&
        t.startDate < task.startDate
      );

      if (!isOriginalTask) continue; // Skip occurrences, only process originals

      // Check if we should create occurrences for this repeating task
      if (!shouldCreateNextOccurrence(task)) continue;

      const originalDate = new Date(task.startDate);
      const todayDate = new Date(today);

      // Only generate occurrence for TODAY if it doesn't exist
      // Don't carry forward missed occurrences from past dates
      const occurrenceDate = today;

      // Skip if today is before the original start date
      if (todayDate < originalDate) continue;

      // Check if occurrence already exists in current tasks list
      const existingTask = tasks.find(t =>
        t.title === task.title &&
        t.startDate === occurrenceDate &&
        t.userId === task.userId &&
        t.isRepeating === task.isRepeating &&
        t.repeatFrequency === task.repeatFrequency
      );

      // Also check database directly to avoid duplicates
      if (!existingTask) {
        const checkQuery = query(
          collection(db, 'tasks'),
          where('userId', '==', userId),
          where('title', '==', task.title),
          where('startDate', '==', occurrenceDate),
          where('isRepeating', '==', true),
          where('repeatFrequency', '==', task.repeatFrequency)
        );
        const checkSnapshot = await getDocs(checkQuery);

        if (checkSnapshot.empty) {
          // Check if this occurrence was explicitly deleted
          const deletedOccurrences = task.deletedOccurrences || [];
          if (deletedOccurrences.includes(occurrenceDate)) {
            // Skip this occurrence - it was explicitly deleted by user
            continue;
          }

          // Check if we're within the repeat end date
          if (task.repeatEndDate) {
            const endDate = new Date(task.repeatEndDate);
            if (todayDate > endDate) continue;
          }

          // Create today's occurrence
          const nextTaskData = {
            title: task.title,
            description: task.description,
            startDate: occurrenceDate,
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

          try {
            await addDoc(collection(db, 'tasks'), nextTaskData);
            createdTasks.push(occurrenceDate);
          } catch (error) {
            console.error(`Error creating occurrence for ${occurrenceDate}:`, error);
          }
        }
      }
    }

    return createdTasks.length > 0;
  };

  const loadTasks = async (userId: string) => {
    setLoading(true);
    try {
      const db = getFirestore();
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const allTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        allTasks.push({ id: doc.id, ...doc.data() } as Task);
      });

      // Generate missing repeating task occurrences (using all tasks including soft-deleted)
      const hasNewOccurrences = await generateMissingRepeatingOccurrences(allTasks, userId);

      // Reload tasks if new occurrences were created
      if (hasNewOccurrences) {
        const updatedSnapshot = await getDocs(q);
        allTasks.length = 0; // Clear array
        updatedSnapshot.forEach((doc) => {
          allTasks.push({ id: doc.id, ...doc.data() } as Task);
        });
      }

      // Filter out soft-deleted tasks for display
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const visibleTasks = allTasks.filter(t => {
        // Filter out soft-deleted tasks
        if (t.isDeleted) return false;

        // For recurring tasks, hide past occurrences (both completed and incomplete)
        // This prevents showing the original parent task when we have today's occurrence
        if (t.isRepeating) {
          const taskDate = t.startDate?.split('T')[0];
          if (taskDate && taskDate < today) {
            // Only show past recurring tasks if they're completed
            // This allows viewing completed history but hides incomplete past tasks
            if (t.status !== 'completed' && !t.completed) {
              return false;
            }
          }
        }

        return true;
      });

      setTasks(visibleTasks);

      // Filter today's tasks - include repeating tasks even if previous day wasn't completed
      const todayTasks = visibleTasks.filter(task => {
        if (!task.startDate) return false;
        // Ensure we're comparing dates correctly (YYYY-MM-DD format)
        const taskDate = task.startDate.split('T')[0]; // Handle any time component
        return taskDate === today;
      });
      setTodaysTasks(todayTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleMoveToToday = async (taskId: string) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      await updateDoc(taskRef, {
        startDate: today,
        updatedAt: new Date()
      });

      // Reload tasks
      if (user) {
        await loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error moving task to today:', error);
      alert('Failed to move task to today');
    }
  };

  const handleIgnoreTask = async (taskId: string) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);

      await updateDoc(taskRef, {
        ignored: true,
        updatedAt: new Date()
      });

      // Reload tasks
      if (user) {
        await loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error ignoring task:', error);
      alert('Failed to ignore task');
    }
  };

  const handleCreateMissingOccurrence = async (task: Task) => {
    try {
      const db = getFirestore();
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const taskData = {
        title: task.title,
        description: task.description,
        startDate: today,
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

      await addDoc(collection(db, 'tasks'), taskData);

      // Reload tasks
      if (user) {
        await loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error creating missing occurrence:', error);
      alert('Failed to create task');
    }
  };

  const handleAddTaskInline = async (taskData: {
    title: string;
    description: string;
    startDate: string;
    startTime: string;
    priority: 'low' | 'medium' | 'high';
    tags: string[];
    isRepeating: boolean;
    repeatFrequency: 'daily' | 'weekly' | 'monthly';
    repeatEndDate: string;
    mode: 'personal' | 'professional';
    subtasks?: { id: string; title: string; completed: boolean }[] | null;
    projectId?: string | null;
    deadlineDate?: string | null;
  }) => {
    if (!user) {
      alert('You must be logged in to create a task');
      return;
    }

    try {
      const db = getFirestore();

      const firestoreData: any = {
        title: taskData.title,
        description: taskData.description,
        startDate: taskData.startDate,
        startTime: taskData.startTime || null,
        priority: taskData.priority,
        tags: taskData.tags,
        isRepeating: taskData.isRepeating,
        repeatFrequency: taskData.isRepeating ? taskData.repeatFrequency : null,
        repeatEndDate: taskData.isRepeating ? taskData.repeatEndDate : null,
        status: 'todo',
        userId: user.uid,
        createdAt: Timestamp.now(),
        mode: taskData.mode || 'personal',
        subtasks: taskData.subtasks || []
      };

      // Add projectId if provided, or use currently selected project
      if (taskData.projectId) {
        firestoreData.projectId = taskData.projectId;
      } else if (selectedProjectId) {
        firestoreData.projectId = selectedProjectId;
      }

      await addDoc(collection(db, 'tasks'), firestoreData);
      setShowAddForm(false);

      // Reload tasks
      await loadTasks(user.uid);
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message}`);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', task.id);
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';

      await updateDoc(taskRef, {
        status: newStatus,
        completed: newStatus === 'completed',
        completedAt: newStatus === 'completed' ? new Date() : null,
        updatedAt: new Date()
      });

      // If task is being marked as complete and is repeating, create next occurrence
      if (newStatus === 'completed' && shouldCreateNextOccurrence(task)) {
        const nextDate = getNextOccurrenceDate(task.startDate, task.repeatFrequency!);
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
        await loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task');
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.completed).length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && !t.completed && t.status !== 'in_progress').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get pending tasks from past days (not today, not completed, not ignored)
  // This includes both regular tasks and missing repeating task occurrences
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const pastPendingTasks: Task[] = [];

  // First, add regular tasks from past days
  tasks.forEach(t => {
    if (t.status === 'completed' || t.completed) return;
    if ((t as any).ignored) return;
    if (!t.startDate) return;

    // Exclude repetitive tasks from past pending list as requested
    if (t.isRepeating) return;

    const taskDate = t.startDate.split('T')[0];
    if (taskDate < today) {
      pastPendingTasks.push(t);
    }
  });

  // Note: Logic for finding missing repeating task occurrences has been removed
  // as per requirement to not show past pending repetitive tasks.




  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating Add Task Button */}
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
            title="Add New Task"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}

        {/* Task Creation Form - New Compact Component */}
        <AddTaskInline
          isOpen={showAddForm}
          onSubmit={handleAddTaskInline}
          onCancel={() => setShowAddForm(false)}
        />

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
                <div className="mt-2">
                  <button
                    onClick={() => {
                      user?.reload().then(() => {
                        window.location.reload();
                      });
                    }}
                    className="text-xs font-semibold text-amber-800 hover:text-amber-900 underline"
                  >
                    I've verified my email - Click to Refresh
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowEmailVerification(false)}
                className="ml-auto flex-shrink-0 text-amber-400 hover:text-amber-600"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Task Statistics - 3 Main Tiles */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Today's Tasks */}
          <Link
            to="/tasks?filter=today"
            className="bg-white rounded-lg shadow-lg p-6 block hover:shadow-xl transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Today's Tasks</h3>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-600 mb-2">{todaysTasks.length}</div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {todaysTasks.filter(t => t.status === 'completed').length} completed
              </p>
              <span className="text-xs text-purple-600 font-medium">
                View All →
              </span>
            </div>
          </Link>

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
          <Link
            to="/analytics"
            className="bg-white rounded-lg shadow-lg p-6 block hover:shadow-xl transition-shadow cursor-pointer"
          >
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
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                {completedTasks} of {totalTasks} tasks
              </p>
              <span className="text-xs text-green-600 font-medium">
                View Analytics →
              </span>
            </div>
          </Link>
        </div>

        {/* Pending Tasks from Past Days */}
        {pastPendingTasks.length > 0 && (
          <div className="mb-10 bg-orange-50/50 rounded-lg border border-orange-100 overflow-hidden">
            <h2 className="text-base font-semibold text-orange-900 flex items-center gap-2 p-4 bg-orange-100/30">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Tasks from Past Days
              <span className="ml-2 px-2 py-0.5 bg-orange-200/50 text-orange-800 text-[10px] rounded-full font-bold">
                {pastPendingTasks.length}
              </span>
            </h2>

            <div className="divide-y divide-orange-100/50">
              {pastPendingTasks.map((task) => (
                <div key={task.id} className="py-2 hover:bg-orange-100/30 flex items-center justify-between gap-3 group px-4 min-h-[48px] transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={clsx(
                      "px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0",
                      (task.mode || 'personal') === 'personal'
                        ? 'border-blue-200 text-blue-600 bg-blue-50/30'
                        : 'border-orange-200 text-orange-600 bg-orange-50/30'
                    )}>
                      {(task.mode || 'personal') === 'personal' ? 'P' : 'W'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </h3>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {task.tags.map((tag, idx) => (
                              <span key={idx} className="px-1.5 py-0.25 border border-blue-200 text-blue-500 text-[9px] rounded-full font-medium whitespace-nowrap bg-blue-50/10">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-orange-600/80 font-medium">
                        Scheduled: {new Date(task.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (task.id.startsWith('missing-')) {
                          handleCreateMissingOccurrence(task);
                        } else {
                          handleMoveToToday(task.id);
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      Move to Today
                    </button>
                    {!task.id.startsWith('missing-') && (
                      <button
                        onClick={() => handleIgnoreTask(task.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 font-medium whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        title="Ignore this task"
                      >
                        Ignore
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Today's Tasks</h2>
              <Link
                to="/tasks?filter=today"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all tasks →
              </Link>
            </div>

            {/* Mode Filter Slider */}
            <div className="mb-4">
              <ModeSlider
                value={modeFilter}
                onChange={(mode) => {
                  setModeFilter(mode);
                  localStorage.setItem('taskModeFilter', mode);
                }}
                className="max-w-sm"
              />
            </div>



          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tasks...</div>
          ) : todaysTasks.length === 0 ? null : (
            <div className="divide-y divide-gray-200">
              {(() => {
                // Filter tasks by mode and project
                let filteredTasks = modeFilter === 'all'
                  ? todaysTasks
                  : todaysTasks.filter(task => (task.mode || 'personal') === modeFilter);

                // Filter status (only active tasks on dashboard)
                filteredTasks = filteredTasks.filter(task => task.status !== 'completed' && !task.completed);

                // Further filter by project if one is selected
                if (selectedProjectId) {
                  filteredTasks = filteredTasks.filter(task =>
                    (task as any).projectId === selectedProjectId
                  );
                }

                const tasksToShow = showAllTodayTasks ? filteredTasks : filteredTasks.slice(0, 5);

                return tasksToShow.map((task) => (
                  <div key={task.id} className="py-2 hover:bg-gray-50 flex items-center justify-between gap-3 group px-4 border-b border-gray-50 last:border-0 min-h-[48px] transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={task.status === 'completed' || task.completed === true}
                        onChange={() => handleToggleComplete(task)}
                        className="h-4 w-4 min-w-[16px] text-blue-600 rounded cursor-pointer"
                      />
                      <span className={clsx(
                        "px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border shrink-0",
                        (task.mode || 'personal') === 'personal'
                          ? 'border-blue-200 text-blue-600 bg-blue-50/30'
                          : 'border-orange-200 text-orange-600 bg-orange-50/30'
                      )}>
                        {(task.mode || 'personal') === 'personal' ? 'P' : 'W'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className={`text-sm font-medium truncate ${(task.status === 'completed' || task.completed === true) ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {task.title}
                          </h3>
                          {task.isRepeating && (
                            <span className="text-gray-400 flex-shrink-0" title={`Repeats ${task.repeatFrequency}`}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </span>
                          )}
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center gap-1 shrink-0">
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className="px-1.5 py-0.25 border border-blue-200 text-blue-500 text-[9px] rounded-full font-medium whitespace-nowrap bg-blue-50/10">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        {task.description && (
                          <p className={`text-[11px] mt-0.5 truncate ${(task.status === 'completed' || task.completed === true) ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.startTime && (
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          {task.startTime}
                        </span>
                      )}

                      {/* Action buttons - appear on hover */}
                      <div className="flex items-center gap-1.5 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          to={`/tasks?edit=${task.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Task"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ));
              })()}

              {todaysTasks.length > 5 && (
                <div className="p-4 text-center">
                  {!showAllTodayTasks ? (
                    <button
                      onClick={() => setShowAllTodayTasks(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View {todaysTasks.length - 5} more tasks →
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAllTodayTasks(false)}
                      className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      Show less ↑
                    </button>
                  )}
                </div>
              )}
            </div >
          )}
        </div >
      </div >
    </div >
  );
}
