import React, { useCallback, useMemo } from 'react';
import { Pause, Split, Repeat } from 'lucide-react';
import { TimeSlot } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { getCalendarSlotClasses } from '../../utils/calendarStyles';
import { getRecurrenceDescription } from '../../utils/recurringUtils';
import { getDeadlineStatus } from '../../utils/deadlineUtils';

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
  const START_HOUR = 0; // 00:00
  const END_HOUR = 24; // 24:00 (exclusive)
  const perHourPx = (typeof window !== 'undefined' && window.innerWidth < 640) ? 48 : 60;
  const perMinutePx = perHourPx / 60;
  const hours = useMemo(() => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => i + START_HOUR), []);

  const toLocalDateString = useCallback((utcDate: string, utcTime?: string) => {
    const iso = utcTime ? `${utcDate}T${utcTime}:00Z` : `${utcDate}T00:00:00Z`;
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const da = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);

  const toLocalHM = useCallback((utcDate: string, utcTime: string) => {
    const d = new Date(`${utcDate}T${utcTime}:00Z`);
    const hh = `${d.getHours()}`.padStart(2, '0');
    const mm = `${d.getMinutes()}`.padStart(2, '0');
    return `${hh}:${mm}`;
  }, []);

  const parseHM = (hm: string) => {
    const [h, m] = hm.split(':');
    return { h: parseInt(h), m: parseInt(m) };
  };

  const daySlots = useMemo(
    () => timeSlots.filter(slot => toLocalDateString(slot.date, slot.startTime) === date),
    [timeSlots, date, toLocalDateString]
  );

  type DeadlineInfo = {
    isPast: boolean;
    isSoon: boolean;
    isHard: boolean;
    label: string;
  } | null;

  const getDeadlineInfo = useCallback((deadline?: string, type?: 'hard' | 'soft'): DeadlineInfo => {
    if (!deadline) return null;
    const st = getDeadlineStatus(deadline, type);
    const isPast = new Date(deadline) < new Date();
    const typeLabel = type ? (type === 'hard' ? 'жёсткий' : 'мягкий') : '';
    return {
      isPast,
      isSoon: st.status === 'approaching',
      isHard: type === 'hard',
      label: `${formatDate(deadline)}${type ? ` (${typeLabel})` : ''}`,
    };
  }, []);

  const getSlotStyle = useCallback((slot: TimeSlot) => {
    const localStartHM = toLocalHM(slot.date, slot.startTime);
    const { h: start, m: startMinutes } = parseHM(localStartHM);
    const duration = slot.actualHours || slot.plannedHours;
    const top = (start - START_HOUR) * perHourPx + startMinutes * perMinutePx;
    const rawHeight = duration * perHourPx;
    const height = Math.max(rawHeight, 28);

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '8px',
      right: '8px',
    };
  }, [perHourPx, perMinutePx, toLocalHM]);

  const getSlotColor = useCallback((slot: TimeSlot) => getCalendarSlotClasses(slot), []);

  

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {formatDate(date)}
        </h3>
      </div>

      <div className="relative overflow-x-auto">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b min-w-[600px]" style={{ height: `${perHourPx}px` }}>
            <div className="w-12 sm:w-16 p-2 sm:p-4 text-xs sm:text-sm text-gray-500 border-r flex-shrink-0 sticky left-0 bg-white z-10">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1 relative" style={{ height: `${perHourPx}px` }}>
              {/* Hour grid */}
            </div>
          </div>
        ))}

        {/* Time Slots */}
        <div className="absolute inset-0 left-12 sm:left-16" style={{ height: `${24 * perHourPx}px` }}>
          {daySlots.map((slot) => (
            <div
              key={slot.id}
              onClick={() => onSlotClick(slot)}
              className={`absolute border-l-4 rounded-r-md cursor-pointer hover:shadow-md transition duration-200 p-2 sm:p-3 ${getSlotColor(
                slot
              )}`}
              style={getSlotStyle(slot)}
            >
              <div className="flex items-start justify-between space-x-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs sm:text-sm mb-1 flex items-center space-x-1 sm:space-x-2 truncate">
                    <span className="truncate" title={slot.task}>{slot.task}</span>
                    {slot.isPaused && <Pause className="h-3 w-3 flex-shrink-0" />}
                    {slot.parentTaskId && <Split className="h-3 w-3 flex-shrink-0" />}
                    {(slot.isRecurring || slot.parentRecurringId) && <Repeat className="h-3 w-3 flex-shrink-0" />}
                  </div>
                  {/* Время выводим в компактной строке ниже, чтобы не дублировать */}
                </div>
                <div className="flex flex-col items-end text-right text-[10px] sm:text-xs flex-shrink-0 space-y-1" />
              </div>
              {(() => {
                const di = getDeadlineInfo(slot.deadline, slot.deadlineType);
                if (!di) return null;
                return (
                  <div className="text-[10px] sm:text-xs mt-1 flex items-center space-x-1">
                    {di.isHard && (
                      <span className="inline-block px-1 border border-red-400 text-red-600 rounded">HARD</span>
                    )}
                    {di.isSoon && (
                      <span className="inline-block px-1 bg-orange-100 text-orange-700 rounded">Скоро дедлайн</span>
                    )}
                  </div>
                );
              })()}
              {/* Compact inline info row */}
              <div className="mt-1 flex flex-wrap items-center justify-between text-[10px] sm:text-xs gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-gray-600 hidden sm:inline">{toLocalHM(slot.date, slot.startTime)}–{toLocalHM(slot.date, slot.endTime)}</span>
                  {slot.category && (
                    <span className="inline-flex items-center px-1 sm:px-2 py-0.5 bg-white/70 rounded border border-gray-200 text-gray-700 truncate">
                      {slot.category}
                    </span>
                  )}
                  {slot.taskSequence && (
                    <span className="inline-flex items-center px-1 sm:px-2 py-0.5 bg-white/70 rounded border border-gray-200 text-gray-600">
                      {slot.taskSequence}/{Math.ceil((slot.totalTaskHours || slot.plannedHours) / 8)}
                    </span>
                  )}
                  {slot.isRecurring && (
                    <span className="inline-flex items-center px-1 sm:px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200">
                      Повтор
                    </span>
                  )}
                  {slot.isPaused && (
                    <span className="inline-flex items-center px-1 sm:px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
                      Пауза
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Факт/План показываем только здесь, не дублируем сверху */}
                  <span className={slot.actualHours > 0 ? 'text-gray-800' : 'text-red-600 font-medium'}>
                    {slot.actualHours > 0 ? `Факт: ${slot.actualHours}ч` : 'Факт: —'}
                  </span>
                  <span className="text-gray-700">План: {slot.plannedHours}ч</span>
                  {(() => {
                    const di = getDeadlineInfo(slot.deadline, slot.deadlineType);
                    if (!di) return null;
                    return (
                      <span className={di.isPast ? 'text-red-600' : 'text-gray-700'}>
                        {di.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};