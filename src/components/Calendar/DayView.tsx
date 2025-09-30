import React from 'react';
import { Pause, Split, Repeat } from 'lucide-react';
import { TimeSlot } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getCalendarSlotClasses } from '../../utils/calendarStyles';
import { getRecurrenceDescription } from '../../utils/recurringUtils';

interface DayViewProps {
  date: string;
  timeSlots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  date,
  timeSlots,
  onSlotClick,
}) => {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 to 22:00
  const daySlots = timeSlots.filter(slot => slot.date === date);

  const getSlotStyle = (slot: TimeSlot) => {
    const start = parseInt(slot.startTime.split(':')[0]);
    const startMinutes = parseInt(slot.startTime.split(':')[1]);
    const duration = slot.actualHours || slot.plannedHours;
    const top = (start - 6) * 60 + startMinutes;
    const height = duration * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '8px',
      right: '8px',
    };
  };

  const getSlotColor = (slot: TimeSlot) => getCalendarSlotClasses(slot);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {formatDate(date)}
        </h3>
      </div>

      <div className="relative overflow-x-auto">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b min-w-[600px]">
            <div className="w-12 sm:w-16 p-2 sm:p-4 text-xs sm:text-sm text-gray-500 border-r flex-shrink-0">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 h-12 sm:h-15 relative">
              {/* Hour grid */}
            </div>
          </div>
        ))}

        {/* Time Slots */}
        <div className="absolute inset-0 left-12 sm:left-16" style={{ height: `${17 * (window.innerWidth < 640 ? 48 : 60)}px` }}>
          {daySlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => onSlotClick(slot)}
              className={`absolute border-l-4 rounded-r-md cursor-pointer hover:shadow-md transition duration-200 p-2 sm:p-3 ${getSlotColor(
                slot
              )}`}
              style={getSlotStyle(slot)}
            >
              <div className="font-medium text-xs sm:text-sm mb-1 flex items-center space-x-1 sm:space-x-2">
                <span>{slot.task}</span>
                {slot.isPaused && <Pause className="h-3 w-3 flex-shrink-0" />}
                {slot.parentTaskId && <Split className="h-3 w-3 flex-shrink-0" />}
                {(slot.isRecurring || slot.parentRecurringId) && <Repeat className="h-3 w-3 flex-shrink-0" />}
              </div>
              <div className="text-xs text-gray-600 mb-1 hidden sm:block">
                {slot.startTime} - {slot.endTime}
              </div>
              {slot.deadline && (
                <div className={`text-[10px] sm:text-xs mt-1 ${new Date(slot.deadline) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                  Дедлайн: {formatDate(slot.deadline)}{slot.deadlineType ? ` (${slot.deadlineType === 'hard' ? 'жёсткий' : 'мягкий'})` : ''}
                </div>
              )}
              <div className="text-xs">
                <span className="inline-block px-1 sm:px-2 py-1 bg-white bg-opacity-50 rounded text-xs">
                  {slot.category}
                </span>
                {slot.taskSequence && (
                  <span className="inline-block px-1 sm:px-2 py-1 bg-white bg-opacity-50 rounded ml-1 text-xs hidden sm:inline-block">
                    {slot.taskSequence}/{Math.ceil((slot.totalTaskHours || slot.plannedHours) / 8)}
                  </span>
                )}
              </div>
              {slot.isRecurring && (
                <div className="text-xs text-purple-600 mt-1 hidden sm:block">
                  {getRecurrenceDescription(
                    slot.recurrenceType,
                    slot.recurrenceInterval,
                    slot.recurrenceDays,
                    slot.recurrenceEndDate,
                    slot.recurrenceCount
                  )}
                </div>
              )}
              <div className="text-xs mt-2">
                {slot.actualHours > 0 ? (
                  <div className="flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                    <span>Факт: {slot.actualHours}ч</span>
                    <span>План: {slot.plannedHours}ч</span>
                  </div>
                ) : (
                  <span>Планируется: {slot.plannedHours}ч</span>
                )}
                {slot.isPaused && (
                  <div className="text-yellow-700 font-medium text-xs">ПАУЗА</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};