import React from 'react';
import { LeaveRequest, User as UserType } from '../../types';
import { getMonthName } from '../../utils/dateUtils';

interface LeaveCalendarProps {
  currentDate: Date;
  leaveRequests: LeaveRequest[];
  employees: UserType[];
  onDateClick?: (date: string) => void;
}

export const LeaveCalendar: React.FC<LeaveCalendarProps> = ({
  currentDate,
  leaveRequests,
  employees,
  onDateClick,
}) => {
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - monthStart.getDay() + 1); // Start from Monday

  const days = [];
  const date = new Date(startDate);

  // Generate 6 weeks (42 days)
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }

  const getLeaveRequestsForDate = (date: Date) => {
  // Преобразуем дату в строку в формате YYYY-MM-DD без учета часового пояса
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return leaveRequests.filter(request => 
    request.status === 'approved' &&
    request.startDate <= dateStr && 
    dateStr <= request.endDate
  );
};

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Unknown';
  };

  const getLeaveTypeColor = (type: LeaveRequest['type']) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-100 text-blue-800';
      case 'sick_leave':
        return 'bg-red-100 text-red-800';
      case 'personal_leave':
        return 'bg-purple-100 text-purple-800';
      case 'compensatory_leave':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h3 className="text-lg font-semibold text-gray-900">
          Календарь отпусков - {getMonthName(currentDate)}
        </h3>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const requests = getLeaveRequestsForDate(day);

          return (
            <div
              key={index}
              onClick={() => onDateClick?.(day.toISOString().split('T')[0])}
              className={`min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 transition duration-200 ${
                !isCurrentMonth ? 'text-gray-400 bg-gray-25' : ''
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              {requests.length > 0 && (
                <div className="space-y-1">
                  {requests.slice(0, 2).map((request) => (
                    <div
                      key={request.id}
                      className={`text-xs p-1 rounded truncate ${getLeaveTypeColor(request.type)}`}
                      title={`${getEmployeeName(request.employeeId)} - ${request.reason}`}
                    >
                      {getEmployeeName(request.employeeId).split(' ')[0]}
                    </div>
                  ))}
                  {requests.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{requests.length - 2} еще
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Отпуск</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-100 rounded"></div>
            <span>Больничный</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-100 rounded"></div>
            <span>Личный день</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-100 rounded"></div>
            <span>Отгул</span>
          </div>
        </div>
      </div>
    </div>
  );
};