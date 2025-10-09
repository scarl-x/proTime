import React from 'react';
import { Pause, Split, Repeat } from 'lucide-react';
import { TimeSlot } from '../../types';
import { getMonthName, formatDate } from '../../utils/dateUtils';
import { getCalendarSlotClasses } from '../../utils/calendarStyles';
import { isTimeSlotOverdue, getDeadlineStatus } from '../../utils/deadlineUtils';

interface MonthViewProps {
  currentDate: Date;
  timeSlots: TimeSlot[];
  onDateClick: (date: string) => void;
  projects?: any[];
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  timeSlots,
  onDateClick,
  projects = [],
}) => {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay() + 1); // Start from Monday

  // Функция для получения названия проекта
  const getProjectName = (projectId?: string) => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project?.name || '';
  };

  const days = [];
  const date = new Date(startDate);

  // Generate 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return timeSlots.filter(slot => {
      const slotDate = slot.date.split('T')[0];
      return slotDate === dateStr;
    });
  };

  const getDayStats = (slots: TimeSlot[]) => {
    const totalPlanned = slots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActual = slots.reduce((sum, slot) => sum + slot.actualHours, 0);
    return { totalPlanned, totalActual };
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {getMonthName(currentDate)}
        </h3>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const slots = getSlotsForDate(day);
          const stats = getDayStats(slots);
          const hasVariance = slots.some(slot => slot.actualHours !== slot.plannedHours);
          const hasPausedTasks = slots.some(slot => slot.isPaused);
          const hasSplitTasks = slots.some(slot => slot.parentTaskId);
          const hasRecurringTasks = slots.some(slot => slot.isRecurring || slot.parentRecurringId);

          return (
            <div
              key={index}
              onClick={() => onDateClick(day.toISOString().split('T')[0])}
              className={`min-h-[80px] sm:min-h-[120px] p-2 sm:p-3 border-b border-r cursor-pointer hover:bg-gray-50 transition duration-200 ${
                !isCurrentMonth ? 'text-gray-400 bg-gray-25' : ''
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="flex space-x-1 hidden sm:flex">
                  {hasVariance && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  )}
                  {hasPausedTasks && (
                    <Pause className="h-3 w-3 text-yellow-600" />
                  )}
                  {hasSplitTasks && (
                    <Split className="h-3 w-3 text-blue-600" />
                  )}
                  {hasRecurringTasks && (
                    <Repeat className="h-3 w-3 text-purple-600" />
                  )}
                </div>
              </div>

              {slots.length > 0 && (
                <div className="space-y-1">
                  {slots.slice(0, 2).map((slot) => (
                    <div
                      key={slot.id}
                      className={`text-xs p-1 rounded truncate leading-tight ${getCalendarSlotClasses(slot)}`}
                    >
                      <div className="flex items-center space-x-1">
                        <span className="truncate text-xs">{slot.task}</span>
                        {slot.isPaused && <Pause className="h-2 w-2 flex-shrink-0" />}
                        {slot.parentTaskId && <Split className="h-2 w-2 flex-shrink-0" />}
                        {(slot.isRecurring || slot.parentRecurringId) && <Repeat className="h-2 w-2 flex-shrink-0" />}
                      </div>
                      {slot.projectId && getProjectName(slot.projectId) && (
                        <div className="text-xs text-gray-600 truncate" title={getProjectName(slot.projectId)}>
                          {getProjectName(slot.projectId)}
                        </div>
                      )}
                      {slot.deadline && (
                        <div className={`mt-0.5 text-[10px] ${isTimeSlotOverdue(slot) ? 'text-red-600' : 'text-gray-700'}`}>
                          Дедл.: {formatDate(slot.deadline)}
                          {slot.deadlineType === 'hard' && <span className="ml-1 inline-block px-1 border border-red-400 text-red-600 rounded">HARD</span>}
                          {(() => {
                            const st = getDeadlineStatus(slot.deadline!, slot.deadlineType);
                            return st.status === 'approaching' ? <span className="ml-1 inline-block px-1 bg-orange-100 text-orange-700 rounded">Скоро</span> : null;
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                  {slots.length > 2 && (
                    <div className="text-xs text-gray-500 hidden sm:block">
                      +{slots.length - 2} еще
                    </div>
                  )}
                  {stats.totalPlanned > 0 && (
                    <div className="text-xs mt-1 sm:mt-2">
                      {stats.totalActual > 0 ? (
                        <span className="text-gray-600">{`${stats.totalActual}/${stats.totalPlanned}ч`}</span>
                      ) : (
                        <span className="text-red-600 font-medium">Факт: не проставлен</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};