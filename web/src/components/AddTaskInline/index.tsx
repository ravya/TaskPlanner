import React, { useState, useEffect, useRef } from 'react';
import { taskService } from '../../services/firebase/task.service';
import { TASK_LIMITS } from '../../types/task';
import { useAuthStore, authSelectors } from '../../store/slices/authSlice';
import { getAuth } from 'firebase/auth';
import { CalendarPopover } from '../ui/CalendarPopover';
import { format } from 'date-fns';

interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

interface AddTaskInlineProps {
    onSubmit: (taskData: {
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
        subtasks?: Subtask[] | null;
        projectId?: string | null;
        deadlineDate?: string | null;
    }) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    currentProjectId?: string; // When in project context, auto-assign
    userId?: string; // For project selector
    modeFilter?: 'personal' | 'professional'; // Current mode from parent
    editingTask?: any; // The task being edited
}

export default function AddTaskInline({ onSubmit, onCancel, isOpen, currentProjectId, userId: _userId, modeFilter: _modeFilter, editingTask }: AddTaskInlineProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState('');
    const [tags, setTags] = useState('');
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [repeatEndDate, setRepeatEndDate] = useState('');
    const [mode, setMode] = useState<'personal' | 'professional'>('personal');
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [deadline, setDeadline] = useState('');

    // Initialize states from editingTask if present
    useEffect(() => {
        if (editingTask && isOpen) {
            setTitle(editingTask.title || '');
            setDescription(editingTask.description || '');
            setStartDate(editingTask.startDate ? editingTask.startDate.split('T')[0] : '');
            setStartTime(editingTask.startTime || '');
            setTags(editingTask.tags ? editingTask.tags.join(', ') : '');
            setIsRepeating(editingTask.isRepeating || false);
            setRepeatFrequency(editingTask.repeatFrequency || 'daily');
            setRepeatEndDate(editingTask.repeatEndDate || '');
            setMode(editingTask.mode || 'personal');
            setSubtasks(editingTask.subtasks || []);
            setDeadline(editingTask.deadlineDate || '');
        } else if (isOpen) {
            // Reset for new task
            setTitle('');
            setDescription('');
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setStartTime('');
            setTags('');
            setIsRepeating(false);
            setSubtasks([]);
            setDeadline('');
        }
    }, [editingTask, isOpen]);

    const PREDEFINED_LABELS = [
        {
            name: 'Errand', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            )
        },
        {
            name: 'Habit', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            )
        },
        {
            name: 'Important', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            )
        },
        {
            name: 'Pending', icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
    ];

    // Feature states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [showDeadline, setShowDeadline] = useState(false);

    // Anchor elements for popovers
    const dateIconRef = useRef<HTMLButtonElement>(null);
    const deadlineIconRef = useRef<HTMLButtonElement>(null);
    const repeatIconRef = useRef<HTMLButtonElement>(null);

    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProjectId);

    // Auth & Limit state
    const [taskCount, setTaskCount] = useState(0);
    const isEmailVerified = useAuthStore(authSelectors.isEmailVerified);
    const isGoogleUser = getAuth().currentUser?.providerData.some(p => p.providerId === 'google.com');
    const isVerified = isEmailVerified || isGoogleUser;
    const isLimitReached = !isVerified && taskCount >= TASK_LIMITS.MAX_TASKS_UNVERIFIED;

    useEffect(() => {
        if (_userId) {
            return taskService.subscribeToTasks(_userId, (tasks) => {
                setTaskCount(tasks.length);
            });
        }
    }, [_userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const tagArray = tags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        await onSubmit({
            title: title.trim(),
            description: description.trim(),
            startDate,
            startTime,
            priority: 'medium', // Default priority, not from UI
            tags: tagArray,
            isRepeating,
            repeatFrequency,
            repeatEndDate,
            mode,
            subtasks: subtasks.length > 0 ? subtasks : null,
            projectId: selectedProjectId || currentProjectId || null,
            deadlineDate: deadline || null
        });

        // Reset form
        setTitle('');
        setDescription('');
        setShowDatePicker(false);
        setShowRepeat(false);
        setShowTags(false);
        setShowDeadline(false);
        setStartDate(format(new Date(), 'yyyy-MM-dd'));
        setStartTime('');
        setTags('');
        setIsRepeating(false);
        setRepeatFrequency('daily');
        setRepeatEndDate('');
        setDeadline('');
        setMode('personal');
        setShowSubtasks(false);
        setSubtasks([]);
        setNewSubtaskTitle('');
        setSelectedProjectId(currentProjectId);
    };

    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        const newSubtask: Subtask = {
            id: `st_${Date.now()}`,
            title: newSubtaskTitle.trim(),
            completed: false
        };
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskTitle('');
    };

    const handleRemoveSubtask = (id: string) => {
        setSubtasks(prev => prev.filter(st => st.id !== id));
    };

    // Collect active features for right side display
    const activeFeatures: React.ReactNode[] = [];

    if (showDatePicker || startTime) {
        activeFeatures.push(
            <span key="date" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                {startDate}{startTime && ` ${startTime}`}
            </span>
        );
    }

    if (isRepeating) {
        activeFeatures.push(
            <span key="repeat" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                Repeating {repeatFrequency}
            </span>
        );
    }

    if (tags.trim()) {
        activeFeatures.push(
            <span key="tags" className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                {tags.split(',').length} tag{tags.split(',').length > 1 ? 's' : ''}
            </span>
        );
    }

    if (deadline) {
        activeFeatures.push(
            <span key="deadline" className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                Deadline: {deadline}
            </span>
        );
    }

    if (subtasks.length > 0) {
        activeFeatures.push(
            <span key="subtasks" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs">
                {subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}
            </span>
        );
    }

    if (selectedProjectId && !currentProjectId) {
        activeFeatures.push(
            <span key="project" className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                Project
            </span>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4" onClick={onCancel}>
            <div
                className="bg-white w-full sm:max-w-xl sm:rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="p-4">
                    {!isVerified && (
                        <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-3 ${isLimitReached ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="font-medium">
                                    {isLimitReached
                                        ? `Task limit reached (${taskCount}/${TASK_LIMITS.MAX_TASKS_UNVERIFIED})`
                                        : `Unverified account limit: ${taskCount}/${TASK_LIMITS.MAX_TASKS_UNVERIFIED} active tasks`}
                                </p>
                                <p className="text-xs opacity-80">
                                    {isLimitReached
                                        ? 'Please verify your email to create more tasks.'
                                        : 'Verify your email to remove this limit.'}
                                </p>
                            </div>
                        </div>
                    )}
                    {/* Line 1: Task Title */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0" />
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task name"
                            className="flex-1 text-base font-medium text-gray-900 placeholder-gray-400 border-none outline-none bg-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Line 2: Description */}
                    <div className="pl-8 mb-3">
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add description..."
                            className="w-full text-sm text-gray-600 placeholder-gray-400 border-none outline-none bg-transparent"
                        />
                    </div>

                    {/* Icon toolbar */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {/* Left side: Feature icons */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                ref={dateIconRef}
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`p-2 rounded-md transition-colors ${showDatePicker || startDate !== format(new Date(), 'yyyy-MM-dd') ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Add date"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                ref={repeatIconRef}
                                onClick={() => setShowRepeat(!showRepeat)}
                                className={`p-2 rounded-md transition-colors ${showRepeat || isRepeating ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Repeat task"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowTags(!showTags)}
                                className={`p-2 rounded-md transition-colors ${showTags || tags.trim() ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Add tags"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                ref={deadlineIconRef}
                                onClick={() => setShowDeadline(!showDeadline)}
                                className={`p-2 rounded-md transition-colors ${showDeadline || deadline ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Set deadline"
                            >
                                <svg className="w-5 h-5" fill={deadline ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                </svg>
                            </button>

                            <button
                                type="button"
                                onClick={() => setShowSubtasks(!showSubtasks)}
                                className={`p-2 rounded-md transition-colors ${showSubtasks || subtasks.length > 0 ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Add subtasks"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>

                        {/* Right side: Active feature badges + submit */}
                        <div className="flex items-center gap-2">
                            {activeFeatures.length > 0 && (
                                <div className="hidden sm:flex items-center gap-1 mr-2">
                                    {activeFeatures}
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || isLimitReached}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLimitReached ? 'Limit Reached' : 'Add'}
                            </button>
                        </div>
                    </div>


                    {showRepeat && (
                        <div className="mt-3 pl-2 flex flex-wrap gap-2 items-center">
                            {!isVerified ? (
                                <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md text-sm border border-purple-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <span>Verify email to unlock recurring tasks</span>
                                </div>
                            ) : (
                                <>
                                    <span className="text-sm text-gray-500">Repeat:</span>
                                    <select
                                        value={repeatFrequency}
                                        onChange={(e) => {
                                            setRepeatFrequency(e.target.value as 'daily' | 'weekly' | 'monthly');
                                            setIsRepeating(true);
                                        }}
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-md"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                    <span className="text-sm text-gray-500">until</span>
                                    <input
                                        type="date"
                                        value={repeatEndDate}
                                        onChange={(e) => { // Changed from onSelect to onChange
                                            setRepeatEndDate(e.target.value); // Kept original logic for repeatEndDate
                                            setIsRepeating(true);
                                        }}
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-md"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {showTags && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 w-full max-w-sm">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PREDEFINED_LABELS.map(label => (
                                    <button
                                        key={label.name}
                                        type="button"
                                        onClick={() => {
                                            const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                                            if (currentTags.includes(label.name)) {
                                                setTags(currentTags.filter(t => t !== label.name).join(', '));
                                            } else {
                                                setTags([...currentTags, label.name].join(', '));
                                            }
                                        }}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border transition-all ${tags.includes(label.name)
                                            ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-sm'
                                            : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50'
                                            }`}
                                    >
                                        <span className={tags.includes(label.name) ? 'text-white' : 'text-gray-400'}>{label.icon}</span>
                                        <span>{label.name}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="New label..."
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                                                if (!currentTags.includes(val)) {
                                                    setTags([...currentTags, val].join(', '));
                                                }
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                        const val = input.value.trim();
                                        if (val) {
                                            const currentTags = tags.split(',').map(t => t.trim()).filter(Boolean);
                                            if (!currentTags.includes(val)) {
                                                setTags([...currentTags, val].join(', '));
                                            }
                                            input.value = '';
                                        }
                                    }}
                                    className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    {showDeadline && (
                        <div className="hidden" /> // Replaced by popover
                    )}

                    {showSubtasks && (
                        <div className="mt-3 pl-2 space-y-2">
                            {/* Existing subtasks */}
                            {subtasks.length > 0 && (
                                <div className="space-y-1">
                                    {subtasks.map(st => (
                                        <div key={st.id} className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                                            <span className="flex-1">{st.title}</span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSubtask(st.id)}
                                                className="text-red-400 hover:text-red-600 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* Add subtask input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSubtask();
                                        }
                                    }}
                                    placeholder="Add a subtask..."
                                    className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddSubtask}
                                    disabled={!newSubtaskTitle.trim()}
                                    className="px-2 py-1 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-md"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                {/* Popovers */}
                {showDatePicker && (
                    <CalendarPopover
                        selectedDate={startDate}
                        onSelect={setStartDate}
                        onClose={() => setShowDatePicker(false)}
                        anchorEl={dateIconRef.current}
                        title="When"
                    />
                )}

                {showDeadline && (
                    <CalendarPopover
                        selectedDate={deadline} // Changed from deadlineDate to deadline
                        onSelect={setDeadline} // Changed from setDeadlineDate to setDeadline
                        onClose={() => setShowDeadline(false)}
                        anchorEl={deadlineIconRef.current}
                        title="Deadline"
                    />
                )}
            </div>
        </div>
    );
}
