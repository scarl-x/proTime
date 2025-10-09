import React, { useMemo } from 'react';
import { Pause, Split, Repeat } from 'lucide-react';
import { TimeSlot, User } from '../../types';
import { getWeekDates, getDayName, formatDate } from '../../utils/dateUtils';
import { getCalendarSlotClasses } from '../../utils/calendarStyles';
import { getDeadlineStatus } from '../../utils/deadlineUtils';
import { convertSlotToLocal } from '../../utils/timezone';
import { DisplayTimezoneContext } from '../../utils/timezoneContext';

interface WeekViewProps {
  weekStart: string;
  timeSlots: TimeSlot[];
  onSlotClick: (slot: TimeSlot) => void;
  currentUser: User;
  projects?: any[];
}

export const WeekView: React.FC<WeekViewProps> = ({
  weekStart,
  timeSlots,
  onSlotClick,
  currentUser,
  projects = [],
}) => {
  const weekDates = getWeekDates(weekStart);
  const START_HOUR = 0;
  const END_HOUR = 24;
  const perHourPx = (typeof window !== 'undefined' && window.innerWidth < 640) ? 48 : 60;
  const perMinutePx = perHourPx / 60;
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR);

  // Получаем timezone из контекста
  const ctxZone = React.useContext(DisplayTimezoneContext);
  
  // Вычисляем эффективную timezone
  const effectiveZone = useMemo(() => {
    const zone = ctxZone || currentUser.timezone || ((): string => {
      const off = -new Date().getTimezoneOffset();
      const h = Math.floor(off/60);
      return `UTC${h >= 0 ? '+' : ''}${h}`;
    })();
    return zone;
  }, [ctxZone, currentUser]);

  const getSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => {
      try {
        const converted = convertSlotToLocal(slot, effectiveZone);
        // Если конвертация вернула null, используем fallback
        if (!converted || !converted.date) {
          const slotDate = slot.date.split('T')[0];
          return slotDate === date;
        }
        return converted.date === date;
      } catch (error) {
        // Fallback: сравниваем только даты без времени
        const slotDate = slot.date.split('T')[0];
        return slotDate === date;
      }
    });
  };

  // Функция для получения названия проекта
  const getProjectName = (projectId?: string) => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '';
  };

  const getSlotStyle = (slot: TimeSlot) => {
    try {
      const converted = convertSlotToLocal(slot, effectiveZone);
      // Если конвертация вернула null, используем fallback
      if (!converted || !converted.startTime) {
        const start = parseInt(slot.startTime?.split(':')[0] || '0');
        const startMinutes = parseInt(slot.startTime?.split(':')[1] || '0');
        const duration = slot.actualHours || slot.plannedHours;
        const top = (start - START_HOUR) * perHourPx + startMinutes * perMinutePx;
        const height = duration * perHourPx;
        
        return {
          top: `${top}px`,
          height: `${height}px`,
          left: '4px',
          right: '4px',
        };
      }
      
      const start = parseInt(converted.startTime.split(':')[0]);
      const startMinutes = parseInt(converted.startTime.split(':')[1] || '0');
      const duration = slot.actualHours || slot.plannedHours;
      const top = (start - START_HOUR) * perHourPx + startMinutes * perMinutePx;
      const height = duration * perHourPx;

      return {
        top: `${top}px`,
        height: `${height}px`,
        left: '4px',
        right: '4px',
      };
    } catch (error) {
      // Fallback на оригинальные значения
      const start = parseInt(slot.startTime?.split(':')[0] || '0');
      const startMinutes = parseInt(slot.startTime?.split(':')[1] || '0');
      const duration = slot.actualHours || slot.plannedHours;
      const top = (start - START_HOUR) * perHourPx + startMinutes * perMinutePx;
      const height = duration * perHourPx;

      return {
        top: `${top}px`,
        height: `${height}px`,
        left: '4px',
        right: '4px',
      };
    }
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
            <div
              key={hour}
              className="px-2 sm:px-4 border-b text-xs sm:text-sm text-gray-500 flex items-center"
              style={{ height: `${perHourPx}px` }}
            >
              {hour.toString().padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Date Columns */}
        {weekDates.map((date, dateIndex) => (
          <div key={date} className="relative border-l">
            {hours.map((hour) => (
              <div key={hour} className="border-b" style={{ height: `${perHourPx}px` }}></div>
            ))}
            
            {/* Time Slots */}
            <div className="absolute inset-0" style={{ height: `${24 * perHourPx}px` }}>
              {getSlotsForDate(date).map((slot) => {
                const converted = convertSlotToLocal(slot, effectiveZone);
                return (
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
                    {slot.projectId && getProjectName(slot.projectId) && (
                      <div className="text-xs text-gray-600 truncate" title={getProjectName(slot.projectId)}>
                        {getProjectName(slot.projectId)}
                      </div>
                    )}
                    <div className="text-xs mt-1 hidden sm:block">
                      {converted.startTime} - {converted.endTime}
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
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};