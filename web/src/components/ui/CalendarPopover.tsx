import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface CalendarPopoverProps {
    selectedDate: string;
    onSelect: (date: string) => void;
    onClose: () => void;
    anchorEl: HTMLElement | null;
    title?: string;
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
    selectedDate,
    onSelect,
    onClose,
    anchorEl,
    title = "When"
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));
    const today = new Date();

    const parsedSelectedDate = selectedDate ? new Date(selectedDate) : null;

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    if (!anchorEl) return null;

    const rect = anchorEl.getBoundingClientRect();

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-[60]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bg-[#2C2C2E] text-white rounded-2xl shadow-2xl p-2 w-[220px] border border-gray-700 pointer-events-auto max-h-[80vh] overflow-y-auto"
                    style={{
                        top: Math.min(rect.bottom + 8, window.innerHeight - 300),
                        left: Math.max(8, Math.min(window.innerWidth - 228, rect.left - 100))
                    }}
                >
                    <div className="text-center font-medium text-gray-400 text-[11px] uppercase mb-2">
                        {title}
                    </div>

                    {/* Quick Options */}
                    <div className="space-y-0.5 mb-1">
                        <button
                            onClick={() => {
                                onSelect(format(today, 'yyyy-MM-dd'));
                                onClose();
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1 hover:bg-white/10 rounded-xl transition-colors text-left"
                        >
                            <span className="text-yellow-400 text-[12px]">★</span>
                            <span className="flex-1 font-medium text-[13px]">Today</span>
                        </button>
                    </div>

                    {/* Month Header */}
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="font-semibold">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={(e) => { e.preventDefault(); prevMonth(); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); nextMonth(); }}
                                className="p-1 hover:bg-white/10 rounded-lg"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-0.5 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-[10px] uppercase font-bold text-gray-500 text-center py-1">
                                {day.charAt(0)}
                            </div>
                        ))}
                        {calendarDays.map((day, i) => {
                            const isSelected = parsedSelectedDate && isSameDay(day, parsedSelectedDate);
                            const isCurrentMonth = isSameMonth(day, monthStart);

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onSelect(format(day, 'yyyy-MM-dd'));
                                        onClose();
                                    }}
                                    className={`
                    h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-sm transition-all
                    ${isSelected ? 'bg-blue-500 text-white font-bold' : 'hover:bg-white/10'}
                    ${!isCurrentMonth ? 'text-gray-600' : 'text-gray-200'}
                    ${isToday(day) && !isSelected ? 'text-blue-400 font-bold' : ''}
                  `}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Options */}
                    <div className="border-t border-gray-700 mt-1 pt-0.5 space-y-0.5">
                        <button className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-xl transition-colors text-left opacity-50 cursor-not-allowed">
                            <span className="text-gray-400 text-[12px]">+</span>
                            <span className="flex-1 font-medium text-[12px]">Add Reminder</span>
                        </button>
                    </div>

                    {/* Clear Button */}
                </motion.div>
            </div >
        </AnimatePresence >
    );
};
