import React, { useState } from 'react';
import { User, Clock, Calendar, ArrowLeft, Pause, Split, Repeat, AlertCircle, CheckCircle, Play } from 'lucide-react';
import { User as UserType, TimeSlot, Project } from '../../types';
import { formatDate, getDayName } from '../../utils/dateUtils';
import { getRecurrenceDescription } from '../../utils/recurringUtils';

interface EmployeeDayScheduleProps {
  employee: UserType;
  date: string;
  timeSlots: TimeSlot[];
  projects: Project[];
  onBack: () => void;
  onSlotClick: (slot: TimeSlot) => void;
  onDateChange: (date: string) => void;
}

export const EmployeeDaySchedule: React.FC<EmployeeDayScheduleProps> = ({
  employee,
  date,
  timeSlots,
  projects,
  onBack,
  onSlotClick,
  onDateChange,
}) => {
  const [selectedDate, setSelectedDate] = useState(date);

  const daySlots = timeSlots.filter(slot => 
    slot.employeeId === employee.id && slot.date === selectedDate
  ).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Неизвестный проект';
  };

  const getProjectColor = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.color || '#6B7280';
  };

  const getSlotColor = (slot: TimeSlot) => {
    if (slot.isPaused) {
      return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    }
    if (slot.status === 'completed') {
      return slot.actualHours !== slot.plannedHours
        ? 'bg-orange-50 border-orange-300 text-orange-800'
        : 'bg-green-50 border-green-300 text-green-800';
    }
    if (slot.status === 'in-progress') {
      return 'bg-blue-50 border-blue-300 text-blue-800';
    }
    return 'bg-gray-50 border-gray-300 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Запланировано';
      case 'in-progress': return 'В работе';
      case 'completed': return 'Завершено';
      default: return status;
    }
  };

  const calculateDayStats = () => {
    const totalPlanned = daySlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActual = daySlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    const completedTasks = daySlots.filter(slot => slot.status === 'completed').length;
    const pausedTasks = daySlots.filter(slot => slot.isPaused).length;
    const variance = totalActual - totalPlanned;

    return {
      totalPlanned,
      totalActual,
      variance,
      completedTasks,
      totalTasks: daySlots.length,
      pausedTasks,
      completionRate: daySlots.length > 0 ? (completedTasks / daySlots.length) * 100 : 0,
    };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const newDateStr = newDate.toISOString().split('T')[0];
    setSelectedDate(newDateStr);
    onDateChange(newDateStr);
  };

  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    onDateChange(today);
  };

  const stats = calculateDayStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к списку</span>
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-sm sm:text-base text-gray-600">{employee.position || 'Сотрудник'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                {formatDate(selectedDate)}
              </h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {getDayName(selectedDate)}
              </p>
            </div>
            <button
              onClick={() => navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 rotate-180" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                onDateChange(e.target.value);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              onClick={goToToday}
              className="px-3 sm:px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200 font-medium text-sm"
            >
              Сегодня
            </button>
          </div>
        </div>
      </div>

      {/* Day Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Всего задач</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Плановые часы</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalPlanned}ч</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Фактические часы</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalActual}ч</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Выполнено</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.completionRate.toFixed(0)}%</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {stats.completedTasks}/{stats.totalTasks} задач
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6 col-span-2 sm:col-span-3 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Отклонение</p>
              <p className={`text-xl sm:text-2xl font-bold ${
                stats.variance === 0 ? 'text-green-600' : 
                stats.variance > 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {stats.variance > 0 ? '+' : ''}{stats.variance}ч
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              stats.variance === 0 ? 'bg-green-100' : 
              stats.variance > 0 ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              <AlertCircle className={`h-4 w-4 sm:h-6 sm:w-6 ${
                stats.variance === 0 ? 'text-green-600' : 
                stats.variance > 0 ? 'text-orange-600' : 'text-red-600'
              }`} />
            </div>
          </div>
          {stats.pausedTasks > 0 && (
            <div className="mt-2">
              <p className="text-xs text-yellow-600">
                {stats.pausedTasks} приостановлено
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Расписание на {formatDate(selectedDate)} ({getDayName(selectedDate)})
          </h3>
        </div>

        {daySlots.length > 0 ? (
          <div className="p-6">
            <div className="space-y-3 sm:space-y-4">
              {daySlots.map((slot) => (
                <div
                  key={slot.id}
                  onClick={() => onSlotClick(slot)}
                  className={`border-l-4 rounded-r-lg p-3 sm:p-4 cursor-pointer hover:shadow-md transition duration-200 ${getSlotColor(slot)}`}
                  style={{ borderLeftColor: getProjectColor(slot.projectId) }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                          {slot.task}
                        </h4>
                        <div className="flex items-center space-x-1 flex-wrap">
                          {slot.isPaused && (
                            <div className="flex items-center space-x-1 text-yellow-600">
                              <Pause className="h-4 w-4" />
                              <span className="text-xs font-medium">ПАУЗА</span>
                            </div>
                          )}
                          {slot.parentTaskId && (
                            <div className="flex items-center space-x-1 text-blue-600">
                              <Split className="h-4 w-4" />
                              <span className="text-xs">Часть {slot.taskSequence}</span>
                            </div>
                          )}
                          {(slot.isRecurring || slot.parentRecurringId) && (
                            <div className="flex items-center space-x-1 text-purple-600">
                              <Repeat className="h-4 w-4" />
                              <span className="text-xs">Повторяющаяся</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            <strong>Время:</strong> {slot.startTime} - {slot.endTime}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            <strong>Проект:</strong> {getProjectName(slot.projectId)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: getProjectColor(slot.projectId) }}></span>
                          <span>
                            <strong>Категория:</strong> {slot.category}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm mb-3">
                        <div>
                          <span className="text-gray-600">Плановые часы:</span>
                          <span className="font-medium ml-2">{slot.plannedHours}ч</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Фактические часы:</span>
                          <span className={`font-medium ml-2 ${
                            slot.actualHours > slot.plannedHours ? 'text-red-600' : 
                            slot.actualHours === slot.plannedHours ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {slot.actualHours}ч
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Статус:</span>
                          <span className="font-medium ml-2">{getStatusLabel(slot.status)}</span>
                        </div>
                      </div>

                      {/* Special task indicators */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                        {slot.isPaused && (
                          <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                            <Pause className="h-3 w-3 mr-1" />
                            Приостановлена
                            {slot.pausedAt && (
                              <span className="ml-1 hidden sm:inline">
                                с {new Date(slot.pausedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </span>
                        )}
                        
                        {slot.parentTaskId && (
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">
                            <Split className="h-3 w-3 mr-1" />
                            Часть {slot.taskSequence} из {Math.ceil((slot.totalTaskHours || slot.plannedHours) / 8)}
                          </span>
                        )}
                        
                        {slot.isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full whitespace-nowrap">
                            <Repeat className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">{getRecurrenceDescription(
                              slot.recurrenceType,
                              slot.recurrenceInterval,
                              slot.recurrenceDays,
                              slot.recurrenceEndDate,
                              slot.recurrenceCount
                            )}</span>
                            <span className="sm:hidden">Повтор</span>
                          </span>
                        )}
                        
                        {slot.parentRecurringId && (
                          <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full whitespace-nowrap">
                            <Repeat className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Из серии повторяющихся</span>
                            <span className="sm:hidden">Серия</span>
                          </span>
                        )}
                      </div>

                      {/* Progress indicator */}
                      {slot.status !== 'planned' && (
                        <div className="mt-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-600 mb-1 space-y-1 sm:space-y-0">
                            <span>Прогресс выполнения</span>
                            <span>
                              {slot.actualHours}/{slot.plannedHours}ч 
                              ({((slot.actualHours / slot.plannedHours) * 100).toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                slot.actualHours > slot.plannedHours ? 'bg-red-500' : 
                                slot.actualHours === slot.plannedHours ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: `${Math.min((slot.actualHours / slot.plannedHours) * 100, 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        slot.status === 'completed' ? 'bg-green-100 text-green-800' :
                        slot.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getStatusLabel(slot.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Нет задач на этот день
            </h3>
            <p className="text-sm sm:text-base text-gray-600">
              У {employee.name} нет запланированных задач на {formatDate(selectedDate)}
            </p>
          </div>
        )}
      </div>

      {/* Day Summary */}
      {daySlots.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Итоги дня</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Общее время (план):</span>
                <span className="font-medium text-sm sm:text-base">{stats.totalPlanned}ч</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Общее время (факт):</span>
                <span className={`font-medium text-sm sm:text-base ${
                  stats.totalActual > stats.totalPlanned ? 'text-red-600' : 'text-green-600'
                }`}>
                  {stats.totalActual}ч
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 sm:pt-2">
                <span className="text-sm sm:text-base text-gray-600 font-medium">Отклонение:</span>
                <span className={`font-bold text-sm sm:text-base ${
                  stats.variance === 0 ? 'text-green-600' : 
                  stats.variance > 0 ? 'text-orange-600' : 'text-red-600'
                }`}>
                  {stats.variance > 0 ? '+' : ''}{stats.variance}ч
                </span>
              </div>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Завершенные задачи:</span>
                <span className="font-medium text-sm sm:text-base">{stats.completedTasks}/{stats.totalTasks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm sm:text-base text-gray-600">Процент выполнения:</span>
                <span className="font-medium text-sm sm:text-base">{stats.completionRate.toFixed(1)}%</span>
              </div>
              {stats.pausedTasks > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm sm:text-base text-gray-600">Приостановленные:</span>
                  <span className="font-medium text-yellow-600 text-sm sm:text-base">{stats.pausedTasks}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar for the day */}
          <div className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-600 mb-2 space-y-1 sm:space-y-0">
              <span>Общий прогресс дня</span>
              <span>{stats.completionRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
              <div
                className="bg-blue-600 h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};