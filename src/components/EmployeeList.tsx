import React from 'react';
import { User, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { User as UserType, TimeSlot } from '../types';
import { formatDate, getWeekStart } from '../utils/dateUtils';

interface EmployeeListProps {
  employees: UserType[];
  timeSlots: TimeSlot[];
  onEmployeeSelect: (employeeId: string) => void;
  onViewDaySchedule?: (employeeId: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  timeSlots,
  onEmployeeSelect,
  onViewDaySchedule,
}) => {
  const getEmployeeStats = (employeeId: string) => {
    const weekStart = getWeekStart(new Date());
    const employeeSlots = timeSlots.filter(
      (slot) => slot.employeeId === employeeId && 
                slot.date >= weekStart &&
                slot.task !== 'Ежедневный дейлик команды' // Исключаем дейлики из статистики
    );

    const totalPlanned = employeeSlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActual = employeeSlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    const completedTasks = employeeSlots.filter(slot => slot.status === 'completed').length;
    const totalTasks = employeeSlots.length;

    return {
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      completedTasks,
      totalTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  };

  // Администраторы тоже считаются сотрудниками и участвуют в списках
  const employeeList = employees; 

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Команда</h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Текущая неделя: {formatDate(getWeekStart(new Date()))} - {formatDate(
            new Date(new Date(getWeekStart(new Date())).getTime() + 6 * 24 * 60 * 60 * 1000)
          )}
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {employeeList.map((employee) => {
          const stats = getEmployeeStats(employee.id);
          const hasVariance = Math.abs(stats.variance) > 0;

          return (
            <div
              key={employee.id}
              onClick={() => onEmployeeSelect(employee.id)}
              className="p-4 sm:p-6 hover:bg-gray-50 cursor-pointer transition duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3 flex-1">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {employee.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{employee.email}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-6 text-xs sm:text-sm">
                  {/* Completion Rate */}
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-gray-900">
                        {stats.completionRate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">Завершено</div>
                  </div>

                  {/* Hours */}
                  <div className="text-center">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">
                        {stats.totalActual}/{stats.totalPlanned}ч
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">Факт/План</div>
                  </div>

                  {/* Variance */}
                  <div className={`text-center ${hasVariance ? 'block' : 'hidden sm:block'}`}>
                    {hasVariance ? (
                    <div className="text-center">
                      <div className="flex items-center space-x-1">
                        <AlertCircle
                          className={`h-4 w-4 ${
                            stats.variance > 0 ? 'text-orange-500' : 'text-red-500'
                          }`}
                        />
                        <span
                          className={`font-medium ${
                            stats.variance > 0
                              ? 'text-orange-600'
                              : stats.variance < 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {stats.variance > 0 ? '+' : ''}{stats.variance}ч
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 hidden sm:block">Отклонение</div>
                    </div>
                    ) : (
                      <div className="text-center hidden sm:block">
                        <div className="text-gray-400">—</div>
                        <div className="text-xs text-gray-500">Отклонение</div>
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div className="text-center">
                    <div className="font-medium text-gray-900">
                      {stats.completedTasks}/{stats.totalTasks}
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">Задач</div>
                  </div>

                  {/* Action button */}
                  {onViewDaySchedule && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDaySchedule(employee.id);
                      }}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 flex-shrink-0"
                      title="Посмотреть расписание на день"
                    >
                      <Calendar className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {stats.totalTasks > 0 && (
                <div className="mt-3 sm:mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Прогресс выполнения задач</span>
                    <span>{stats.completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-blue-600 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {employeeList.length === 0 && (
        <div className="p-8 text-center">
          <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Нет добавленных сотрудников</p>
        </div>
      )}
    </div>
  );
};