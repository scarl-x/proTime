import React, { useState } from 'react';
import { Calendar, Clock, User, Plus, AlertCircle } from 'lucide-react';
import { User as UserType, TimeSlot, Booking } from '../../types';
import { formatDate, getWeekDates, getDayName } from '../../utils/dateUtils';

interface EmployeeAvailabilityViewProps {
  employees: UserType[];
  timeSlots: TimeSlot[];
  bookings: Booking[];
  onBookEmployee: (employee: UserType, date: string) => void;
  currentUser: UserType;
}

export const EmployeeAvailabilityView: React.FC<EmployeeAvailabilityViewProps> = ({
  employees,
  timeSlots,
  bookings,
  onBookEmployee,
  currentUser,
}) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });

  const weekDates = getWeekDates(selectedWeek);
  const availableEmployees = employees.filter(emp => 
    emp.id !== currentUser.id
  );

  const getEmployeeScheduleForDate = (employeeId: string, date: string) => {
    const employeeSlots = timeSlots.filter(slot => 
      slot.employeeId === employeeId && slot.date === date
    );
    const employeeBookings = bookings.filter(booking => 
      booking.employeeId === employeeId && 
      booking.date === date && 
      ['pending', 'approved'].includes(booking.status)
    );

    return { slots: employeeSlots, bookings: employeeBookings };
  };

  const getAvailabilityStatus = (employeeId: string, date: string) => {
    const { slots, bookings } = getEmployeeScheduleForDate(employeeId, date);
    const totalScheduledHours = slots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalBookedHours = bookings.reduce((sum, booking) => sum + booking.durationHours, 0);
    const totalHours = totalScheduledHours + totalBookedHours;

    if (totalHours === 0) return { status: 'free', hours: 0, color: 'bg-green-100 text-green-800' };
    if (totalHours < 4) return { status: 'light', hours: totalHours, color: 'bg-yellow-100 text-yellow-800' };
    if (totalHours < 8) return { status: 'busy', hours: totalHours, color: 'bg-orange-100 text-orange-800' };
    return { status: 'full', hours: totalHours, color: 'bg-red-100 text-red-800' };
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentWeek = new Date(selectedWeek);
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek.toISOString().split('T')[0]);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    setSelectedWeek(monday.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Доступность сотрудников</h2>
          <p className="text-gray-600 mt-1">
            Просмотр занятости и бронирование времени коллег
          </p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Calendar className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              Неделя: {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
            </h3>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <Calendar className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <button
            onClick={goToCurrentWeek}
            className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 font-medium"
          >
            Текущая неделя
          </button>
        </div>
      </div>

      {/* Availability Grid */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                {weekDates.map((date) => (
                  <th key={date} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                    <div>{getDayName(date)}</div>
                    <div className="text-gray-400 font-normal">
                      {new Date(date).getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {availableEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {employee.role === 'admin' 
                            ? `Администратор${employee.position ? ` — ${employee.position}` : ''}`
                            : employee.position || 'Сотрудник'
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  {weekDates.map((date) => {
                    const availability = getAvailabilityStatus(employee.id, date);
                    const { slots, bookings } = getEmployeeScheduleForDate(employee.id, date);
                    const isPastDate = new Date(date) < new Date(new Date().toISOString().split('T')[0]);
                    
                    return (
                      <td key={date} className="px-4 py-4 text-center">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${availability.color}`}>
                            {availability.status === 'free' && 'Свободен'}
                            {availability.status === 'light' && `${availability.hours}ч`}
                            {availability.status === 'busy' && `${availability.hours}ч`}
                            {availability.status === 'full' && 'Занят'}
                          </div>
                          
                          {!isPastDate && availability.status !== 'full' && (
                            <button
                              onClick={() => onBookEmployee(employee, date)}
                              className="flex items-center justify-center w-full px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition duration-200"
                              title="Забронировать время"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Забронировать
                            </button>
                          )}

                          {/* Show existing slots and bookings */}
                          {(slots.length > 0 || bookings.length > 0) && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {slots.slice(0, 2).map((slot, index) => (
                                <div key={index} className="truncate">
                                  {slot.startTime}-{slot.endTime}
                                </div>
                              ))}
                              {bookings.slice(0, 2).map((booking, index) => (
                                <div key={index} className="truncate text-blue-600">
                                  {booking.startTime}-{booking.endTime} (бронь)
                                </div>
                              ))}
                              {(slots.length + bookings.length) > 2 && (
                                <div className="text-gray-400">
                                  +{(slots.length + bookings.length) - 2} еще
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {availableEmployees.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Нет доступных сотрудников для бронирования</p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Обозначения:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded-full"></div>
            <span className="text-gray-600">Свободен (0 часов)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 rounded-full"></div>
            <span className="text-gray-600">Легкая загрузка (1-3 часа)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-100 rounded-full"></div>
            <span className="text-gray-600">Занят (4-7 часов)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 rounded-full"></div>
            <span className="text-gray-600">Полная загрузка (8+ часов)</span>
          </div>
        </div>
      </div>
    </div>
  );
};