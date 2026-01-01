import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, addDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverEvent, DragStartEvent, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

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
    subtasks?: Subtask[];
    position?: number;
    mode?: 'personal' | 'professional';
    isDeleted?: boolean;
    projectId?: string;
    projectName?: string; // Populated for display
}

// Sortable task item wrapper
function SortableTaskItem({ children, id }: { children: React.ReactNode; id: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

// Drop zone for nesting a task as subtask
function NestDropZone({ taskId, onNest }: { taskId: string; onNest: (taskId: string) => void }) {
    const { isOver, setNodeRef } = useDroppable({
        id: `nest-${taskId}`,
    });

    return (
        <div
            ref={setNodeRef}
            onClick={() => onNest(taskId)}
            className={`ml-6 mt-1 px-2 py-1 text-xs rounded border-2 border-dashed cursor-pointer transition-all ${isOver
                ? 'bg-purple-100 border-purple-400 text-purple-700'
                : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-purple-300'
                }`}
        >
            ↳ Drop here to make subtask
        </div>
    );
}

export default function TodayStickiesWidget() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [userId, setUserId] = useState<string | null>(null);

    // Subtask state
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
    const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // New task subtasks
    const [pendingSubtasks, setPendingSubtasks] = useState<Subtask[]>([]);
    const [addingPendingSubtask, setAddingPendingSubtask] = useState(false);
    const [pendingSubtaskTitle, setPendingSubtaskTitle] = useState('');

    // Mode filter
    const [modeFilter, setModeFilter] = useState<'all' | 'personal' | 'professional'>(() => {
        return (localStorage.getItem('widgetModeFilter') as any) || 'all';
    });

    // Drag state for subtask drop detection
    const [activeId, setActiveId] = useState<string | null>(null);
    const [_overId, setOverId] = useState<string | null>(null);

    // Multi-select state
    const [selectMode, setSelectMode] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [bulkMoveDate, setBulkMoveDate] = useState('');

    useEffect(() => {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUserId(currentUser.uid);
            loadTodaysTasks(currentUser.uid);
        }
    }, []);

    const loadTodaysTasks = async (uid: string) => {
        setLoading(true);
        try {
            const db = getFirestore();
            const tasksRef = collection(db, 'tasks');
            const q = query(tasksRef, where('userId', '==', uid));
            const querySnapshot = await getDocs(q);

            const loadedTasks: Task[] = [];
            querySnapshot.forEach((docSnap) => {
                loadedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
            });

            const today = new Date().toISOString().split('T')[0];
            const todayTasks = loadedTasks.filter(task => {
                if (task.isDeleted) return false; // Skip deleted tasks
                if (!task.startDate) return false;
                const taskDate = task.startDate.split('T')[0];
                return taskDate === today;
            });

            // Fetch project names for tasks with projectId
            const projectIds = [...new Set(todayTasks.filter(t => t.projectId).map(t => t.projectId!))] as string[];
            const projectMap: Record<string, string> = {};

            if (projectIds.length > 0) {
                // Fetch projects from user's projects subcollection
                const projectsRef = collection(db, 'users', uid, 'projects');
                const projectsSnapshot = await getDocs(projectsRef);
                projectsSnapshot.forEach((projDoc) => {
                    const data = projDoc.data();
                    if (data.projectId && data.name) {
                        projectMap[data.projectId] = data.name;
                    }
                });
            }

            // Populate projectName
            const tasksWithProjects = todayTasks.map(task => ({
                ...task,
                projectName: task.projectId ? projectMap[task.projectId] : undefined
            }));

            const sortedTasks = tasksWithProjects.sort((a, b) => {
                // Completed tasks always go to the end
                if (a.completed !== b.completed) {
                    return a.completed ? 1 : -1;
                }
                // Sort by position if available
                if (a.position !== undefined && b.position !== undefined) {
                    return a.position - b.position;
                }
                // Fallback to priority
                const priorityValue = { high: 3, medium: 2, low: 1 };
                return priorityValue[b.priority] - priorityValue[a.priority];
            });

            setTasks(sortedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleComplete = async (task: Task) => {
        try {
            const db = getFirestore();
            const taskRef = doc(db, 'tasks', task.id);

            const newCompleted = !task.completed;
            await updateDoc(taskRef, {
                status: newCompleted ? 'completed' : 'todo',
                completed: newCompleted,
                completedAt: newCompleted ? new Date() : null,
                updatedAt: new Date()
            });

            if (userId) {
                await loadTodaysTasks(userId);
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const handleToggleSubtask = async (task: Task, subtaskId: string) => {
        try {
            const db = getFirestore();
            const taskRef = doc(db, 'tasks', task.id);

            const updatedSubtasks = (task.subtasks || []).map(st =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
            );

            await updateDoc(taskRef, {
                subtasks: updatedSubtasks,
                updatedAt: new Date()
            });

            if (userId) {
                await loadTodaysTasks(userId);
            }
        } catch (error) {
            console.error('Error toggling subtask:', error);
        }
    };

    const handleAddSubtask = async (task: Task) => {
        if (!newSubtaskTitle.trim()) return;

        try {
            const db = getFirestore();
            const taskRef = doc(db, 'tasks', task.id);

            const newSubtask: Subtask = {
                id: `st_${Date.now()}`,
                title: newSubtaskTitle.trim(),
                completed: false
            };

            const updatedSubtasks = [...(task.subtasks || []), newSubtask];

            await updateDoc(taskRef, {
                subtasks: updatedSubtasks,
                updatedAt: new Date()
            });

            setNewSubtaskTitle('');
            setAddingSubtaskFor(null);

            // Auto-expand the task
            setExpandedTasks(prev => new Set([...prev, task.id]));

            if (userId) {
                await loadTodaysTasks(userId);
            }
        } catch (error) {
            console.error('Error adding subtask:', error);
        }
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !userId) return;

        try {
            const db = getFirestore();
            const today = new Date().toISOString().split('T')[0];

            const newTaskData = {
                title: newTaskTitle.trim(),
                description: newTaskDescription.trim(),
                startDate: today,
                startTime: null,
                status: 'todo',
                priority: 'medium',
                tags: [],
                isRepeating: false,
                userId: userId,
                createdAt: Timestamp.now(),
                completed: false,
                mode: modeFilter === 'all' ? 'personal' : modeFilter,
                subtasks: pendingSubtasks
            };

            await addDoc(collection(db, 'tasks'), newTaskData);

            setNewTaskTitle('');
            setNewTaskDescription('');
            setIsAddingTask(false);
            setPendingSubtasks([]);
            setAddingPendingSubtask(false);
            setPendingSubtaskTitle('');

            await loadTodaysTasks(userId);
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const handleAddPendingSubtask = () => {
        if (!pendingSubtaskTitle.trim()) return;

        const newSubtask: Subtask = {
            id: `st_${Date.now()}`,
            title: pendingSubtaskTitle.trim(),
            completed: false
        };

        setPendingSubtasks(prev => [...prev, newSubtask]);
        setPendingSubtaskTitle('');
        setAddingPendingSubtask(false);
    };

    const handleRemovePendingSubtask = (subtaskId: string) => {
        setPendingSubtasks(prev => prev.filter(st => st.id !== subtaskId));
    };

    const toggleExpandTask = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'border-l-red-400';
            case 'medium': return 'border-l-yellow-400';
            case 'low': return 'border-l-green-400';
            default: return 'border-l-gray-400';
        }
    };

    // Multi-select handlers
    const toggleTaskSelection = (taskId: string) => {
        setSelectedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const selectAllTasks = () => {
        setSelectedTasks(new Set(incompleteTasks.map(t => t.id)));
    };

    const clearSelection = () => {
        setSelectedTasks(new Set());
        setSelectMode(false);
    };

    const handleBulkComplete = async () => {
        if (selectedTasks.size === 0 || !userId) return;

        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            selectedTasks.forEach(taskId => {
                const taskRef = doc(db, 'tasks', taskId);
                batch.update(taskRef, { completed: true, status: 'completed' });
            });

            await batch.commit();
            clearSelection();
            await loadTodaysTasks(userId);
        } catch (error) {
            console.error('Error completing tasks:', error);
        }
    };

    const handleBulkMoveToDate = async () => {
        if (selectedTasks.size === 0 || !bulkMoveDate || !userId) return;

        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            selectedTasks.forEach(taskId => {
                const taskRef = doc(db, 'tasks', taskId);
                batch.update(taskRef, { startDate: bulkMoveDate });
            });

            await batch.commit();
            clearSelection();
            setShowDatePicker(false);
            setBulkMoveDate('');
            await loadTodaysTasks(userId);
        } catch (error) {
            console.error('Error moving tasks:', error);
        }
    };

    const handleBulkChangeMode = async (newMode: 'personal' | 'professional') => {
        if (selectedTasks.size === 0 || !userId) return;

        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            selectedTasks.forEach(taskId => {
                const taskRef = doc(db, 'tasks', taskId);
                batch.update(taskRef, { mode: newMode });
            });

            await batch.commit();
            clearSelection();
            await loadTodaysTasks(userId);
        } catch (error) {
            console.error('Error changing task mode:', error);
        }
    };

    // Filter tasks by mode
    const filteredTasks = modeFilter === 'all'
        ? tasks
        : tasks.filter(t => t.mode === modeFilter || (!t.mode && modeFilter === 'personal'));

    const incompleteTasks = filteredTasks.filter(t => !t.completed);
    const completedTasks = filteredTasks.filter(t => t.completed);

    // Calculate total including subtasks
    const totalSubtasks = tasks.reduce((acc, t) => acc + (t.subtasks?.length || 0), 0);
    const completedSubtasks = tasks.reduce((acc, t) =>
        acc + (t.subtasks?.filter(st => st.completed).length || 0), 0);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { over } = event;
        setOverId(over ? (over.id as string) : null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setOverId(null);

        if (!over || active.id === over.id) return;

        const draggedTask = incompleteTasks.find(t => t.id === active.id);
        const overId = over.id as string;

        // Check if dropped on a nest zone
        if (overId.startsWith('nest-')) {
            const targetTaskId = overId.replace('nest-', '');
            const targetTask = incompleteTasks.find(t => t.id === targetTaskId);

            if (draggedTask && targetTask && draggedTask.id !== targetTask.id) {
                await convertToSubtask(draggedTask, targetTask);
            }
            return;
        }

        // Normal reorder
        const targetTask = incompleteTasks.find(t => t.id === overId);
        if (!draggedTask || !targetTask) return;

        const oldIndex = incompleteTasks.findIndex(t => t.id === active.id);
        const newIndex = incompleteTasks.findIndex(t => t.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(incompleteTasks, oldIndex, newIndex);

        // Update local state immediately for smooth UX
        setTasks([...newOrder, ...completedTasks]);

        // Persist to Firestore
        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            newOrder.forEach((task, index) => {
                const taskRef = doc(db, 'tasks', task.id);
                batch.update(taskRef, { position: index });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error updating task order:', error);
            // Reload on error to get correct order
            if (userId) await loadTodaysTasks(userId);
        }
    };

    // Convert a task to subtask of another task
    const convertToSubtask = async (draggedTask: Task, targetTask: Task) => {
        try {
            const db = getFirestore();
            const batch = writeBatch(db);

            // Add dragged task as subtask of target
            const newSubtask: Subtask = {
                id: `subtask_${Date.now()}`,
                title: draggedTask.title,
                completed: false
            };

            const targetRef = doc(db, 'tasks', targetTask.id);
            batch.update(targetRef, {
                subtasks: [...(targetTask.subtasks || []), newSubtask]
            });

            // Delete the original task (it's now a subtask)
            const draggedRef = doc(db, 'tasks', draggedTask.id);
            batch.update(draggedRef, { isDeleted: true });

            await batch.commit();

            // Expand target to show new subtask
            setExpandedTasks(prev => new Set([...prev, targetTask.id]));

            // Reload tasks
            if (userId) await loadTodaysTasks(userId);
        } catch (error) {
            console.error('Error converting task to subtask:', error);
        }
    };


    const renderTask = (task: Task, isCompleted: boolean, isDraggable: boolean = false) => {
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        const isExpanded = expandedTasks.has(task.id);
        const isAddingSubtaskHere = addingSubtaskFor === task.id;

        return (
            <div key={task.id} className="space-y-1">
                <div
                    className={`bg-white rounded-md p-2 shadow-sm border-l-4 ${isCompleted ? 'border-l-gray-300 opacity-60' : getPriorityColor(task.priority)} hover:shadow-md transition-shadow`}
                >
                    <div className="flex items-center gap-2">
                        {/* Drag handle - only for incomplete tasks */}
                        {isDraggable && !isCompleted && !selectMode && (
                            <div
                                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none"
                                title="Drag to reorder"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 6 10">
                                    <circle cx="1" cy="1" r="1" />
                                    <circle cx="5" cy="1" r="1" />
                                    <circle cx="1" cy="5" r="1" />
                                    <circle cx="5" cy="5" r="1" />
                                    <circle cx="1" cy="9" r="1" />
                                    <circle cx="5" cy="9" r="1" />
                                </svg>
                            </div>
                        )}

                        {/* Selection checkbox in select mode */}
                        {selectMode && !isCompleted && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskSelection(task.id);
                                }}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedTasks.has(task.id)
                                    ? 'bg-orange-500 border-orange-500 text-white'
                                    : 'border-gray-400 hover:border-orange-400'
                                    }`}
                            >
                                {selectedTasks.has(task.id) && (
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </button>
                        )}

                        {/* Expand/collapse button */}
                        <button
                            onClick={() => toggleExpandTask(task.id)}
                            className={`flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors ${!hasSubtasks && 'invisible'}`}
                        >
                            <svg
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Checkbox */}
                        <button
                            onClick={() => handleToggleComplete(task)}
                            className={`flex-shrink-0 w-4 h-4 rounded border-2 ${isCompleted
                                ? 'bg-green-500 border-green-500 flex items-center justify-center'
                                : 'border-gray-400 hover:border-green-500'
                                } transition-colors`}
                        >
                            {isCompleted && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <h3 className={`text-sm font-medium truncate ${isCompleted ? 'text-gray-600 line-through' : 'text-gray-800'}`}>
                                {task.title}
                                {hasSubtasks && (
                                    <span className="ml-1 text-xs text-gray-400">
                                        ({task.subtasks!.filter(st => st.completed).length}/{task.subtasks!.length})
                                    </span>
                                )}
                            </h3>
                        </div>

                        {/* Add subtask button */}
                        {!isCompleted && (
                            <button
                                onClick={() => {
                                    setAddingSubtaskFor(task.id);
                                    setExpandedTasks(prev => new Set([...prev, task.id]));
                                }}
                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-yellow-100 rounded transition-colors"
                                title="Add subtask"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Nest drop zone - appears when dragging another task */}
                {activeId && activeId !== task.id && !isCompleted && (
                    <NestDropZone taskId={task.id} onNest={async (targetId) => {
                        const draggedTask = incompleteTasks.find(t => t.id === activeId);
                        const targetTask = incompleteTasks.find(t => t.id === targetId);
                        if (draggedTask && targetTask) {
                            await convertToSubtask(draggedTask, targetTask);
                        }
                    }} />
                )}

                {/* Subtasks */}
                {isExpanded && hasSubtasks && (
                    <div className="ml-6 space-y-1">
                        {task.subtasks!.map(subtask => (
                            <div
                                key={subtask.id}
                                className="bg-white bg-opacity-70 rounded p-1.5 flex items-center gap-2"
                            >
                                <button
                                    onClick={() => handleToggleSubtask(task, subtask.id)}
                                    className={`flex-shrink-0 w-3 h-3 rounded border ${subtask.completed
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-400 hover:border-green-500'
                                        } transition-colors flex items-center justify-center`}
                                >
                                    {subtask.completed && (
                                        <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                <span className={`text-xs ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                                    {subtask.title}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add subtask input */}
                {isAddingSubtaskHere && (
                    <div className="ml-6 flex gap-1">
                        <input
                            type="text"
                            placeholder="Subtask..."
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                                    handleAddSubtask(task);
                                }
                            }}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
                            autoFocus
                        />
                        <button
                            onClick={() => handleAddSubtask(task)}
                            disabled={!newSubtaskTitle.trim()}
                            className="px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded text-xs"
                        >
                            ✓
                        </button>
                        <button
                            onClick={() => {
                                setAddingSubtaskFor(null);
                                setNewSubtaskTitle('');
                            }}
                            className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-xs"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-sm mx-auto">
            <div className="bg-gradient-to-br from-yellow-100 via-yellow-50 to-yellow-100 rounded-lg shadow-lg p-6 relative border-t-8 border-yellow-300" style={{
                boxShadow: '0 10px 25px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef3c7 100%)'
            }}>
                {/* Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                            📝 Today's Tasks
                        </h2>
                        <button
                            onClick={() => userId && loadTodaysTasks(userId)}
                            className="p-1.5 hover:bg-yellow-200 rounded-full transition-colors"
                            title="Refresh"
                        >
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>

                    {/* Mode Toggle */}
                    <div className="flex gap-1 mt-2">
                        {(['all', 'personal', 'professional'] as const).map(mode => (
                            <button
                                key={mode}
                                onClick={() => {
                                    setModeFilter(mode);
                                    localStorage.setItem('widgetModeFilter', mode);
                                }}
                                className={`px-2 py-0.5 text-xs rounded-full transition-colors ${modeFilter === mode
                                    ? mode === 'personal'
                                        ? 'bg-blue-500 text-white'
                                        : mode === 'professional'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-700 text-white'
                                    : 'bg-yellow-200 text-gray-600 hover:bg-yellow-300'
                                    }`}
                            >
                                {mode === 'all' ? '📋 All' : mode === 'personal' ? '🏠 Personal' : '💼 Work'}
                            </button>
                        ))}
                    </div>

                    {/* Select Mode Toggle & Bulk Actions */}
                    <div className="flex items-center justify-between mt-2">
                        <button
                            onClick={() => {
                                setSelectMode(!selectMode);
                                if (selectMode) setSelectedTasks(new Set());
                            }}
                            className={`px-2 py-0.5 text-xs rounded-full transition-colors ${selectMode
                                ? 'bg-orange-500 text-white'
                                : 'bg-yellow-200 text-gray-600 hover:bg-yellow-300'
                                }`}
                        >
                            {selectMode ? '✕ Cancel' : '☑ Select'}
                        </button>

                        {selectMode && selectedTasks.size > 0 && (
                            <span className="text-xs text-gray-600">
                                {selectedTasks.size} selected
                            </span>
                        )}
                    </div>

                    {/* Bulk Action Toolbar */}
                    {selectMode && selectedTasks.size > 0 && (
                        <div className="mt-2 p-2 bg-orange-100 rounded-lg space-y-2">
                            <div className="flex gap-1 flex-wrap">
                                <button
                                    onClick={handleBulkComplete}
                                    className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded"
                                >
                                    ✓ Complete
                                </button>
                                <button
                                    onClick={() => setShowDatePicker(!showDatePicker)}
                                    className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                                >
                                    📅 Move
                                </button>
                                <button
                                    onClick={() => handleBulkChangeMode('personal')}
                                    className="px-2 py-1 text-xs bg-blue-400 hover:bg-blue-500 text-white rounded"
                                >
                                    🏠 Personal
                                </button>
                                <button
                                    onClick={() => handleBulkChangeMode('professional')}
                                    className="px-2 py-1 text-xs bg-purple-500 hover:bg-purple-600 text-white rounded"
                                >
                                    💼 Work
                                </button>
                                <button
                                    onClick={selectAllTasks}
                                    className="px-2 py-1 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded"
                                >
                                    All
                                </button>
                            </div>

                            {showDatePicker && (
                                <div className="flex gap-1">
                                    <input
                                        type="date"
                                        value={bulkMoveDate}
                                        onChange={(e) => setBulkMoveDate(e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                    />
                                    <button
                                        onClick={handleBulkMoveToDate}
                                        disabled={!bulkMoveDate}
                                        className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded"
                                    >
                                        Move
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tasks List */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700 mx-auto"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600 text-sm mb-1" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                                No tasks for today! 🎉
                            </p>
                            <p className="text-gray-500 text-xs">Click + to add one</p>
                        </div>
                    ) : (
                        <>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                                <SortableContext items={incompleteTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    {/* Group by project */}
                                    {(() => {
                                        const grouped = incompleteTasks.reduce((acc, task) => {
                                            const projectKey = task.projectName || 'No Project';
                                            if (!acc[projectKey]) acc[projectKey] = [];
                                            acc[projectKey].push(task);
                                            return acc;
                                        }, {} as Record<string, Task[]>);

                                        // Sort: 'No Project' last
                                        const projectNames = Object.keys(grouped).sort((a, b) => {
                                            if (a === 'No Project') return 1;
                                            if (b === 'No Project') return -1;
                                            return a.localeCompare(b);
                                        });

                                        return projectNames.map(projectName => (
                                            <div key={projectName}>
                                                {projectNames.length > 1 && (
                                                    <div className="flex items-center gap-1 py-1 px-1 mt-2 mb-1 border-b border-yellow-300">
                                                        <span className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Comic Sans MS, cursive' }}>
                                                            📁 {projectName}
                                                        </span>
                                                        <span className="text-xs text-gray-400">({grouped[projectName].length})</span>
                                                    </div>
                                                )}
                                                {grouped[projectName].map(task => (
                                                    <SortableTaskItem key={task.id} id={task.id}>
                                                        {renderTask(task, false, true)}
                                                    </SortableTaskItem>
                                                ))}
                                            </div>
                                        ));
                                    })()}
                                </SortableContext>
                            </DndContext>

                            {completedTasks.length > 0 && (
                                <>
                                    {incompleteTasks.length > 0 && (
                                        <div className="border-t border-yellow-300 my-3 pt-2">
                                            <p className="text-xs text-gray-600 font-medium mb-2">Completed ✓</p>
                                        </div>
                                    )}
                                    {completedTasks.map(task => renderTask(task, true))}
                                </>
                            )}
                        </>
                    )}

                    {/* Add Task Button */}
                    {!isAddingTask ? (
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="w-full py-2 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-yellow-200 rounded-md transition-colors"
                            title="Add new task"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    ) : (
                        <div className="p-2 bg-white rounded-md shadow-sm border-2 border-yellow-300 space-y-2">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="New task..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter' && newTaskTitle.trim()) {
                                            handleAddTask();
                                        }
                                    }}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400 text-sm"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddTask}
                                    disabled={!newTaskTitle.trim()}
                                    className="px-2 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded text-sm transition-colors"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingTask(false);
                                        setNewTaskTitle('');
                                        setPendingSubtasks([]);
                                        setAddingPendingSubtask(false);
                                    }}
                                    className="px-2 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-sm transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Pending subtasks */}
                            {pendingSubtasks.length > 0 && (
                                <div className="ml-4 space-y-1">
                                    {pendingSubtasks.map(st => (
                                        <div key={st.id} className="flex items-center gap-2 text-xs text-gray-600">
                                            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                            <span className="flex-1">{st.title}</span>
                                            <button
                                                onClick={() => handleRemovePendingSubtask(st.id)}
                                                className="text-red-400 hover:text-red-600 text-xs"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add subtask for new task */}
                            {!addingPendingSubtask ? (
                                <button
                                    onClick={() => setAddingPendingSubtask(true)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 ml-4"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add subtask
                                </button>
                            ) : (
                                <div className="flex gap-1 ml-4">
                                    <input
                                        type="text"
                                        placeholder="Subtask..."
                                        value={pendingSubtaskTitle}
                                        onChange={(e) => setPendingSubtaskTitle(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && pendingSubtaskTitle.trim()) {
                                                handleAddPendingSubtask();
                                            }
                                        }}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-400"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleAddPendingSubtask}
                                        disabled={!pendingSubtaskTitle.trim()}
                                        className="px-1 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded text-xs"
                                    >
                                        ✓
                                    </button>
                                    <button
                                        onClick={() => {
                                            setAddingPendingSubtask(false);
                                            setPendingSubtaskTitle('');
                                        }}
                                        className="px-1 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {
                    !loading && tasks.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-yellow-300">
                            <div className="flex justify-between text-xs text-gray-700">
                                <span>{completedTasks.length + completedSubtasks} of {tasks.length + totalSubtasks} done</span>
                                <span>{incompleteTasks.length + (totalSubtasks - completedSubtasks)} remaining</span>
                            </div>
                            <div className="w-full bg-yellow-200 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(tasks.length + totalSubtasks) > 0
                                            ? ((completedTasks.length + completedSubtasks) / (tasks.length + totalSubtasks)) * 100
                                            : 0}%`
                                    }}
                                ></div>
                            </div>
                        </div>
                    )
                }
            </div >

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #fef3c7;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #fbbf24;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #f59e0b;
                }
            `}</style>
        </div >
    );
}
