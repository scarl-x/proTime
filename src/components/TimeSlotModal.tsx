import React, { useState, useEffect } from 'react';
import { X, Clock, User, Tag, Calendar, Split, Pause, Play, AlertCircle, Repeat, Info } from 'lucide-react';
import { TimeSlot, User as UserType, Project, TaskCategory } from '../types';
import { RecurringTaskConfig, generateRecurringTasks, getRecurrenceDescription, WEEKDAY_NAMES } from '../utils/recurringUtils';
import { formatDate } from '../utils/dateUtils';
import { calculateAdvancedDeadline, DEFAULT_PLANNING_FACTOR } from '../utils/deadlineUtils';
import { canExceedPlannedHoursForSlot, isDeadlinePassed } from '../utils/deadlineUtils';

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: Omit<TimeSlot, 'id'> | TimeSlot) => void;
  onDelete?: (id: string) => void;
  slot?: TimeSlot;
  employees: UserType[];
  currentUser: UserType;
  projects: Project[];
  timeSlots?: TimeSlot[];
  preselectedTask?: any; // Предустановленная задача из backlog
  categories?: TaskCategory[];
}

// Fallback categories if no categories are provided
const defaultCategories = [
  'Разработка',
  'Тестирование',
  'Код-ревью',
  'Совещание',
  'Планирование',
  'Документация',
  'Поддержка',
  'Исследование',
];

export const TimeSlotModal: React.FC<TimeSlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  slot,
  employees,
  currentUser,
  projects,
  timeSlots = [],
  preselectedTask,
  categories = [],
}) => {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [onClose]);
  const [formData, setFormData] = useState({
    employeeId: currentUser.id,
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    task: '',
    taskTitle: '',
    taskDescription: '',
    plannedHours: 8,
    actualHours: 0,
    status: 'planned' as 'planned' | 'in-progress' | 'completed',
    category: '',
    parentTaskId: undefined as string | undefined,
    taskSequence: undefined as number | undefined,
    totalTaskHours: undefined as number | undefined,
    isPaused: false,
    isRecurring: false,
    recurrenceType: undefined as 'daily' | 'weekly' | 'monthly' | undefined,
    recurrenceInterval: 1,
    recurrenceEndDate: undefined as string | undefined,
    recurrenceDays: undefined as string[] | undefined,
    parentRecurringId: undefined as string | undefined,
    recurrenceCount: undefined as number | undefined,
    // Поля для дедлайнов
    deadline: undefined as string | undefined,
    deadlineType: 'soft' as 'soft' | 'hard',
    isAssignedByAdmin: false,
    deadlineReason: undefined as string | undefined,
  });
  const [showSplitOptions, setShowSplitOptions] = useState(false);
  const [splitDays, setSplitDays] = useState(1);
  const [splitHoursPerDay, setSplitHoursPerDay] = useState<number[]>([]);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [recurringConfig, setRecurringConfig] = useState<RecurringTaskConfig>({
    type: 'daily',
    interval: 1,
    weekDays: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
  });
  const WORKING_DAYS = [1, 2, 3, 4, 5];
  const WORKING_HOURS_PER_DAY = 8;
  const [plannedHoursError, setPlannedHoursError] = useState<string>('');
  const [isEditingSplitTask, setIsEditingSplitTask] = useState(false);
  const [splitTaskParts, setSplitTaskParts] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (slot) {
      setFormData({
        employeeId: slot.employeeId,
        projectId: slot.projectId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        task: slot.task,
        taskTitle: slot.task,
        taskDescription: '',
        plannedHours: slot.plannedHours,
        actualHours: slot.actualHours,
        status: slot.status,
        category: slot.category,
        parentTaskId: slot.parentTaskId,
        taskSequence: slot.taskSequence,
        totalTaskHours: slot.totalTaskHours,
        isPaused: slot.isPaused || false,
        isRecurring: slot.isRecurring || false,
        recurrenceType: slot.recurrenceType,
        recurrenceInterval: slot.recurrenceInterval || 1,
        recurrenceEndDate: slot.recurrenceEndDate,
        recurrenceDays: slot.recurrenceDays,
        parentRecurringId: slot.parentRecurringId,
        recurrenceCount: slot.recurrenceCount,
        // Поля для дедлайнов
        deadline: slot.deadline,
        deadlineType: slot.deadlineType || 'soft',
        isAssignedByAdmin: slot.isAssignedByAdmin || false,
        deadlineReason: slot.deadlineReason,
      });

      // Если это часть разбитой задачи, загружаем все части для редактирования
      if (slot.parentTaskId) {
        const allParts = timeSlots.filter(ts => ts.parentTaskId === slot.parentTaskId);
        setSplitTaskParts(allParts);
        setIsEditingSplitTask(true);
      }
    } else if (preselectedTask) {
      // Если передана предустановленная задача из backlog
      const baseDate = new Date().toISOString().split('T')[0];
      const planned = 8;
      const dl = calculateAdvancedDeadline({
        startDate: baseDate,
        totalHours: planned,
        workingHoursPerDay: WORKING_HOURS_PER_DAY,
        workingDays: WORKING_DAYS,
        planningFactor: DEFAULT_PLANNING_FACTOR,
        priority: 'medium',
      });
      setFormData({
        employeeId: currentUser.id,
        projectId: preselectedTask.projectId,
        date: baseDate,
        startTime: '09:00',
        endTime: '17:00',
        task: preselectedTask.title,
        taskTitle: preselectedTask.title,
        taskDescription: preselectedTask.description || '',
        plannedHours: planned,
        actualHours: 0,
        status: 'planned' as 'planned' | 'in-progress' | 'completed',
        category: '',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
        isRecurring: false,
        recurrenceType: undefined,
        recurrenceInterval: 1,
        recurrenceEndDate: undefined,
        recurrenceDays: undefined,
        parentRecurringId: undefined,
        recurrenceCount: undefined,
        deadline: undefined,
        deadlineType: 'soft',
        isAssignedByAdmin: false,
        deadlineReason: undefined,
      });
      setFormData(prev => ({ ...prev, deadline: dl.deadline }));
      setIsEditingSplitTask(false);
      setSplitTaskParts([]);
    } else {
      // Новый слот: сразу вычисляем дедлайн на сегодняшнюю дату
      const baseDate = new Date().toISOString().split('T')[0];
      const planned = 8;
      const dl = calculateAdvancedDeadline({
        startDate: baseDate,
        totalHours: planned,
        workingHoursPerDay: WORKING_HOURS_PER_DAY,
        workingDays: WORKING_DAYS,
        planningFactor: DEFAULT_PLANNING_FACTOR,
        priority: 'medium',
      });
      setFormData({
        employeeId: currentUser.id,
        projectId: projects[0]?.id || '',
        date: baseDate,
        startTime: '09:00',
        endTime: '17:00',
        task: '',
        taskTitle: '',
        taskDescription: '',
        plannedHours: planned,
        actualHours: 0,
        status: 'planned' as 'planned' | 'in-progress' | 'completed',
        category: '',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
        isRecurring: false,
        recurrenceType: undefined,
        recurrenceInterval: 1,
        recurrenceEndDate: undefined,
        recurrenceDays: undefined,
        parentRecurringId: undefined,
        recurrenceCount: undefined,
        deadline: undefined,
        deadlineType: 'soft',
        isAssignedByAdmin: false,
        deadlineReason: undefined,
      });
      setFormData(prev => ({ ...prev, deadline: dl.deadline }));
      setIsEditingSplitTask(false);
      setSplitTaskParts([]);
    }
  }, [slot, preselectedTask, currentUser.id, projects, timeSlots]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalFormData = {
      ...formData,
      task: formData.taskTitle || formData.task || '',
      // Пробрасываем описание для создания связанной задачи в проекте
      calendarDescription: formData.taskDescription,
    } as any;
    
    // Проверяем ограничения для задач, назначенных админом
    if (isTaskAssignedByAdmin() && currentUser.role === 'employee') {
      if (!checkPlannedHoursConstraint()) {
        return; // Не сохраняем, если есть ошибка
      }
    }
    
    if (isEditingSplitTask) {
      // Сохраняем все части разбитой задачи
      handleSaveSplitTask();
    } else if (showSplitOptions && !slot) {
      // Создание разбитой задачи
      handleSplitTask();
    } else if (showRecurringOptions && !slot) {
      // Создание повторяющейся задачи
      handleRecurringTask();
    } else {
      if (slot) {
        onSave({ ...finalFormData, id: slot.id } as TimeSlot);
      } else {
        onSave(finalFormData as Omit<TimeSlot, 'id'>);
      }
    }
    onClose();
  };

  const calculateHours = () => {
    const start = new Date(`2000-01-01 ${formData.startTime}`);
    const end = new Date(`2000-01-01 ${formData.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return Math.max(0, hours);
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Auto-calculate planned hours based on time range only for new tasks or admin users
    if (newData.startTime && newData.endTime && (!slot || currentUser.role === 'admin')) {
      const start = new Date(`2000-01-01 ${newData.startTime}`);
      const end = new Date(`2000-01-01 ${newData.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (hours > 0) {
        setFormData({ ...newData, plannedHours: hours });
      }
    }
  };

  // Автоматический расчёт дедлайна для новых/редактируемых задач при изменении даты/часов
  useEffect(() => {
    const totalHours = formData.plannedHours || calculateHours();
    const startDate = formData.date;
    if (!startDate || totalHours <= 0) return;
    // Для новых задач всегда пересчитываем; для существующих — при изменении даты
    if (!slot || (slot && slot.date !== formData.date)) {
      const result = calculateAdvancedDeadline({
        startDate,
        totalHours,
        workingHoursPerDay: WORKING_HOURS_PER_DAY,
        workingDays: WORKING_DAYS,
        planningFactor: DEFAULT_PLANNING_FACTOR,
        priority: 'medium',
      });
      setFormData(prev => ({ ...prev, deadline: result.deadline, deadlineType: prev.deadlineType || 'soft' }));
    }
  }, [formData.date, formData.plannedHours, formData.startTime, formData.endTime, slot]);

  const handleSplitTask = () => {
    const parentTaskId = crypto.randomUUID();
    const baseDate = new Date(formData.date);
    
    splitHoursPerDay.forEach((hours, index) => {
      if (hours > 0) {
        const taskDate = new Date(baseDate);
        taskDate.setDate(baseDate.getDate() + index);
        
        const splitSlot = {
          ...formData,
          date: taskDate.toISOString().split('T')[0],
          plannedHours: hours,
          actualHours: 0,
          parentTaskId,
          taskSequence: index + 1,
          totalTaskHours: formData.plannedHours,
          task: `${formData.task} (Часть ${index + 1}/${splitDays})`,
        };
        
        onSave(splitSlot as Omit<TimeSlot, 'id'>);
      }
    });
  };

  const handleSaveSplitTask = () => {
    // Сохраняем все части разбитой задачи с обновленными данными
    splitTaskParts.forEach((part, index) => {
      const updatedPart = {
        ...part,
        plannedHours: splitHoursPerDay[index] || part.plannedHours,
        // Остальные поля можно обновить из formData если нужно
        date: index === 0 ? formData.date : part.date, // Только первую часть можем перемещать по дате
        startTime: index === 0 ? formData.startTime : part.startTime,
        endTime: index === 0 ? formData.endTime : part.endTime,
        actualHours: index === 0 ? formData.actualHours : part.actualHours,
        status: index === 0 ? formData.status : part.status,
        category: formData.category, // Категорию можем менять для всех частей
      };
      onSave(updatedPart as TimeSlot);
    });
  };

  const handleRecurringTask = () => {
    const recurringTasks = generateRecurringTasks(formData, recurringConfig);
    
    recurringTasks.forEach((task, index) => {
      setTimeout(() => {
        onSave(task);
      }, index * 100); // Небольшая задержка между созданием задач
    });
  };

  const handlePauseToggle = () => {
    if (slot) {
      const updatedSlot = {
        ...formData,
        isPaused: !formData.isPaused,
        pausedAt: !formData.isPaused ? new Date().toISOString() : undefined,
        resumedAt: formData.isPaused ? new Date().toISOString() : undefined,
        id: slot.id,
      };
      onSave(updatedSlot as TimeSlot);
      onClose();
    }
  };

  const initializeSplitHours = (days: number, totalHours: number) => {
    const hoursPerDay = Math.floor(totalHours / days);
    const remainder = totalHours % days;
    
    const hours = Array(days).fill(hoursPerDay);
    for (let i = 0; i < remainder; i++) {
      hours[i] += 1;
    }
    
    setSplitHoursPerDay(hours);
  };

  const handleShowSplitOptions = () => {
    setShowSplitOptions(true);
    const days = Math.ceil(formData.plannedHours / 8); // Предполагаем 8 часов в день
    setSplitDays(days);
    initializeSplitHours(days, formData.plannedHours);
  };

  const updateSplitHours = (index: number, hours: number) => {
    const newHours = [...splitHoursPerDay];
    newHours[index] = hours;
    setSplitHoursPerDay(newHours);
  };

  const handleShowRecurringOptions = () => {
    setShowRecurringOptions(true);
  };

  const toggleWeekDay = (day: number) => {
    setRecurringConfig(prev => ({
      ...prev,
      weekDays: prev.weekDays?.includes(day)
        ? prev.weekDays.filter(d => d !== day)
        : [...(prev.weekDays || []), day].sort()
    }));
  };

  const getRecurringPreview = () => {
    if (!showRecurringOptions) return '';
    return getRecurrenceDescription(
      recurringConfig.type,
      recurringConfig.interval,
      recurringConfig.weekDays?.map(d => d.toString()),
      recurringConfig.endDate,
      recurringConfig.count
    );
  };

  // Проверяем, была ли задача назначена админом
  const isTaskAssignedByAdmin = () => {
    // Задача считается назначенной админом, если:
    // 1. Это часть разбитой задачи (parentTaskId существует) 
    // 2. Или это обычная задача, но текущий пользователь - сотрудник (не создавал сам)
    if (slot?.parentTaskId !== undefined) {
      return true; // Разбитая задача всегда считается назначенной админом
    }
    
    // Для обычных задач: если сотрудник редактирует задачу, которую не создавал сам
    return slot && currentUser.role === 'employee';
  };

  // Получаем изначальные плановые часы для проверки ограничений
  const getOriginalPlannedHours = () => {
    if (slot?.parentTaskId && slot?.totalTaskHours) {
      // Для разбитых задач используем totalTaskHours
      return slot.totalTaskHours;
    } else if (slot && !slot.parentTaskId) {
      // Для обычных задач используем изначальные плановые часы самой задачи
      return slot.plannedHours;
    }
    return 0;
  };

  // Проверка суммы плановых часов для разбитых задач
  const checkPlannedHoursConstraint = () => {
    if (currentUser.role === 'admin') {
      setPlannedHoursError('');
      return true;
    }

    const originalHours = getOriginalPlannedHours();
    
    // Проверяем, можно ли превышать плановые часы (учитывая дедлайн)
    const canExceed = canExceedPlannedHoursForSlot({
      ...formData,
      id: slot?.id || '',
      employeeId: formData.employeeId,
      projectId: formData.projectId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      task: formData.task,
      plannedHours: formData.plannedHours,
      actualHours: formData.actualHours,
      status: formData.status,
      category: formData.category,
      deadline: formData.deadline,
      deadlineType: formData.deadlineType,
      isAssignedByAdmin: formData.isAssignedByAdmin,
      deadlineReason: formData.deadlineReason,
    } as TimeSlot);
    
    // Для разбитых задач
    if (slot?.parentTaskId) {
      // Если редактируем все части сразу
      if (isEditingSplitTask) {
        const totalPlannedHours = splitHoursPerDay.reduce((sum, hours) => sum + hours, 0);
        if (Math.abs(totalPlannedHours - originalHours) > 0.1 && !canExceed) {
          setPlannedHoursError(
            `Сумма плановых часов всех частей задачи (${totalPlannedHours}ч) должна равняться ${originalHours}ч, установленным администратором. ${!canExceed && formData.deadline ? 'Превышение возможно только после дедлайна.' : ''}`
          );
          return false;
        }
      } else {
        // Если редактируем одну часть
        const siblingTasks = timeSlots?.filter(ts => 
          ts.parentTaskId === slot.parentTaskId && ts.id !== slot.id
        ) || [];
        
        const totalPlannedHours = siblingTasks.reduce((sum, task) => sum + task.plannedHours, 0) + formData.plannedHours;
        
        if (Math.abs(totalPlannedHours - originalHours) > 0.1 && !canExceed) {
          setPlannedHoursError(
            `Сумма плановых часов всех частей задачи (${totalPlannedHours}ч) должна равняться ${originalHours}ч, установленным администратором. ${!canExceed && formData.deadline ? 'Превышение возможно только после дедлайна.' : ''}`
          );
          return false;
        }
      }
    }
    
    // Для обычных задач, назначенных админом
    if (slot && !slot.parentTaskId && isTaskAssignedByAdmin()) {
      if (Math.abs(formData.plannedHours - originalHours) > 0.1 && !canExceed) {
        setPlannedHoursError(
          `Плановые часы (${formData.plannedHours}ч) не могут отличаться от установленных администратором (${originalHours}ч). ${!canExceed && formData.deadline ? 'Превышение возможно только после дедлайна.' : ''}`
        );
        return false;
      }
    }
    
    setPlannedHoursError('');
    return true;
  };

  // Инициализация данных для редактирования разбитой задачи
  useEffect(() => {
    if (isEditingSplitTask && splitTaskParts.length > 0) {
      const hours = splitTaskParts.map(part => part.plannedHours);
      setSplitHoursPerDay(hours);
      setSplitDays(splitTaskParts.length);
    }
  }, [isEditingSplitTask, splitTaskParts]);

  // Проверяем при изменении плановых часов
  useEffect(() => {
    if (slot && currentUser.role === 'employee' && isTaskAssignedByAdmin()) {
      checkPlannedHoursConstraint();
    }
  }, [formData.plannedHours, slot, currentUser.role, splitHoursPerDay]);

  if (!isOpen) return null;

  const availableEmployees = currentUser.role === 'admin' 
    ? employees // Админы могут назначать задачи всем пользователям (включая других админов и себя)
    : [currentUser]; // Обычные сотрудники могут ставить задачи только себе

  const isParentTask = slot?.parentTaskId === undefined && slot?.taskSequence === undefined;
  const isChildTask = slot?.parentTaskId !== undefined;
  const totalSplitHours = splitHoursPerDay.reduce((sum, hours) => sum + hours, 0);
  const isRecurringTask = slot?.isRecurring || slot?.parentRecurringId;
  const canEditPlannedHours = currentUser.role === 'admin' || !isTaskAssignedByAdmin();

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {slot ? 'Редактировать задачу' : 'Добавить задачу'}
            {isChildTask && !isEditingSplitTask && (
              <span className="block sm:inline sm:ml-2 text-xs sm:text-sm text-blue-600">
                (Часть {slot?.taskSequence} из задачи)
              </span>
            )}
            {isEditingSplitTask && (
              <span className="block sm:inline sm:ml-2 text-xs sm:text-sm text-blue-600">
                (Редактирование всех частей задачи)
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Статус приостановки */}
        {slot?.isPaused && (
          <div className="mx-6 mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Pause className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Задача приостановлена
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Приостановлена: {slot.pausedAt ? new Date(slot.pausedAt).toLocaleString('ru-RU') : 'Неизвестно'}
            </p>
          </div>
        )}

        {/* Информация о разбитой задаче */}
        {isChildTask && (
          <div className="mx-6 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Split className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {isEditingSplitTask ? 'Редактирование всех частей задачи' : 'Часть большой задачи'}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Общая продолжительность: {getOriginalPlannedHours()}ч
              {isEditingSplitTask && ` | Частей: ${splitTaskParts.length}`}
              {!isEditingSplitTask && ` | Часть ${slot?.taskSequence}`}
            </p>
            {isChildTask && !isEditingSplitTask && (
              <button
                type="button"
                onClick={() => setIsEditingSplitTask(true)}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Редактировать все части задачи
              </button>
            )}
          </div>
        )}

        {/* Информация о повторяющейся задаче */}
        {isRecurringTask && (
          <div className="mx-6 mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Repeat className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                {slot?.isRecurring ? 'Повторяющаяся задача' : 'Часть повторяющейся задачи'}
              </span>
            </div>
            {slot?.isRecurring && (
              <p className="text-xs text-purple-700 mt-1">
                {getRecurrenceDescription(
                  slot.recurrenceType,
                  slot.recurrenceInterval,
                  slot.recurrenceDays,
                  slot.recurrenceEndDate,
                  slot.recurrenceCount
                )}
              </p>
            )}
          </div>
        )}

        {/* Предупреждение для задач, назначенных админом */}
        {!canEditPlannedHours && (
          <div className="mx-6 mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Задача назначена администратором
              </span>
            </div>
            <p className="text-xs text-orange-700 mt-1">
              {isChildTask 
                ? `Общая сумма плановых часов всех частей должна равняться ${getOriginalPlannedHours()}ч`
                : 'Плановые часы установлены администратором и не могут быть изменены'
              }
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          {/* Редактирование разбитой задачи */}
          {isEditingSplitTask ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Редактирование всех частей задачи
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Общая задача: "{splitTaskParts[0]?.task.replace(/ \(Часть \d+\/\d+\)$/, '')}"
                </p>
                <p className="text-sm text-gray-600 mb-6">
                  Общие плановые часы: <strong>{getOriginalPlannedHours()}ч</strong>
                </p>
              </div>

              {/* Распределение часов по частям */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Распределение часов по частям:
                </label>
                <div className="space-y-3">
                  {splitTaskParts.map((part, index) => (
                    <div key={part.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Часть {part.taskSequence} - {part.date}
                        </div>
                        <div className="text-xs text-gray-600">
                          {part.startTime} - {part.endTime}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Часов:</span>
                        <input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={splitHoursPerDay[index] || part.plannedHours}
                          onChange={(e) => updateSplitHours(index, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={!canEditPlannedHours}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {!canEditPlannedHours && totalSplitHours !== getOriginalPlannedHours() && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">
                        Сумма часов ({totalSplitHours}ч) должна равняться {getOriginalPlannedHours()}ч
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Общие настройки для всех частей */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Tag className="h-4 w-4" />
                    <span>Категория (для всех частей)</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    ) : (
                      defaultCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* Обычное редактирование одной задачи */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Employee Selection */}
              {currentUser.role === 'admin' && (
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4" />
                    <span>Сотрудник</span>
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Project Selection */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4" />
                  <span>Проект</span>
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                >
                  <option value="">Выберите проект</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span>Дата</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Start Time */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Время начала</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Время окончания</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Category (optional) */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Tag className="h-4 w-4" />
                  <span>Категория (необязательно)</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Без категории</option>
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    defaultCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'planned' | 'in-progress' | 'completed' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="planned">Запланировано</option>
                  <option value="in-progress">В работе</option>
                  <option value="completed">Завершено</option>
                </select>
              </div>
            </div>
          )}

          {/* Task title/description - только для обычных задач */}
          {!isEditingSplitTask && (
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название задачи
                </label>
                <input
                  type="text"
                  value={formData.taskTitle}
                  onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Например: Разработка формы логина"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Описание (необязательно)
                </label>
                <textarea
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({ ...formData, taskDescription: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Кратко опишите задачу..."
                />
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <div className="text-sm text-gray-700">
                  Дедлайн: <span className="font-medium">{formData.deadline ? formatDate(formData.deadline) : '—'}</span>
                  {formData.deadlineType && (
                    <span className="ml-2 text-xs text-gray-600">({formData.deadlineType === 'hard' ? 'жёсткий' : 'мягкий'})</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Дедлайн устанавливается на уровне задачи/назначения и рассчитывается автоматически в отчетах.
                </div>
              </div>
            </div>
          )}

          {/* Hours - только для обычных задач */}
          {!isEditingSplitTask && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Планируемые часы
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.plannedHours}
                  onChange={(e) => setFormData({ ...formData, plannedHours: parseFloat(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    plannedHoursError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!canEditPlannedHours ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!canEditPlannedHours}
                  required
                />
                {plannedHoursError && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span>{plannedHoursError}</span>
                    </div>
                  </div>
                )}
                {!canEditPlannedHours && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Ограничение для назначенных задач:</p>
                        <p>
                          {isChildTask 
                            ? `Общая сумма плановых часов всех частей должна равняться ${getOriginalPlannedHours()}ч`
                            : `Плановые часы установлены администратором (${getOriginalPlannedHours()}ч) и не могут быть изменены`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Рассчитано по времени: {calculateHours()}ч
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фактические часы
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.actualHours}
                  onChange={(e) => setFormData({ ...formData, actualHours: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Опции разбиения задачи - только для админов и новых задач */}
          {!slot && !showSplitOptions && formData.plannedHours > 8 && currentUser.role === 'admin' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Разбить задачу на несколько дней?
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Задача длительностью {formData.plannedHours}ч может быть разбита на части
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleShowSplitOptions}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Split className="h-4 w-4" />
                  <span>Разбить</span>
                </button>
              </div>
            </div>
          )}

          {/* Опции повторения задачи - только для админов и новых задач */}
          {!slot && !showRecurringOptions && !showSplitOptions && currentUser.role === 'admin' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Сделать задачу повторяющейся?
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Автоматически создавать задачи по расписанию
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleShowRecurringOptions}
                  className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200"
                >
                  <Repeat className="h-4 w-4" />
                  <span>Настроить</span>
                </button>
              </div>
            </div>
          )}

          {/* Настройки повторения */}
          {showRecurringOptions && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Настройки повторения задачи
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип повторения
                  </label>
                  <select
                    value={recurringConfig.type}
                    onChange={(e) => setRecurringConfig(prev => ({ 
                      ...prev, 
                      type: e.target.value as 'daily' | 'weekly' | 'monthly' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="daily">Ежедневно</option>
                    <option value="weekly">Еженедельно</option>
                    <option value="monthly">Ежемесячно</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Интервал
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={recurringConfig.interval}
                    onChange={(e) => setRecurringConfig(prev => ({ 
                      ...prev, 
                      interval: parseInt(e.target.value) || 1 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {recurringConfig.type === 'daily' && `Каждые ${recurringConfig.interval} дня`}
                    {recurringConfig.type === 'weekly' && `Каждые ${recurringConfig.interval} недели`}
                    {recurringConfig.type === 'monthly' && `Каждые ${recurringConfig.interval} месяца`}
                  </p>
                </div>
              </div>

              {/* Выбор дней недели для еженедельного повторения */}
              {recurringConfig.type === 'weekly' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дни недели
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_NAMES.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleWeekDay(index)}
                        className={`px-3 py-1 text-sm rounded-lg transition duration-200 ${
                          recurringConfig.weekDays?.includes(index)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата окончания (необязательно)
                  </label>
                  <input
                    type="date"
                    value={recurringConfig.endDate || ''}
                    onChange={(e) => setRecurringConfig(prev => ({ 
                      ...prev, 
                      endDate: e.target.value || undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество повторений (необязательно)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={recurringConfig.count || ''}
                    onChange={(e) => setRecurringConfig(prev => ({ 
                      ...prev, 
                      count: parseInt(e.target.value) || undefined 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Предварительный просмотр */}
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-800">
                    Предварительный просмотр
                  </span>
                </div>
                <p className="text-sm text-purple-700 mt-1">
                  {getRecurringPreview() || 'Настройте параметры повторения'}
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRecurringOptions(false)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Настройки разбиения */}
          {showSplitOptions && (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Настройки разбиения задачи
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество дней
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={splitDays}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      setSplitDays(days);
                      initializeSplitHours(days, formData.plannedHours);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Общее время
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                    {formData.plannedHours}ч
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Распределение часов по дням:
                </label>
                {splitHoursPerDay.map((hours, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-16">
                      День {index + 1}:
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={hours}
                      onChange={(e) => updateSplitHours(index, parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-sm text-gray-500">часов</span>
                  </div>
                ))}
              </div>

              {totalSplitHours !== formData.plannedHours && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Сумма часов ({totalSplitHours}ч) не равна общему времени ({formData.plannedHours}ч)
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSplitOptions(false)}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-2">
              {slot && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingSplitTask) {
                      // Удаляем все части разбитой задачи
                      if (window.confirm('Удалить все части этой задачи?')) {
                        splitTaskParts.forEach(part => onDelete(part.id));
                        onClose();
                      }
                    } else {
                      onDelete(slot.id);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                >
                  {isEditingSplitTask ? 'Удалить все части' : 'Удалить'}
                </button>
              )}
              
              {slot && currentUser.role === 'admin' && !isEditingSplitTask && (
                <button
                  type="button"
                  onClick={handlePauseToggle}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition duration-200 ${
                    formData.isPaused
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-yellow-600 hover:bg-yellow-50'
                  }`}
                >
                  {formData.isPaused ? (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Возобновить</span>
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Приостановить</span>
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={
                  (showSplitOptions && totalSplitHours !== formData.plannedHours) ||
                  (plannedHoursError !== '') ||
                  (isEditingSplitTask && !canEditPlannedHours && totalSplitHours !== getOriginalPlannedHours())
                }
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {showSplitOptions 
                  ? 'Создать части задачи' 
                  : showRecurringOptions 
                  ? 'Создать повторяющуюся задачу'
                  : isEditingSplitTask
                  ? 'Сохранить все части'
                  : slot ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};