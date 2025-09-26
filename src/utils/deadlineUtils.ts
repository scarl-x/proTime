import { TimeSlot, TaskAssignment } from '../types';

export type DeadlineType = 'soft' | 'hard';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface DeadlineConfig {
  type: DeadlineType;
  reason?: string;
  priority: TaskPriority;
}

export interface DeadlineCalculationParams {
  startDate: string;
  totalHours: number;
  workingHoursPerDay: number;
  workingDays: number[];
  planningFactor?: number;
  priority: TaskPriority;
  priorityBuffers?: Record<TaskPriority, number>;
}

export interface DeadlineCalculationResult {
  deadline: string;
  workingDaysNeeded: number;
  planningDays: number;
  bufferDays: number;
  totalDays: number;
  breakdown: {
    pureWorkDays: number;
    planningFactor: number;
    priorityBuffer: number;
  };
}

// Константы для расчета дедлайнов
export const DEFAULT_PLANNING_FACTOR = 1.4; // 40% запас на непредвиденные обстоятельства

export const DEFAULT_PRIORITY_BUFFERS: Record<TaskPriority, number> = {
  urgent: 0,    // Критический - без буфера
  high: 0.5,    // Высокий - 0.5 дня буфера
  medium: 1,    // Средний - 1 день буфера
  low: 2,       // Низкий - 2 дня буфера
};

/**
 * Проверяет, прошел ли дедлайн задачи
 */
export const isDeadlinePassed = (deadline: string): boolean => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  return now > deadlineDate;
};

/**
 * Проверяет, приближается ли дедлайн (в течение 3 дней)
 */
export const isDeadlineApproaching = (deadline: string): boolean => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  return deadlineDate <= threeDaysFromNow && deadlineDate >= now;
};

/**
 * Проверяет, просрочено ли назначение задачи
 */
export const isTaskAssignmentOverdue = (assignment: TaskAssignment): boolean => {
  if (!assignment.deadline) return false;
  return isDeadlinePassed(assignment.deadline);
};

/**
 * Проверяет, просрочен ли временной слот
 */
export const isTimeSlotOverdue = (slot: TimeSlot): boolean => {
  if (!slot.deadline) return false;
  return isDeadlinePassed(slot.deadline) && slot.status !== 'completed';
};

/**
 * Рассчитывает количество дней до дедлайна
 */
export const getDaysUntilDeadline = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Рассчитывает количество дней просрочки
 */
export const getDaysOverdue = (deadline: string): number => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = now.getTime() - deadlineDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Получает цвет для индикации дедлайна
 */
export const getDeadlineColor = (deadline: string, deadlineType: DeadlineType = 'soft'): string => {
  if (isDeadlinePassed(deadline)) {
    return deadlineType === 'hard' ? 'text-red-600' : 'text-orange-600';
  }
  
  if (isDeadlineApproaching(deadline)) {
    return deadlineType === 'hard' ? 'text-yellow-600' : 'text-blue-600';
  }
  
  return 'text-green-600';
};

/**
 * Получает текст для индикации дедлайна
 */
export const getDeadlineText = (deadline: string, deadlineType: DeadlineType = 'soft'): string => {
  if (isDeadlinePassed(deadline)) {
    const daysOverdue = getDaysOverdue(deadline);
    return deadlineType === 'hard' 
      ? `Просрочено на ${daysOverdue} дн.`
      : `Превышен на ${daysOverdue} дн.`;
  }
  
  if (isDeadlineApproaching(deadline)) {
    const daysLeft = getDaysUntilDeadline(deadline);
    return `Осталось ${daysLeft} дн.`;
  }
  
  const daysLeft = getDaysUntilDeadline(deadline);
  return `Осталось ${daysLeft} дн.`;
};

/**
 * Проверяет, можно ли превышать плановые часы для назначения задачи
 */
export const canExceedPlannedHoursForAssignment = (assignment: TaskAssignment): boolean => {
  // Если есть жесткий дедлайн, превышение возможно только после дедлайна
  if (assignment.deadlineType === 'hard') {
    return isDeadlinePassed(assignment.deadline || '');
  }
  
  // Для мягких дедлайнов превышение всегда возможно
  return true;
};

/**
 * Проверяет, можно ли превышать плановые часы для временного слота
 */
export const canExceedPlannedHoursForSlot = (slot: TimeSlot): boolean => {
  // Если слот назначен администратором и есть жесткий дедлайн, 
  // превышение возможно только после дедлайна
  if (slot.isAssignedByAdmin && slot.deadlineType === 'hard') {
    return isDeadlinePassed(slot.deadline || '');
  }
  
  // Для мягких дедлайнов или слотов, созданных сотрудником, 
  // превышение всегда возможно
  return true;
};

/**
 * Рассчитывает рекомендуемый дедлайн на основе сложности задачи
 */
export const calculateRecommendedDeadline = (
  plannedHours: number, 
  priority: TaskPriority = 'medium',
  workDaysPerWeek: number = 5,
  hoursPerDay: number = 8
): string => {
  const now = new Date();
  
  // Коэффициенты приоритета
  const priorityMultipliers = {
    low: 1.5,
    medium: 1.0,
    high: 0.7,
    urgent: 0.5
  };
  
  const multiplier = priorityMultipliers[priority];
  const adjustedHours = plannedHours * multiplier;
  
  // Рассчитываем количество рабочих дней
  const workDaysNeeded = Math.ceil(adjustedHours / hoursPerDay);
  
  // Добавляем буферные дни (20% от расчетного времени)
  const bufferDays = Math.ceil(workDaysNeeded * 0.2);
  const totalDays = workDaysNeeded + bufferDays;
  
  // Рассчитываем дату с учетом рабочих дней
  let daysAdded = 0;
  let currentDate = new Date(now);
  
  while (daysAdded < totalDays) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dayOfWeek = currentDate.getDay();
    
    // Считаем только рабочие дни (пн-пт)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      daysAdded++;
    }
  }
  
  return currentDate.toISOString().split('T')[0];
};

/**
 * Рассчитывает дедлайн по новой формуле с учетом коэффициентов планирования и буферов
 */
export const calculateAdvancedDeadline = (params: DeadlineCalculationParams): DeadlineCalculationResult => {
  const {
    startDate,
    totalHours,
    workingHoursPerDay,
    workingDays,
    planningFactor = DEFAULT_PLANNING_FACTOR,
    priority,
    priorityBuffers = DEFAULT_PRIORITY_BUFFERS
  } = params;

  // 1. Переводим часы в рабочие дни (чистая работа)
  const pureWorkDays = Math.ceil(totalHours / workingHoursPerDay);
  
  // 2. Умножаем на коэффициент планирования
  const planningDays = Math.ceil(pureWorkDays * planningFactor);
  
  // 3. Добавляем буфер приоритета
  const bufferDays = priorityBuffers[priority];
  const totalDays = planningDays + bufferDays;
  
  // 4. Рассчитываем дату дедлайна, учитывая только рабочие дни
  const deadline = calculateDeadlineDate(startDate, totalDays, workingDays);
  
  return {
    deadline,
    workingDaysNeeded: pureWorkDays,
    planningDays,
    bufferDays,
    totalDays,
    breakdown: {
      pureWorkDays,
      planningFactor,
      priorityBuffer: bufferDays,
    }
  };
};

/**
 * Рассчитывает дату дедлайна, пропуская выходные дни
 */
const calculateDeadlineDate = (startDate: string, totalWorkingDays: number, workingDays: number[]): string => {
  const start = new Date(startDate);
  let currentDate = new Date(start);
  let workingDaysCount = 0;
  
  while (workingDaysCount < totalWorkingDays) {
    const dayOfWeek = currentDate.getDay();
    if (workingDays.includes(dayOfWeek)) {
      workingDaysCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Возвращаем дату последнего рабочего дня
  currentDate.setDate(currentDate.getDate() - 1);
  return currentDate.toISOString().split('T')[0];
};

/**
 * Получает иконку для приоритета задачи
 */
export const getPriorityIcon = (priority: TaskPriority): string => {
  const icons = {
    low: '⬇️',
    medium: '➡️',
    high: '⬆️',
    urgent: '🚨'
  };
  return icons[priority];
};

/**
 * Получает цвет для приоритета задачи
 */
export const getPriorityColor = (priority: TaskPriority): string => {
  const colors = {
    low: 'text-gray-500',
    medium: 'text-blue-500',
    high: 'text-orange-500',
    urgent: 'text-red-500'
  };
  return colors[priority];
};

/**
 * Валидирует дедлайн (не может быть в прошлом)
 */
export const validateDeadline = (deadline: string): { isValid: boolean; error?: string } => {
  const now = new Date();
  const deadlineDate = new Date(deadline);
  
  if (deadlineDate < now) {
    return {
      isValid: false,
      error: 'Дедлайн не может быть в прошлом'
    };
  }
  
  return { isValid: true };
};

/**
 * Получает статус дедлайна для отображения
 */
export const getDeadlineStatus = (deadline: string, deadlineType: DeadlineType = 'soft') => {
  if (isDeadlinePassed(deadline)) {
    return {
      status: 'overdue',
      text: getDeadlineText(deadline, deadlineType),
      color: getDeadlineColor(deadline, deadlineType),
      icon: '⚠️'
    };
  }
  
  if (isDeadlineApproaching(deadline)) {
    return {
      status: 'approaching',
      text: getDeadlineText(deadline, deadlineType),
      color: getDeadlineColor(deadline, deadlineType),
      icon: '⏰'
    };
  }
  
  return {
    status: 'normal',
    text: getDeadlineText(deadline, deadlineType),
    color: getDeadlineColor(deadline, deadlineType),
    icon: '✅'
  };
};
