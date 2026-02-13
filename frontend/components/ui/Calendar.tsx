import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface CalendarEvent {
    date: string;
    phase?: string;
    mood_rating?: number;
    energy_level?: number;
}

interface CalendarProps {
    onSelectDate?: (date: string) => void;
    events?: CalendarEvent[];
    selectedDate?: string;
}

export const Calendar: React.FC<CalendarProps & { enableRangeSelection?: boolean; onSelectRange?: (start: string, end: string) => void; startDate?: string; endDate?: string }> = ({ onSelectDate, events = [], selectedDate, enableRangeSelection, onSelectRange, startDate, endDate }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const firstDay = startOfWeek(monthStart);
    const lastDay = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: firstDay,
        end: lastDay,
    });

    const getEventForDay = (day: Date) => {
        return events.find((event) => isSameDay(parseISO(event.date), day));
    };

    const getPhaseColor = (phase?: string) => {
        switch (phase) {
            case 'Menstrual': return 'bg-red-400 text-white';
            case 'Follicular': return 'bg-blue-400 text-white';
            case 'Ovulation': return 'bg-purple-400 text-white';
            case 'Luteal': return 'bg-yellow-400 text-white';
            default: return '';
        }
    };

    const handleDateClick = (dayStr: string) => {
        if (enableRangeSelection && onSelectRange) {
            if (!startDate || (startDate && endDate)) {
                // Start new range
                onSelectRange(dayStr, '');
            } else if (startDate && !endDate) {
                // Complete range (ensure start < end)
                if (new Date(dayStr) < new Date(startDate)) {
                    onSelectRange(dayStr, startDate);
                } else {
                    onSelectRange(startDate, dayStr);
                }
            }
        } else if (onSelectDate) {
            onSelectDate(dayStr);
        }
    };

    const isInRange = (day: Date) => {
        if (!startDate || !endDate) return false;
        const start = parseISO(startDate);
        const end = parseISO(endDate);
        return day >= start && day <= end;
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4 px-2">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-semibold text-gray-800">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            <GlassCard className="p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map((day) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const event = getEventForDay(day);
                        const isSelected = selectedDate ? isSameDay(parseISO(selectedDate), day) : false;
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const phaseColor = event ? getPhaseColor(event.phase) : '';

                        // Range styling
                        const isStart = startDate === dayStr;
                        const isEnd = endDate === dayStr;
                        const inRange = isInRange(day);

                        let bgClass = '';
                        if (phaseColor) bgClass = phaseColor;
                        else if (isStart || isEnd) bgClass = 'bg-pink-500 text-white shadow-md transform scale-105';
                        else if (inRange) bgClass = 'bg-pink-100 text-pink-700';
                        else bgClass = 'hover:bg-gray-100 text-gray-700';

                        if (!isCurrentMonth && !inRange && !isStart && !isEnd) bgClass += ' text-gray-300';
                        if (isSelected) bgClass = 'ring-2 ring-pink-400 bg-pink-50 text-gray-800';


                        return (
                            <div
                                key={day.toString()}
                                onClick={() => handleDateClick(dayStr)}
                                className={`
                                    relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200
                                    ${bgClass}
                                    h-14 sm:h-16
                                `}
                            >
                                <span className={`text-sm font-medium`}>
                                    {format(day, 'd')}
                                </span>
                                {event && (
                                    <div className="flex gap-1 mt-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </GlassCard>
        </div>
    );
};
