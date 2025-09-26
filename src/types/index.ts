export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'employee';
  avatar?: string;
  position?: string; // Роль сотрудника (тим-лид, разработчик и т.д.)
  hasAccount?: boolean; // Есть ли у сотрудника аккаунт для входа
  password?: string; // Пароль для входа (в реальном приложении должен быть хешированным)
  birthday?: string; // Дата рождения
  employmentDate?: string; // Дата трудоустройства
  terminationDate?: string; // Дата увольнения (если уволен)
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
}

export interface TimeSlot {
  id: string;
  employeeId: string;
  projectId: string; // Привязка к проекту
  date: string;
  startTime: string;
  endTime: string;
  task: string;
  plannedHours: number;
  actualHours: number;
  status: 'planned' | 'in-progress' | 'completed';
  category: string;
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
  totalCost: number;
  status: 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
  createdBy: string;
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
}