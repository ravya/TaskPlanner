import React, { useState } from 'react';

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
        subtasks?: Subtask[];
        projectId?: string;
    }) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    currentProjectId?: string; // When in project context, auto-assign
    userId?: string; // For project selector
    modeFilter?: 'personal' | 'professional'; // Current mode from parent
}

export default function AddTaskInline({ onSubmit, onCancel, isOpen, currentProjectId, userId: _userId, modeFilter: _modeFilter }: AddTaskInlineProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    // Feature states
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showRepeat, setShowRepeat] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [isImportant, setIsImportant] = useState(false);

    // Form data
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [startTime, setStartTime] = useState('');
    const [tags, setTags] = useState('');
    const [isRepeating, setIsRepeating] = useState(false);
    const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const [repeatEndDate, setRepeatEndDate] = useState('');
    const [mode, setMode] = useState<'personal' | 'professional'>('personal');

    // Subtask state
    const [showSubtasks, setShowSubtasks] = useState(false);
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Project state
    const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(currentProjectId);

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
            priority: isImportant ? 'high' : 'medium',
            tags: tagArray,
            isRepeating,
            repeatFrequency,
            repeatEndDate,
            mode,
            subtasks: subtasks.length > 0 ? subtasks : undefined,
            projectId: selectedProjectId || currentProjectId
        });

        // Reset form
        setTitle('');
        setDescription('');
        setShowDatePicker(false);
        setShowRepeat(false);
        setShowTags(false);
        setIsImportant(false);
        setStartDate(() => {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        });
        setStartTime('');
        setTags('');
        setIsRepeating(false);
        setRepeatFrequency('daily');
        setRepeatEndDate('');
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
                📅 {startDate}{startTime && ` ${startTime}`}
            </span>
        );
    }

    if (isRepeating) {
        activeFeatures.push(
            <span key="repeat" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs">
                🔄 {repeatFrequency}
            </span>
        );
    }

    if (tags.trim()) {
        activeFeatures.push(
            <span key="tags" className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-xs">
                🏷️ {tags.split(',').length} tag{tags.split(',').length > 1 ? 's' : ''}
            </span>
        );
    }

    if (isImportant) {
        activeFeatures.push(
            <span key="important" className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs">
                🚩 Important
            </span>
        );
    }

    if (subtasks.length > 0) {
        activeFeatures.push(
            <span key="subtasks" className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs">
                📋 {subtasks.length} subtask{subtasks.length > 1 ? 's' : ''}
            </span>
        );
    }

    if (selectedProjectId && !currentProjectId) {
        activeFeatures.push(
            <span key="project" className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">
                📁 Project
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

                    {/* Expandable feature sections */}
                    {showDatePicker && (
                        <div className="pl-8 mb-3 flex flex-wrap gap-2 items-center">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                placeholder="Time"
                                className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <select
                                value={mode}
                                onChange={(e) => setMode(e.target.value as 'personal' | 'professional')}
                                className="px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="personal">🏠 Personal</option>
                                <option value="professional">💼 Work</option>
                            </select>
                        </div>
                    )}

                    {showRepeat && (
                        <div className="pl-8 mb-3 flex flex-wrap gap-2 items-center">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isRepeating}
                                    onChange={(e) => setIsRepeating(e.target.checked)}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm text-gray-600">Repeat</span>
                            </label>
                            {isRepeating && (
                                <>
                                    <select
                                        value={repeatFrequency}
                                        onChange={(e) => setRepeatFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
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
                                        onChange={(e) => setRepeatEndDate(e.target.value)}
                                        className="px-2 py-1 text-sm border border-gray-200 rounded-md"
                                    />
                                </>
                            )}
                        </div>
                    )}

                    {showTags && (
                        <div className="pl-8 mb-3">
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Add tags (comma separated)..."
                                className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {showSubtasks && (
                        <div className="pl-8 mb-3 space-y-2">
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
                                                ✕
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

                    {/* Line 3: Icon toolbar with active features on right */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        {/* Left side: Feature icons */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`p-2 rounded-md transition-colors ${showDatePicker ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Add date/time"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>

                            <button
                                type="button"
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
                                onClick={() => setIsImportant(!isImportant)}
                                className={`p-2 rounded-md transition-colors ${isImportant ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    }`}
                                title="Mark as important"
                            >
                                <svg className="w-5 h-5" fill={isImportant ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
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
                                disabled={!title.trim()}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
