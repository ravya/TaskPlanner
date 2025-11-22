import { useState, useEffect, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';

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
}

export default function Tasks() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLDivElement>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'priority' | 'time' | 'deadline' | 'date'>('priority');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'>('all');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0], // Default to today
    startTime: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    tags: '',
    isRepeating: false,
    repeatFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
    repeatEndDate: ''
  });

  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setUser(currentUser);

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
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', formData);

    if (!user) {
      console.error('No user found!');
      alert('You must be logged in to create a task');
      return;
    }

    try {
      const db = getFirestore();

      // Parse tags from comma-separated string
      const tagArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Use today's date if startDate is not set
      const taskStartDate = formData.startDate || new Date().toISOString().split('T')[0];

      const taskData = {
        title: formData.title,
        description: formData.description,
        startDate: taskStartDate,
        startTime: formData.startTime || null,
        priority: formData.priority,
        tags: tagArray,
        isRepeating: formData.isRepeating,
        repeatFrequency: formData.isRepeating ? formData.repeatFrequency : null,
        repeatEndDate: formData.isRepeating ? formData.repeatEndDate : null,
        status: 'todo',
        userId: user.uid,
        createdAt: Timestamp.now()
      };

      if (editingTask) {
        // Update existing task
        const taskRef = doc(db, 'tasks', editingTask.id);
        await updateDoc(taskRef, taskData);
        console.log('Task updated successfully');
        alert('Task updated successfully!');
      } else {
        // Create new task
        const tasksRef = collection(db, 'tasks');
        const docRef = await addDoc(tasksRef, taskData);
        console.log('Task created successfully with ID:', docRef.id);
        alert('Task created successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0], // Default to today
        startTime: '',
        priority: 'medium',
        tags: '',
        isRepeating: false,
        repeatFrequency: 'daily',
        repeatEndDate: ''
      });
      setShowAddForm(false);
      setEditingTask(null);

      // Reload tasks
      await loadTasks(user.uid);
    } catch (error: any) {
      console.error('Error saving task:', error);
      alert(`Failed to save task: ${error.message}`);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      startDate: task.startDate || new Date().toISOString().split('T')[0], // Default to today if not set
      startTime: task.startTime || '',
      priority: task.priority,
      tags: task.tags ? task.tags.join(', ') : '',
      isRepeating: task.isRepeating || false,
      repeatFrequency: task.repeatFrequency || 'daily',
      repeatEndDate: task.repeatEndDate || ''
    });
    setShowAddForm(true);

    // Scroll to form smoothly after a brief delay to allow React to render
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

      if (user) {
        loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      alert('Failed to update task');
    }
  };


  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const db = getFirestore();
      const taskRef = doc(db, 'tasks', taskId);
      await deleteDoc(taskRef);

      // Reload tasks
      if (user) {
        loadTasks(user.uid);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
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

  const getPriorityValue = (priority: string): number => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const getFilteredAndSortedTasks = (): Task[] => {
    // First, filter by status
    let filteredTasks = [...tasks];

    if (statusFilter === 'active') {
      filteredTasks = filteredTasks.filter(t => t.status !== 'completed' && !t.completed);
    } else if (statusFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t => t.status === 'completed' || t.completed);
    }

    // Separate completed and active tasks
    const completedTasks = filteredTasks.filter(t => t.status === 'completed' || t.completed);
    const activeTasks = filteredTasks.filter(t => t.status !== 'completed' && !t.completed);

    // Sort active tasks based on selected sort option
    let sortedActiveTasks: Task[] = [];

    switch (sortBy) {
      case 'priority':
        sortedActiveTasks = activeTasks.sort((a, b) => getPriorityValue(b.priority) - getPriorityValue(a.priority));
        break;

      case 'time':
        sortedActiveTasks = activeTasks.sort((a, b) => {
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
        break;

      case 'deadline':
        sortedActiveTasks = activeTasks.sort((a, b) => {
          // Tasks with dates come first, sorted by earliest date
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1; // Tasks without dates go to end
          if (!b.startDate) return -1;

          return a.startDate.localeCompare(b.startDate); // Nearest date first
        });
        break;

      case 'date':
        sortedActiveTasks = activeTasks.sort((a, b) => {
          // Sort by date (ascending - earliest first)
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return 1; // Tasks without dates go to end
          if (!b.startDate) return -1;

          return a.startDate.localeCompare(b.startDate);
        });
        break;

      default:
        sortedActiveTasks = activeTasks;
    }

    // Sort completed tasks by completion date (most recent first) or by same criteria
    const sortedCompletedTasks = completedTasks.sort((a, b) => {
      // If both have completion dates, sort by most recent
      const aCompleted = (a as any).completedAt;
      const bCompleted = (b as any).completedAt;

      if (aCompleted && bCompleted) {
        return new Date(bCompleted).getTime() - new Date(aCompleted).getTime();
      }

      // Otherwise sort by priority
      return getPriorityValue(b.priority) - getPriorityValue(a.priority);
    });

    // Return active tasks first, then completed tasks
    return [...sortedActiveTasks, ...sortedCompletedTasks];
  };

  const sortedTasks = getFilteredAndSortedTasks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">
                ← Back to Dashboard
              </Link>
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
        {/* Add Task Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setEditingTask(null);
              setFormData({
                title: '',
                description: '',
                startDate: '',
                startTime: '',
                priority: 'medium',
                tags: '',
                isRepeating: false,
                repeatFrequency: 'daily',
                repeatEndDate: ''
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            {showAddForm ? '✕ Cancel' : '+ Add New Task'}
          </button>
        </div>

        {/* Add/Edit Task Form */}
        {showAddForm && (
          <div ref={formRef} className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task description"
                />
              </div>

              {/* Start Date and Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional time"
                    />
                    <p className="text-xs text-gray-500 mt-1">Time is optional</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="work, urgent, meeting"
                  />
                </div>
              </div>

              {/* Repeating Task Section */}
              <div className="border-t pt-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="isRepeating"
                    checked={formData.isRepeating}
                    onChange={(e) => setFormData({ ...formData, isRepeating: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isRepeating" className="ml-2 block text-sm font-medium text-gray-700">
                    🔄 Make this a repeating task
                  </label>
                </div>

                {formData.isRepeating && (
                  <div className="ml-6 space-y-3 bg-blue-50 p-4 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat Frequency
                        </label>
                        <select
                          value={formData.repeatFrequency}
                          onChange={(e) => setFormData({ ...formData, repeatFrequency: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repeat Until (End Date)
                        </label>
                        <input
                          type="date"
                          value={formData.repeatEndDate}
                          onChange={(e) => setFormData({ ...formData, repeatEndDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      This task will repeat {formData.repeatFrequency}
                      {formData.repeatEndDate && ` until ${new Date(formData.repeatEndDate).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingTask(null);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Your Tasks ({sortedTasks.length})</h2>

            {/* Status Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 font-medium text-sm ${
                  statusFilter === 'all'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All ({tasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 font-medium text-sm ${
                  statusFilter === 'active'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Active ({tasks.filter(t => t.status !== 'completed' && !t.completed).length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 font-medium text-sm ${
                  statusFilter === 'completed'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Completed ({tasks.filter(t => t.status === 'completed' || t.completed).length})
              </button>
            </div>

            {/* Filters and Sort */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Date:</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="thisMonth">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customDateStart}
                    onChange={(e) => setCustomDateStart(e.target.value)}
                    placeholder="Start Date"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customDateEnd}
                    onChange={(e) => setCustomDateEnd(e.target.value)}
                    placeholder="End Date"
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'priority' | 'time' | 'deadline' | 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="priority">Priority (High to Low)</option>
                  <option value="date">Date (Earliest First)</option>
                  <option value="time">Date & Time</option>
                  <option value="deadline">Deadline (Nearest First)</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks yet. Click "Add New Task" to create one!
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks match the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedTasks.map((task) => (
                <div key={task.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => handleToggleComplete(task)}
                    className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                  />

                  {/* Task Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-base font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.isRepeating && (
                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800">
                          🔄 {task.repeatFrequency}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className={`text-sm mb-1 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-1">
                      {task.startDate && (
                        <span>
                          📅 {formatDateTime(task.startDate, task.startTime)}
                        </span>
                      )}
                      {task.isRepeating && task.repeatEndDate && (
                        <span>
                          🔚 Until: {new Date(task.repeatEndDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {task.tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-800 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
