import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  deleteDoc,
  query,
  where,
  Timestamp,
  deleteField,
  addDoc,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { useSearchParams } from 'react-router-dom';
import { format, isYesterday } from 'date-fns';
import { clsx } from 'clsx';
import AddTaskInline from '../components/AddTaskInline';
import { useUIStore } from '../store/slices/uiSlice';

type DateFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom' | 'upcoming' | 'recurring' | 'completed' | 'trash' | 'backlog';
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
  completedAt?: any;
}

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { startOfWeek } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [user, setUser] = useState<any>(null);
  const [statusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    (searchParams.get('filter') as DateFilter) || 'all'
  );
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'personal' | 'professional'>(
    () => {
      return (localStorage.getItem('taskModeFilter') as any) || 'all';
    });

  // Project state - keep selectedProjectId for task filtering
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'today', 'thisWeek', 'thisMonth', 'custom', 'upcoming', 'recurring', 'completed', 'trash', 'backlog'].includes(filterParam)) {
      setDateFilter(filterParam as any);
    }
  }, [searchParams]);


  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setUser(currentUser);

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

  const loadTasks = async (userId: string) => {
    setLoading(true);
    try {
      const db = getFirestore();
      const tasksRef = collection(db, 'tasks');
      const q = query(tasksRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);

      const today = format(new Date(), 'yyyy-MM-dd');

      const loadedTasks: Task[] = [];
      querySnapshot.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() } as Task;

        // Only skip if it's recurring and past incomplete (per requirements)
        // But keep deleted tasks so they can be shown in Trash
        if (task.isRepeating && task.status !== 'completed' && !task.completed) {
          const taskDate = task.startDate?.split('T')[0];
          if (taskDate && taskDate < today) {
            return; // Skip past incomplete recurring tasks
          }
        }

        loadedTasks.push(task);
      });

      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit param from URL (e.g. from Dashboard)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && tasks.length > 0) {
      const taskToEdit = tasks.find(t => t.id === editId);
      if (taskToEdit) {
        handleEditTask(taskToEdit);
        // Clear param without reload
        window.history.replaceState({}, '', window.location.pathname + (window.location.search.replace(/edit=[^&]*&?/, '').replace(/\?$/, '')));
      }
    }
  }, [searchParams, tasks]);

  const handleAddTask = async (taskData: any) => {
    if (!user) {
      alert('You must be logged in to create a task');
      return;
    }

    try {
      const db = getFirestore();

      const firestoreData = {
        ...taskData,
        userId: user.uid,
        createdAt: Timestamp.now(),
        status: editingTask ? editingTask.status : 'todo',
        subtasks: taskData.subtasks || null,
        projectId: taskData.projectId || selectedProjectId || null,
        deadlineDate: taskData.deadlineDate || null
      };

      if (editingTask) {
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, firestoreData);
      } else {
        await addDoc(collection(db, 'tasks'), firestoreData);
      }

      setShowAddForm(false);
      setEditingTask(null);
      await loadTasks(user.uid);
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message}`);
    }
  };


  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowAddForm(true);
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

      if (user) {
        loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task');
    }
  };


  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; taskId: string | null }>({
    show: false,
    taskId: null
  });

  // ... (existing useEffect)

  // ... (existing loadTasks)

  // ... (existing handleAddTask)

  // ... (existing handleEditTask)

  // ... (existing getNextOccurrenceDate)

  // ... (existing shouldCreateNextOccurrence)

  // ... (existing handleToggleComplete)

  const confirmDeleteTask = (taskId: string) => {
    setDeleteConfirmation({ show: true, taskId });
  };

  const handleDeleteTask = async () => {
    if (!deleteConfirmation.taskId) return;

    const taskId = deleteConfirmation.taskId;
    const taskToDelete = tasks.find(t => t.id === taskId);
    setDeleteConfirmation({ show: false, taskId: null });

    try {
      const db = getFirestore();

      if (taskToDelete?.isRepeating && taskToDelete.startDate) {
        // Find all occurrences of this recurring task
        const allOccurrences = tasks
          .filter(t =>
            t.isRepeating &&
            t.title === taskToDelete.title &&
            t.repeatFrequency === taskToDelete.repeatFrequency &&
            t.userId === taskToDelete.userId
          )
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        const parentTask = allOccurrences[0];
        const isParentTask = parentTask.id === taskId;
        const occurrenceDate = taskToDelete.startDate.split('T')[0];

        if (isParentTask) {
          // Soft delete the parent task - keep it in DB but mark as deleted
          const parentRef = doc(db, 'tasks', taskId);
          const deletedOccurrences = parentTask.deletedOccurrences || [];

          await updateDoc(parentRef, {
            isDeleted: true,
            deletedOccurrences: [...deletedOccurrences, occurrenceDate]
          });
        } else {
          // Update parent's deletedOccurrences and hard delete this occurrence
          const parentRef = doc(db, 'tasks', parentTask.id);
          const deletedOccurrences = parentTask.deletedOccurrences || [];

          if (!deletedOccurrences.includes(occurrenceDate)) {
            await updateDoc(parentRef, {
              deletedOccurrences: [...deletedOccurrences, occurrenceDate]
            });
          }

          // Hard delete the occurrence
          const taskRef = doc(db, 'tasks', taskId);
          await deleteDoc(taskRef);
        }
      } else {
        // Mark as deleted (soft delete)
        const taskRef = doc(db, 'tasks', taskId);
        await updateDoc(taskRef, {
          isDeleted: true,
          deletedAt: Timestamp.now()
        });
      }

      // Reload tasks
      if (user) {
        loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    }
  };

  const handleRestoreTask = async (taskId: string) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);

      await updateDoc(taskRef, {
        isDeleted: false,
        deletedAt: deleteField()
      });

      if (user) loadTasks(user.uid);
    } catch (error) {
      console.error('Error restoring task:', error);
      alert('Failed to restore task');
    }
  };

  const handleMoveToToday = async (taskId: string) => {
    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');

      await updateDoc(taskRef, {
        startDate: today,
        updatedAt: new Date()
      });

      if (user) loadTasks(user.uid);
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

      if (user) loadTasks(user.uid);
    } catch (error) {
      console.error('Error ignoring task:', error);
      alert('Failed to ignore task');
    }
  };

  const handlePermanentDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task forever?')) return;

    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);

      await deleteDoc(taskRef);

      if (user) loadTasks(user.uid);
    } catch (error) {
      console.error('Error deleting task permanently:', error);
      alert('Failed to delete task permanently');
    }
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return '';
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString();
    if (time) {
      return `${dateStr} ${time}`;
    }
    return dateStr;
  };

  const TaskItem = ({ task }: { task: Task }) => {
    const isTodayTask = task.startDate ? task.startDate.split('T')[0] === format(new Date(), 'yyyy-MM-dd') : false;

    return (
      <div className="py-1.5 hover:bg-gray-50 flex flex-col sm:flex-row items-center gap-3 w-full group transition-colors px-4 border-b border-gray-50 last:border-0 min-h-[48px]">
        <div className="flex items-center gap-3 w-full">
          {task.status === 'completed' ? (
            <div className="h-4 w-4 min-w-[16px] flex items-center justify-center text-green-500 bg-green-50 rounded-full">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <input
              type="checkbox"
              checked={false}
              onChange={() => handleToggleComplete(task)}
              className="h-4 w-4 min-w-[16px] text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
          )}

          {/* Mode Badge - Left of Title */}
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
              <h3 className={clsx(
                "text-sm sm:text-base font-medium break-words truncate",
                task.status === 'completed' ? "text-gray-400 line-through" : "text-gray-900"
              )}>
                {task.title}
              </h3>

              {/* Tags - Immediately after Title */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 shrink-0">
                  {task.tags.map((tag, index) => (
                    <span key={index} className="px-1.5 py-0.25 border border-blue-200 text-blue-500 text-[9px] rounded-full font-medium whitespace-nowrap bg-blue-50/10">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {task.isRepeating && (
                <span className="text-gray-400 shrink-0" title={`Repeats ${task.repeatFrequency}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </span>
              )}

              {task.status === 'completed' && task.completedAt && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] sm:text-xs text-gray-400 font-medium ml-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(task.completedAt instanceof Date ? task.completedAt : (task.completedAt as any).toDate ? (task.completedAt as any).toDate() : new Date(task.completedAt), 'MMM d')}
                </span>
              )}
            </div>

            {(task.description || (task.startDate && task.status !== 'completed' && !isTodayTask)) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                {task.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 max-w-sm">
                    {task.description}
                  </p>
                )}
                {task.startDate && task.status !== 'completed' && !isTodayTask && (
                  <span className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap">
                    {formatDateTime(task.startDate, task.startTime)}
                  </span>
                )}
                {isTodayTask && task.startTime && (
                  <span className="text-[10px] sm:text-xs text-blue-500 font-medium whitespace-nowrap">
                    {task.startTime}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - always visible in trash, hover otherwise */}
        <div className={clsx(
          "flex items-center gap-2 transition-opacity ml-auto",
          dateFilter !== 'trash' && "sm:opacity-0 group-hover:opacity-100"
        )}>
          {dateFilter === 'trash' ? (
            <>
              <button
                onClick={() => handleRestoreTask(task.id)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                title="Restore"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => handlePermanentDelete(task.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Delete Permanently"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          ) : (
            <>
              {(dateFilter === 'backlog' || (task.startDate && task.startDate.split('T')[0] < format(new Date(), 'yyyy-MM-dd') && !task.completed)) && (
                <button
                  onClick={() => handleMoveToToday(task.id)}
                  className="p-1 px-2 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded border border-blue-200 uppercase"
                  title="Move to Today"
                >
                  Move to Today
                </button>
              )}
              {dateFilter === 'backlog' && (
                <button
                  onClick={() => handleIgnoreTask(task.id)}
                  className="p-1 px-2 text-[10px] font-bold text-gray-500 hover:bg-gray-50 rounded border border-gray-200 uppercase"
                  title="Ignore"
                >
                  Ignore
                </button>
              )}
              <button
                onClick={() => handleEditTask(task)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => confirmDeleteTask(task.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 2 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };



  const getFilteredAndSortedTasks = (): Task[] => {
    // First, filter by status
    let filteredTasks = [...tasks];

    if (dateFilter === 'trash') {
      filteredTasks = filteredTasks.filter(t => t.isDeleted === true);
    } else if (dateFilter === 'recurring') {
      filteredTasks = filteredTasks.filter(t => t.isRepeating === true && !t.isDeleted);
    } else if (statusFilter === 'active' || dateFilter === 'today' || dateFilter === 'thisWeek' || dateFilter === 'upcoming') {
      filteredTasks = filteredTasks.filter(t => t.status !== 'completed' && !t.completed && !t.isDeleted);
    } else if (statusFilter === 'completed' || dateFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t => (t.status === 'completed' || t.completed) && !t.isDeleted);
    } else if (dateFilter === 'backlog') {
      filteredTasks = filteredTasks.filter(t => !t.startDate && t.status !== 'completed' && !t.completed && !t.isDeleted);
    } else {
      // Default: hide deleted
      filteredTasks = filteredTasks.filter(t => !t.isDeleted);
    }

    // Filter by mode
    if (modeFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const taskMode = task.mode || 'personal'; // default to personal for backward compatibility
        return taskMode === modeFilter;
      });
    }

    // Filter by project
    if (selectedProjectId) {
      filteredTasks = filteredTasks.filter(task =>
        (task as any).projectId === selectedProjectId
      );
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const today = format(new Date(), 'yyyy-MM-dd');

      filteredTasks = filteredTasks.filter(task => {
        if (dateFilter === 'backlog') return !task.startDate;
        if (!task.startDate) return false;
        const taskDate = task.startDate.split('T')[0];

        if (dateFilter === 'today') {
          return taskDate === today;
        } else if (dateFilter === 'thisWeek') {
          const taskDateObj = new Date(taskDate);
          const todayObj = new Date(today);
          const currentDay = todayObj.getDay(); // 0 is Sunday, 1 is Monday...

          const dayMap: Record<string, number> = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
          };

          const startDayNum = dayMap[startOfWeek] || 0;
          const diff = (currentDay < startDayNum) ? (7 - startDayNum + currentDay) : (currentDay - startDayNum);

          const firstDayOfWeek = new Date(todayObj);
          firstDayOfWeek.setDate(todayObj.getDate() - diff);
          firstDayOfWeek.setHours(0, 0, 0, 0);

          const lastDayOfWeek = new Date(firstDayOfWeek);
          lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
          lastDayOfWeek.setHours(23, 59, 59, 999);

          return taskDateObj >= firstDayOfWeek && taskDateObj <= lastDayOfWeek;
        } else if (dateFilter === 'thisMonth') {
          const taskDateObj = new Date(taskDate);
          const todayObj = new Date(today);
          return taskDateObj.getMonth() === todayObj.getMonth() && taskDateObj.getFullYear() === todayObj.getFullYear();
        } else if (dateFilter === 'upcoming') {
          // Show all future tasks EXCLUDING today
          return taskDate > today;
        }
        else if (dateFilter === 'recurring') {
          if (customDateStart && taskDate < customDateStart) return false;
          if (customDateEnd && taskDate > customDateEnd) return false;
          return true;
        }
        return true;
      });
    }

    // Separate completed and active tasks
    const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.completed);
    const activeTasks = filteredTasks.filter(t => t.status !== 'completed' && !t.completed);

    // Sort active tasks by time (which includes date)
    const sortedActiveTasks = activeTasks.sort((a, b) => {
      if (!a.startDate && !b.startDate) return 0;
      if (!a.startDate) return 1;
      if (!b.startDate) return -1;

      const dateCompare = a.startDate.localeCompare(b.startDate);
      if (dateCompare !== 0) return dateCompare;

      // If same date, sort by time
      const timeA = a.startTime || '23:59';
      const timeB = b.startTime || '23:59';
      return timeA.localeCompare(timeB);
    });

    // Sort completed tasks by completion date (most recent first) or by same criteria
    const sortedCompletedTasks = completedTasks.sort((a, b) => {
      // If both have completion dates, sort by most recent
      const aCompleted = (a as any).completedAt;
      const bCompleted = (b as any).completedAt;

      if (aCompleted && bCompleted) {
        return new Date(bCompleted).getTime() - new Date(aCompleted).getTime();
      }

      // Otherwise keep current order
      return 0;
    });

    // Return active tasks first, then completed tasks
    return [...sortedActiveTasks, ...sortedCompletedTasks];
  };

  const sortedTasks = getFilteredAndSortedTasks();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
              {dateFilter === 'today' ? (
                <>
                  <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Today
                </>
              ) : dateFilter === 'completed' ? (
                <>
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed
                </>
              ) : dateFilter === 'recurring' ? (
                <>
                  <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recurring
                </>
              ) : dateFilter === 'backlog' ? (
                <>
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Backlog ({sortedTasks.length})
                </>
              ) : dateFilter === 'trash' ? (
                <>
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 2 0 00-1 1v3M4 7h16" />
                  </svg>
                  Trash
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {dateFilter === 'thisWeek' ? 'This Week' : dateFilter === 'thisMonth' ? 'This Month' : 'Upcoming'} ({sortedTasks.length})
                </>
              )}
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
                {(['all', 'personal', 'professional'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setModeFilter(mode);
                      localStorage.setItem('taskModeFilter', mode);
                    }}
                    className={clsx(
                      'px-4 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap',
                      modeFilter === mode
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    {mode === 'professional' ? 'Work' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}

                {dateFilter === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tasks...</div>
            ) : dateFilter === 'upcoming' ? (
              /* Vertical Calendar Layout for Upcoming View */
              <div className="divide-y divide-gray-100">
                {(() => {
                  const days = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() + i);
                    return d.toISOString().split('T')[0];
                  });

                  const todayStr = format(new Date(), 'yyyy-MM-dd');

                  return days.map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const dayNum = dateObj.getDate();
                    const isToday = dateStr === todayStr;
                    const dayName = isToday ? 'Today' : dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                    const tasksForDay = sortedTasks.filter(t => t.startDate?.split('T')[0] === dateStr);

                    return (
                      <div key={dateStr} className="py-4">
                        <div className="flex items-baseline gap-3 px-4 mb-3">
                          <span className="text-3xl font-bold text-gray-900">{dayNum}</span>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">{dayName}</span>
                            <span className="text-xs text-gray-400">{dateObj.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {tasksForDay.map(task => (
                            <TaskItem key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : dateFilter === 'completed' ? (
              /* Logbook Layout for Completed View */
              <div className="divide-y divide-gray-100">
                {(() => {
                  const groups: { [key: string]: Task[] } = {};
                  const today = new Date();
                  const todayStr = format(today, 'yyyy-MM-dd');

                  sortedTasks.forEach(task => {
                    let dateStr = todayStr;
                    if (task.completedAt) {
                      const completedDate = (task.completedAt as any).toDate ? (task.completedAt as any).toDate() : new Date(task.completedAt as any);
                      dateStr = format(completedDate, 'yyyy-MM-dd');
                    } else if (task.startDate) {
                      dateStr = task.startDate.split('T')[0];
                    }

                    let groupLabel = '';
                    const d = new Date(dateStr + 'T00:00:00');

                    if (dateStr === todayStr) {
                      groupLabel = 'Today';
                    } else if (isYesterday(d)) {
                      groupLabel = 'Yesterday';
                    } else {
                      groupLabel = format(d, 'MMMM yyyy');
                    }

                    if (!groups[groupLabel]) groups[groupLabel] = [];
                    groups[groupLabel].push(task);
                  });

                  const order = ['Today', 'Yesterday'];

                  return Object.entries(groups)
                    .sort(([a], [b]) => {
                      const idxA = order.indexOf(a);
                      const idxB = order.indexOf(b);
                      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                      if (idxA !== -1) return -1;
                      if (idxB !== -1) return 1;
                      return b.localeCompare(a);
                    })
                    .map(([label, tasks]) => (
                      <div key={label} className="py-2 sm:py-4">
                        <h3 className="px-4 text-lg font-bold text-gray-900 mb-2">{label}</h3>
                        <div className="divide-y divide-gray-50">
                          {tasks.map(task => (
                            <TaskItem key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    ));
                })()}
              </div>
            ) : sortedTasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No tasks match the selected filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {sortedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirmation({ show: false, taskId: null })}>
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
            <p className="text-gray-600 mb-6 font-medium">
              Are you sure you want to delete this task?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmation({ show: false, taskId: null })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button */}
      {!showAddForm && !showQuickAdd && (
        <button
          onClick={() => setShowAddForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center z-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Add Task / Edit Task Overlay */}
      {(showAddForm || showQuickAdd) && (
        <AddTaskInline
          isOpen={showAddForm || showQuickAdd}
          onSubmit={handleAddTask}
          onCancel={() => {
            setShowAddForm(false);
            setShowQuickAdd(false);
            setEditingTask(null);
          }}
          editingTask={editingTask}
          userId={user?.uid}
          modeFilter={modeFilter === 'all' ? undefined : modeFilter}
        />
      )}
    </div>
  );
};
