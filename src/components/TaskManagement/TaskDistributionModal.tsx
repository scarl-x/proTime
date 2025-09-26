import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { TaskAssignment, User as UserType, Project, TimeSlot } from '../../types';
import { formatDate, getWeekDates, getDayName } from '../../utils/dateUtils';
import { calculateRecommendedDeadline, calculateAdvancedDeadline, validateDeadline, DEFAULT_PLANNING_FACTOR, DEFAULT_PRIORITY_BUFFERS } from '../../utils/deadlineUtils';

interface TaskDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TaskAssignment;
  employee: UserType;
  task: { id: string; name: string; description: string };
  project: Project;
  timeSlots: TimeSlot[];
  onCreateTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
}

export const TaskDistributionModal: React.FC<TaskDistributionModalProps> = ({
  isOpen,
  onClose,
  assignment,
  employee,
  task,
  project,
  timeSlots,
  onCreateTimeSlot,
}) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday.toISOString().split('T')[0];
  });
  const [distributionMode, setDistributionMode] = useState<'auto' | 'manual'>('auto');
  const [autoDistribution, setAutoDistribution] = useState({
    startDate: new Date().toISOString().split('T')[0],
    hoursPerDay: 8,
    workDays: [1, 2, 3, 4, 5], // Пн-Пт
  });
  const [manualSlots, setManualSlots] = useState<Array<{
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
  }>>([]);
  
  // Состояние для дедлайнов
  const [deadlineData, setDeadlineData] = useState({
    deadline: assignment.deadline || '',
    deadlineType: assignment.deadlineType || 'soft' as 'soft' | 'hard',
    deadlineReason: assignment.deadlineReason || '',
    priority: assignment.priority || 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });
  const [deadlineError, setDeadlineError] = useState<string>('');
  const [planningFactor, setPlanningFactor] = useState(DEFAULT_PLANNING_FACTOR);
  const [deadlineCalculation, setDeadlineCalculation] = useState<any>(null);
  const [isDistributing, setIsDistributing] = useState(false);
  const [distributionResult, setDistributionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const weekDates = getWeekDates(selectedWeek);
  const remainingHours = assignment.allocatedHours - assignment.actualHours;

  // Автоматически рассчитываем дедлайн при инициализации
  useEffect(() => {
    if (assignment.allocatedHours > 0 && !deadlineData.deadline) {
      calculateRecommendedDeadlineForAssignment();
    }
  }, [assignment.allocatedHours]);

  const getEmployeeScheduleForDate = (date: string) => {
    return timeSlots.filter(slot => 
      slot.employeeId === employee.id && slot.date === date
    );
  };

  const isDateAvailable = (date: string, startTime: string, endTime: string) => {
    const existingSlots = getEmployeeScheduleForDate(date);
    return !existingSlots.some(slot => {
      return (
        (startTime >= slot.startTime && startTime < slot.endTime) ||
        (endTime > slot.startTime && endTime <= slot.endTime) ||
        (startTime <= slot.startTime && endTime >= slot.endTime)
      );
    });
  };

  const calculateAutoDistribution = () => {
    const slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      hours: number;
    }> = [];
    
    let remainingToDistribute = remainingHours;
    const startDate = new Date(autoDistribution.startDate);
    let currentDate = new Date(startDate);
    
    while (remainingToDistribute > 0 && slots.length < 30) { // Максимум 30 дней
      const dayOfWeek = currentDate.getDay();
      
      if (autoDistribution.workDays.includes(dayOfWeek)) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hoursForDay = Math.min(remainingToDistribute, autoDistribution.hoursPerDay);
        
        if (hoursForDay > 0) {
          const startTime = '09:00';
          const endHour = 9 + hoursForDay;
          const endTime = `${endHour.toString().padStart(2, '0')}:00`;
          
          if (isDateAvailable(dateStr, startTime, endTime)) {
            slots.push({
              date: dateStr,
              startTime,
              endTime,
              hours: hoursForDay,
            });
            remainingToDistribute -= hoursForDay;
          }
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return slots;
  };

  const handleDeadlineChange = (value: string) => {
    setDeadlineData(prev => ({ ...prev, deadline: value }));
    
    if (value) {
      const validation = validateDeadline(value);
      if (!validation.isValid) {
        setDeadlineError(validation.error || '');
      } else {
        setDeadlineError('');
      }
    } else {
      setDeadlineError('');
    }
  };

  const calculateRecommendedDeadlineForAssignment = () => {
    // Используем новую формулу расчета дедлайна
    const calculation = calculateAdvancedDeadline({
      startDate: autoDistribution.startDate,
      totalHours: assignment.allocatedHours,
      workingHoursPerDay: autoDistribution.hoursPerDay,
      workingDays: autoDistribution.workDays,
      planningFactor: planningFactor,
      priority: deadlineData.priority,
    });
    
    setDeadlineData(prev => ({ ...prev, deadline: calculation.deadline }));
    setDeadlineCalculation(calculation);
    setDeadlineError('');
  };

  const handlePriorityChange = (priority: 'low' | 'medium' | 'high' | 'urgent') => {
    setDeadlineData(prev => ({ ...prev, priority }));
    
    // Пересчитываем дедлайн при изменении приоритета
    if (assignment.allocatedHours > 0) {
      calculateRecommendedDeadlineForAssignment();
    }
  };

  const handleAutoDistribute = async () => {
    setIsDistributing(true);
    setDistributionResult(null);
    
    try {
      const slots = calculateAutoDistribution();
      
      if (slots.length === 0) {
        setDistributionResult({
          type: 'error',
          message: 'Нет доступных дней для распределения. Попробуйте изменить настройки.'
        });
        return;
      }
      
      // Создаем временные слоты
      for (const slot of slots) {
        await new Promise(resolve => {
          onCreateTimeSlot({
            employeeId: employee.id,
            projectId: project.id,
            taskId: task.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            task: `${task.name} (из задачи проекта)`,
            plannedHours: slot.hours,
            actualHours: 0,
            status: 'planned',
            category: 'Development',
            // Поля для дедлайнов
            deadline: deadlineData.deadline,
            deadlineType: deadlineData.deadlineType,
            isAssignedByAdmin: true,
            deadlineReason: deadlineData.deadlineReason,
          });
          resolve(true);
        });
      }
      
      setDistributionResult({
        type: 'success',
        message: `Задача успешно распределена на ${slots.length} дней. Создано ${slots.length} временных слотов.`
      });
      
      // Закрываем модальное окно через 2 секунды
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      setDistributionResult({
        type: 'error',
        message: 'Ошибка при распределении задачи. Попробуйте еще раз.'
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const addManualSlot = () => {
    setManualSlots(prev => [...prev, {
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      hours: 8,
    }]);
  };

  const updateManualSlot = (index: number, updates: Partial<typeof manualSlots[0]>) => {
    setManualSlots(prev => prev.map((slot, i) => 
      i === index ? { ...slot, ...updates } : slot
    ));
  };

  const removeManualSlot = (index: number) => {
    setManualSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualDistribute = async () => {
    setIsDistributing(true);
    setDistributionResult(null);
    
    try {
      const totalManualHours = manualSlots.reduce((sum, slot) => sum + slot.hours, 0);
      
      if (totalManualHours > remainingHours) {
        setDistributionResult({
          type: 'error',
          message: `Общее количество часов (${totalManualHours}ч) превышает доступные часы (${remainingHours}ч)`
        });
        return;
      }
      
      if (manualSlots.length === 0) {
        setDistributionResult({
          type: 'error',
          message: 'Добавьте хотя бы один временной слот для распределения'
        });
        return;
      }
      
      // Создаем временные слоты
      for (const slot of manualSlots) {
        await new Promise(resolve => {
          onCreateTimeSlot({
            employeeId: employee.id,
            projectId: project.id,
            taskId: task.id,
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            task: `${task.name} (из задачи проекта)`,
            plannedHours: slot.hours,
            actualHours: 0,
            status: 'planned',
            category: 'Development',
            // Поля для дедлайнов
            deadline: deadlineData.deadline,
            deadlineType: deadlineData.deadlineType,
            isAssignedByAdmin: true,
            deadlineReason: deadlineData.deadlineReason,
          });
          resolve(true);
        });
      }
      
      setDistributionResult({
        type: 'success',
        message: `Задача успешно распределена на ${manualSlots.length} дней. Создано ${manualSlots.length} временных слотов.`
      });
      
      // Закрываем модальное окно через 2 секунды
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      setDistributionResult({
        type: 'error',
        message: 'Ошибка при распределении задачи. Попробуйте еще раз.'
      });
    } finally {
      setIsDistributing(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const currentWeek = new Date(selectedWeek);
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newWeek.toISOString().split('T')[0]);
  };

  if (!isOpen) return null;

  const autoSlots = distributionMode === 'auto' ? calculateAutoDistribution() : [];
  const totalAutoHours = autoSlots.reduce((sum, slot) => sum + slot.hours, 0);
  const totalManualHours = manualSlots.reduce((sum, slot) => sum + slot.hours, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Распределить задачу в календарь
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {employee.name} • {task.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Distribution Result Notification */}
          {distributionResult && (
            <div className={`mb-6 p-4 rounded-lg border ${
              distributionResult.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center space-x-2">
                {distributionResult.type === 'success' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{distributionResult.message}</span>
              </div>
            </div>
          )}

          {/* Assignment Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Выделено часов:</span>
                <div className="text-blue-900 font-bold">{assignment.allocatedHours}ч</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Потрачено:</span>
                <div className="text-blue-900 font-bold">{assignment.actualHours}ч</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Осталось распределить:</span>
                <div className="text-blue-900 font-bold">{remainingHours}ч</div>
              </div>
            </div>
          </div>


          {/* Distribution Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Способ распределения
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setDistributionMode('auto')}
                className={`flex-1 p-4 border rounded-lg transition duration-200 ${
                  distributionMode === 'auto'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <Calendar className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Автоматическое</div>
                  <div className="text-xs text-gray-600">Равномерно по рабочим дням</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDistributionMode('manual')}
                className={`flex-1 p-4 border rounded-lg transition duration-200 ${
                  distributionMode === 'manual'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2" />
                  <div className="font-medium">Ручное</div>
                  <div className="text-xs text-gray-600">Выбрать даты и время</div>
                </div>
              </button>
            </div>
          </div>

          {/* Auto Distribution Settings */}
          {distributionMode === 'auto' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата начала
                  </label>
                  <input
                    type="date"
                    value={autoDistribution.startDate}
                    onChange={(e) => {
                      setAutoDistribution(prev => ({ 
                        ...prev, 
                        startDate: e.target.value 
                      }));
                      // Автоматически пересчитываем дедлайн при изменении даты начала
                      if (assignment.allocatedHours > 0) {
                        calculateRecommendedDeadlineForAssignment();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Часов в день
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    step="0.5"
                    value={autoDistribution.hoursPerDay}
                    onChange={(e) => {
                      setAutoDistribution(prev => ({ 
                        ...prev, 
                        hoursPerDay: parseFloat(e.target.value) || 8 
                      }));
                      // Пересчитываем дедлайн при изменении часов в день
                      if (assignment.allocatedHours > 0) {
                        calculateRecommendedDeadlineForAssignment();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Рабочие дни
                  </label>
                  <div className="flex space-x-1">
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          const dayIndex = index === 6 ? 0 : index + 1; // Convert to JS day format
                          setAutoDistribution(prev => ({
                            ...prev,
                            workDays: prev.workDays.includes(dayIndex)
                              ? prev.workDays.filter(d => d !== dayIndex)
                              : [...prev.workDays, dayIndex].sort()
                          }));
                          // Пересчитываем дедлайн при изменении рабочих дней
                          if (assignment.allocatedHours > 0) {
                            calculateRecommendedDeadlineForAssignment();
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded transition duration-200 ${
                          autoDistribution.workDays.includes(index === 6 ? 0 : index + 1)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deadline and Priority Settings */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Дедлайн и приоритет</span>
                  </h4>
                  {autoSlots.length > 0 && (
                    <div className="text-xs text-gray-600">
                      Распределено на {autoSlots.length} дн.
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Deadline Date */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>Дата дедлайна</span>
                    </label>
                    <input
                      type="date"
                      value={deadlineData.deadline}
                      onChange={(e) => handleDeadlineChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        deadlineError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      min={autoDistribution.startDate}
                    />
                    {deadlineError && (
                      <p className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{deadlineError}</span>
                      </p>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <Zap className="h-4 w-4" />
                      <span>Приоритет</span>
                    </label>
                    <select
                      value={deadlineData.priority}
                      onChange={(e) => handlePriorityChange(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                      <option value="urgent">Срочный</option>
                    </select>
                  </div>

                  {/* Deadline Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип дедлайна
                    </label>
                    <select
                      value={deadlineData.deadlineType}
                      onChange={(e) => setDeadlineData(prev => ({ ...prev, deadlineType: e.target.value as 'soft' | 'hard' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="soft">Мягкий (можно превышать)</option>
                      <option value="hard">Жесткий (строгий)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {deadlineData.deadlineType === 'soft' 
                        ? 'Отклонения от плана разрешены' 
                        : 'Отклонения от плана только после дедлайна'
                      }
                    </p>
                  </div>

                  {/* Planning Factor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Коэффициент планирования
                    </label>
                    <input
                      type="number"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={planningFactor}
                      onChange={(e) => {
                        setPlanningFactor(parseFloat(e.target.value) || 1.4);
                        if (assignment.allocatedHours > 0) {
                          calculateRecommendedDeadlineForAssignment();
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Запас на непредвиденные обстоятельства (1.0 = без запаса, 1.4 = 40% запас)
                    </p>
                  </div>

                  {/* Calculate Deadline Button */}
                  <div className="flex items-end">
                    {assignment.allocatedHours > 0 && (
                      <button
                        type="button"
                        onClick={calculateRecommendedDeadlineForAssignment}
                        className="w-full px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        {deadlineData.deadline ? 'Пересчитать дедлайн' : 'Рассчитать рекомендуемый дедлайн'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Deadline Reason */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Обоснование дедлайна (необязательно)
                  </label>
                  <textarea
                    value={deadlineData.deadlineReason}
                    onChange={(e) => setDeadlineData(prev => ({ ...prev, deadlineReason: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Объясните, почему установлен именно этот дедлайн..."
                  />
                </div>
              </div>

              {/* Auto Distribution Preview */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Предварительный просмотр автоматического распределения
                </h4>
                {autoSlots.length > 0 ? (
                  <div className="space-y-2">
                    {autoSlots.slice(0, 5).map((slot, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">
                          {formatDate(slot.date)} ({getDayName(slot.date)})
                        </span>
                        <span className="text-gray-600">
                          {slot.startTime} - {slot.endTime} ({slot.hours}ч)
                        </span>
                      </div>
                    ))}
                    {autoSlots.length > 5 && (
                      <div className="text-xs text-gray-500">
                        +{autoSlots.length - 5} еще дней
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span>Всего будет распределено:</span>
                        <span className={totalAutoHours === remainingHours ? 'text-green-600' : 'text-orange-600'}>
                          {totalAutoHours}ч из {remainingHours}ч
                        </span>
                      </div>
                      {deadlineData.deadline && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Предлагаемый дедлайн:</span>
                            <span className="text-blue-600">
                              {formatDate(deadlineData.deadline)} ({getDayName(deadlineData.deadline)})
                            </span>
                          </div>
                          {deadlineCalculation && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <div className="flex justify-between">
                                <span>Чистая работа:</span>
                                <span>{deadlineCalculation.breakdown.pureWorkDays} дн.</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Коэффициент планирования:</span>
                                <span>{deadlineCalculation.breakdown.planningFactor}x</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Буфер приоритета:</span>
                                <span>+{deadlineCalculation.breakdown.priorityBuffer} дн.</span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Итого рабочих дней:</span>
                                <span>{deadlineCalculation.totalDays} дн.</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Нет доступных дней для распределения</p>
                    <p className="text-xs">Попробуйте изменить настройки</p>
                  </div>
                )}
              </div>

              {totalAutoHours === remainingHours && autoSlots.length > 0 && (
                <button
                  onClick={handleAutoDistribute}
                  disabled={isDistributing}
                  className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition duration-200 ${
                    isDistributing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                >
                  {isDistributing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Распределение...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Распределить автоматически ({autoSlots.length} дней)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Manual Distribution */}
          {distributionMode === 'manual' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Ручное распределение времени
                </h4>
                <button
                  onClick={addManualSlot}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Добавить слот</span>
                </button>
              </div>

              {manualSlots.length > 0 ? (
                <div className="space-y-4">
                  {manualSlots.map((slot, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Дата
                          </label>
                          <input
                            type="date"
                            value={slot.date}
                            onChange={(e) => updateManualSlot(index, { date: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Начало
                          </label>
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateManualSlot(index, { startTime: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Окончание
                          </label>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateManualSlot(index, { endTime: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Часов
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              max="12"
                              value={slot.hours}
                              onChange={(e) => updateManualSlot(index, { hours: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <button
                            onClick={() => removeManualSlot(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition duration-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Availability check */}
                      <div className="mt-2">
                        {isDateAvailable(slot.date, slot.startTime, slot.endTime) ? (
                          <div className="flex items-center space-x-2 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            <span>Время доступно</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-xs text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Конфликт с существующими задачами</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-700 font-medium">Всего часов:</span>
                      <span className={`font-bold ${
                        totalManualHours === remainingHours ? 'text-green-600' : 
                        totalManualHours > remainingHours ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {totalManualHours}ч из {remainingHours}ч
                      </span>
                    </div>
                  </div>

                  {totalManualHours > 0 && totalManualHours <= remainingHours && (
                    <button
                      onClick={handleManualDistribute}
                      disabled={isDistributing}
                      className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition duration-200 ${
                        isDistributing 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      } text-white`}
                    >
                      {isDistributing ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Создание слотов...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-5 w-5" />
                          <span>Создать временные слоты ({manualSlots.length})</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3" />
                  <p>Добавьте временные слоты для распределения</p>
                </div>
              )}
            </div>
          )}

          {/* Employee Calendar Preview */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-gray-900">
                Календарь сотрудника: {employee.name}
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateWeek('prev')}
                  className="p-1 hover:bg-gray-100 rounded transition duration-200"
                >
                  <Calendar className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  {formatDate(weekDates[0])} - {formatDate(weekDates[6])}
                </span>
                <button
                  onClick={() => navigateWeek('next')}
                  className="p-1 hover:bg-gray-100 rounded transition duration-200"
                >
                  <Calendar className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {weekDates.map((date) => {
                const daySlots = getEmployeeScheduleForDate(date);
                const totalHours = daySlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
                
                return (
                  <div key={date} className="border rounded-lg p-2">
                    <div className="text-xs font-medium text-gray-900 mb-1">
                      {getDayName(date)}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {new Date(date).getDate()}
                    </div>
                    
                    {daySlots.length > 0 ? (
                      <div className="space-y-1">
                        {daySlots.slice(0, 2).map((slot, index) => (
                          <div key={index} className="text-xs bg-blue-100 text-blue-800 p-1 rounded truncate">
                            {slot.startTime}-{slot.endTime}
                          </div>
                        ))}
                        {daySlots.length > 2 && (
                          <div className="text-xs text-gray-500">+{daySlots.length - 2}</div>
                        )}
                        <div className="text-xs text-gray-600 font-medium">
                          {totalHours}ч
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-green-600">Свободен</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};