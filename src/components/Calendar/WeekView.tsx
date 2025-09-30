import React from 'react';
import { Pause, Split, Repeat } from 'lucide-react';
import { TimeSlot } from '../../types';
import { getWeekDates, getDayName, formatDate } from '../../utils/dateUtils';
import { getCalendarSlotClasses } from '../../utils/calendarStyles';
import { getDeadlineStatus } from '../../utils/deadlineUtils';

interface WeekViewProps {
  weekStart: string;
  timeSlots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekStart,
  timeSlots,
  onSlotClick,
}) => {
  const weekDates = getWeekDates(weekStart);
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

  const getSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => slot.date === date);
  };

  const getSlotStyle = (slot: TimeSlot) => {
    const start = parseInt(slot.startTime.split(':')[0]);
    const duration = slot.actualHours || slot.plannedHours;
    const top = (start - 6) * 60; // 60px per hour
    const height = duration * 60;

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px',
    };
  };

  const getSlotColor = (slot: TimeSlot) => getCalendarSlotClasses(slot);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-8 bg-gray-50 overflow-x-auto min-w-[800px]">
        <div className="p-2 sm:p-4 text-xs sm:text-sm font-medium text-gray-500">Время</div>
        {weekDates.map((date) => (
          <div key={date} className="p-2 sm:p-4 text-center border-l min-w-[100px]">
            <div className="text-xs sm:text-sm font-medium text-gray-900">
              {getDayName(date)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              <span className="hidden sm:inline">{formatDate(date)}</span>
              <span className="sm:hidden">{new Date(date).getDate()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="grid grid-cols-8 relative overflow-x-auto min-w-[800px]">
        {/* Time Column */}
        <div className="border-r">
          {hours.map((hour) => (
            <div key={hour} className="h-12 sm:h-15 px-2 sm:px-4 py-2 sm:py-3 border-b text-xs sm:text-sm text-gray-500">
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Date Columns */}
        {weekDates.map((date, dateIndex) => (
          <div key={date} className="relative border-l">
            {hours.map((hour) => (
              <div key={hour} className="h-12 sm:h-15 border-b"></div>
            ))}
            
            {/* Time Slots */}
            <div className="absolute inset-0" style={{ height: `${17 * (window.innerWidth < 640 ? 48 : 60)}px` }}>
              {getSlotsForDate(date).map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => onSlotClick(slot)}
                  className={`absolute border rounded-md cursor-pointer hover:shadow-md transition duration-200 p-1 sm:p-2 ${getSlotColor(
                    slot
                  )}`}
                  style={getSlotStyle(slot)}
                >
                  <div className="text-xs font-medium truncate flex items-center space-x-1 leading-tight">
                    <span>{slot.task}</span>
                    {slot.isPaused && <Pause className="h-3 w-3 flex-shrink-0" />}
                    {slot.parentTaskId && <Split className="h-3 w-3 flex-shrink-0" />}
                    {(slot.isRecurring || slot.parentRecurringId) && <Repeat className="h-3 w-3 flex-shrink-0" />}
                  </div>
                  <div className="text-xs mt-1 hidden sm:block">
                    {slot.startTime} - {slot.endTime}
                  </div>
                  {slot.deadline && (
                    <div className={`text-[10px] sm:text-xs mt-1 ${new Date(slot.deadline) < new Date() ? 'text-red-600' : 'text-gray-700'}`}>
                      Дедлайн: {formatDate(slot.deadline)}{slot.deadlineType ? ` (${slot.deadlineType === 'hard' ? 'жёсткий' : 'мягкий'})` : ''}
                      <span className="ml-1">
                        {slot.deadlineType === 'hard' && <span className="inline-block px-1 border border-red-400 text-red-600 rounded mr-1">HARD</span>}
                        {(() => {
                          const st = getDeadlineStatus(slot.deadline, slot.deadlineType);
                          return st.status === 'approaching' ? <span className="inline-block px-1 bg-orange-100 text-orange-700 rounded">Скоро</span> : null;
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="text-xs mt-1 hidden sm:block">
                    {slot.actualHours > 0 ? (
                      `${slot.actualHours}ч (план: ${slot.plannedHours}ч)`
                    ) : (
                      <span className="text-red-600 font-medium">Факт: не проставлен</span>
                    )}
                  </div>
                  {slot.isPaused && (
                    <div className="text-xs text-yellow-700 font-medium mt-1 hidden sm:block">ПАУЗА</div>
                  )}
                  {slot.taskSequence && (
                    <div className="text-xs text-gray-600 mt-1 hidden sm:block">
                      Часть {slot.taskSequence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};