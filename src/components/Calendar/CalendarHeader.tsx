import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { CalendarView } from '../../types';

interface CalendarHeaderProps {
  view: CalendarView;
  currentDate: Date;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: Date) => void;
  onAddSlot: () => void;
  title: string;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  currentDate,
  onViewChange,
  onDateChange,
  onAddSlot,
  title,
}) => {
  const views: { key: CalendarView; label: string }[] = [
    { key: 'day', label: 'День' },
    { key: 'week', label: 'Неделя' },
    { key: 'month', label: 'Месяц' },
    { key: 'year', label: 'Год' },
  ];

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    onDateChange(newDate);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 min-w-[150px] sm:min-w-[200px] text-center flex-1 sm:flex-none">
            {title}
          </h2>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <button
          onClick={() => onDateChange(new Date())}
          className="px-3 sm:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 font-medium text-sm sm:text-base"
        >
          Сегодня
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
          {views.map((viewOption) => (
            <button
              key={viewOption.key}
              onClick={() => onViewChange(viewOption.key)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition duration-200 whitespace-nowrap ${
                view === viewOption.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {viewOption.label}
            </button>
          ))}
        </div>

        <button
          onClick={onAddSlot}
          className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm sm:text-base"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Добавить</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>
    </div>
  );
};