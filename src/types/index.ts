export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
  position?: string; // Роль сотрудника (тим-лид, разработчик и т.д.)
  department?: string; // Отдел/команда (для отчетов по отделам)
  hasAccount?: boolean; // Есть ли у сотрудника аккаунт для входа
  password?: string; // Пароль для входа (в реальном приложении должен быть хешированным)
  birthday?: string; // Дата рождения
  employmentDate?: string; // Дата трудоустройства
  terminationDate?: string; // Дата увольнения (если уволен)
  timezone?: string; // IANA timezone id (например, Europe/Moscow)
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'on-hold';
  createdAt: string;
  teamLeadId?: string; // Тим-лид проекта (userId)
  teamMembers: string[]; // ID сотрудников
  // Новая метрика: часы по договору с заказчиком
  contractHours?: number;
}

export interface TimeSlot {
  id: string;
  employeeId: string;
  projectId: string; // Привязка к проекту
  taskId?: string; // ID задачи из системы задач
  date: string; // Legacy: дата в UTC (для обратной совместимости)
  startTime: string; // Legacy: время в UTC (для обратной совместимости)
  endTime: string; // Legacy: время в UTC (для обратной совместимости)
  startAtUtc?: string; // UTC timestamp (основное поле)
  endAtUtc?: string; // UTC timestamp (основное поле)
  task: string;
  description?: string; // Описание задачи с поддержкой Markdown
  plannedHours: number;
  actualHours: number;
  status: 'planned' | 'in-progress' | 'completed';
  category: string;
  completedAt?: string; // Дата фактического завершения слота
  // Новые поля для разбиения задач
  parentTaskId?: string; // ID родительской задачи (если это часть разбитой задачи)
  taskSequence?: number; // Порядковый номер части задачи (1, 2, 3...)
  totalTaskHours?: number; // Общее количество часов всей задачи
  isPaused?: boolean; // Приостановлена ли задача
  pausedAt?: string; // Когда была приостановлена
  resumedAt?: string; // Когда была возобновлена
  // Поля для повторяющихся задач
  isRecurring?: boolean; // Является ли задача повторяющейся
  recurrenceType?: 'daily' | 'weekly' | 'monthly'; // Тип повторения
  recurrenceInterval?: number; // Интервал повторения (каждые N дней/недель)
  recurrenceEndDate?: string; // Дата окончания повторений
  recurrenceDays?: string[]; // Дни недели для еженедельного повторения
  parentRecurringId?: string; // ID родительской повторяющейся задачи
  recurrenceCount?: number; // Максимальное количество повторений
  // Поля для дедлайнов
  deadline?: string; // Дедлайн задачи (ISO дата)
  deadlineType?: 'soft' | 'hard'; // Тип дедлайна: мягкий (можно превышать) или жесткий
  isAssignedByAdmin?: boolean; // Назначена ли задача администратором
  deadlineReason?: string; // Обоснование дедлайна
}

export interface TaskCategory {
  id: string;
  name: string;
  description: string;
  defaultHours: number;
  defaultHourlyRate: number;
  color: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface WeeklyReport {
  employeeId: string;
  projectId?: string;
  weekStart: string;
  weekEnd: string;
  totalPlannedHours: number;
  totalActualHours: number;
  variance: number;
  slots: TimeSlot[];
}

export type CalendarView = 'day' | 'week' | 'month' | 'year';

export type EmployeePosition = 
  | 'senior-developer' 
  | 'developer' 
  | 'junior-developer'
  | 'tester' 
  | 'senior-tester'
  | 'designer' 
  | 'analyst' 
  | 'project-manager'
  | 'devops'
  | 'cto'
  | 'cpo'
  | 'cfo';

export interface Booking {
  id: string;
  requesterId: string;
  employeeId: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  taskDescription: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeAvailability {
  employeeId: string;
  date: string;
  availableSlots: TimeSlot[];
  bookedSlots: Booking[];
  workingHours: {
    start: string;
    end: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick_leave' | 'personal_leave' | 'compensatory_leave';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  // Для отгулов: признак, что отгул отработан
  worked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  employeeId: string;
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  compensatoryDays: number;
  usedVacationDays: number;
  usedSickDays: number;
  usedPersonalDays: number;
  usedCompensatoryDays: number;
}

export interface Task {
  id: string;
  projectId: string;
  categoryId?: string;
  name: string;
  description: string;
  plannedHours: number;
  actualHours: number;
  hourlyRate: number;
  contractHours?: number;
  sprintType?: 'backlog' | 'week' | 'month';
  totalCost: number;
  status: 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
  createdBy: string;
  // Дедлайны на уровне задачи (могут быть переопределены в назначениях)
  deadline?: string;
  deadlineType?: 'soft' | 'hard';
  deadlineReason?: string;
  // Факт завершения задачи
  completedAt?: string;
  // История изменений дедлайна
  deadlineChangeLog?: Array<{
    changedAt: string; // ISO
    oldDeadline?: string;
    newDeadline?: string;
    changedByUserId: string;
    reason?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  employeeId: string;
  allocatedHours: number;
  actualHours: number;
  createdAt: string;
  completedAt?: string; // Дата фактического завершения назначения
  // Поля для дедлайнов (перенесены из Task)
  deadline?: string; // Дедлайн для этого назначения
  deadlineType?: 'soft' | 'hard'; // Тип дедлайна
  deadlineReason?: string; // Обоснование дедлайна
  priority?: 'low' | 'medium' | 'high' | 'urgent'; // Приоритет для этого назначения
}