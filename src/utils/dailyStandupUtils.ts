import { TimeSlot, User, Project } from '../types';

export interface DailyStandupConfig {
  projectId?: string;
  startTime: string;
  endTime: string;
  task: string;
  category: string;
  workDays: number[]; // 1=Пн, 2=Вт, ..., 5=Пт
  isEnabled: boolean;
}

export const DEFAULT_STANDUP_CONFIG: DailyStandupConfig = {
  startTime: '11:30',
  endTime: '12:30',
  task: 'Ежедневный дейлик команды',
  category: 'Совещание',
  workDays: [1, 2, 3, 4, 5], // Пн-Пт
  isEnabled: true,
};

export function generateDailyStandups(
  employees: User[],
  project: Project,
  startDate: Date,
  endDate: Date,
  config: DailyStandupConfig
): Omit<TimeSlot, 'id'>[] {
  console.log('generateDailyStandups вызвана, config.isEnabled:', config.isEnabled);
  if (!config.isEnabled) return [];

  const standups: Omit<TimeSlot, 'id'>[] = [];
  const currentDate = new Date(startDate);
  
  // Только сотрудники из команды проекта
  const projectTeamMembers = employees.filter(emp => 
    emp.role === 'employee' && project.teamMembers.includes(emp.id)
  );

  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Проверяем, является ли день рабочим
    if (config.workDays.includes(dayOfWeek)) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Создаем дейлик для каждого участника команды проекта
      projectTeamMembers.forEach(employee => {
        standups.push({
          employeeId: employee.id,
          projectId: project.id,
          date: dateStr,
          startTime: config.startTime,
          endTime: config.endTime,
          task: config.task,
          plannedHours: 1, // 1 час на дейлик
          actualHours: 1, // Для дейликов фактические часы всегда равны плановым
          status: 'completed', // Дейлики сразу помечаются как завершенные
          category: config.category,
          isRecurring: true,
          recurrenceType: 'daily',
          recurrenceInterval: 1,
          recurrenceDays: config.workDays.map(d => d.toString()),
          parentRecurringId: `${project.id}-${employee.id}`,
        });
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return standups;
}

export function shouldCreateDailyStandups(
  existingSlots: TimeSlot[],
  date: string,
  projectId: string,
  config: DailyStandupConfig
): boolean {
  console.log('shouldCreateDailyStandups вызвана, config.isEnabled:', config.isEnabled);
  if (!config.isEnabled) return false;

  const dayOfWeek = new Date(date).getDay();
  if (!config.workDays.includes(dayOfWeek)) return false;

  // Проверяем, есть ли уже дейлики на эту дату
  const existingStandups = existingSlots.filter(slot => 
    slot.date === date && 
    slot.projectId === projectId &&
    slot.task === config.task &&
    slot.startTime === config.startTime &&
    slot.endTime === config.endTime
  );

  return existingStandups.length === 0;
}

export function createStandupForDate(
  date: string,
  employees: User[],
  project: Project,
  config: DailyStandupConfig
): Omit<TimeSlot, 'id'>[] {
  console.log('createStandupForDate вызвана, config.isEnabled:', config.isEnabled);
  const dayOfWeek = new Date(date).getDay();
  
  if (!config.isEnabled || !config.workDays.includes(dayOfWeek)) {
    return [];
  }

  // Только участники команды проекта
  const projectTeamMembers = employees.filter(emp => 
    emp.role === 'employee' && project.teamMembers.includes(emp.id)
  );

  return projectTeamMembers.map(employee => ({
    employeeId: employee.id,
    projectId: project.id,
    date,
    startTime: config.startTime,
    endTime: config.endTime,
    task: config.task,
    plannedHours: 1,
    actualHours: 1, // Для дейликов фактические часы всегда равны плановым
    status: 'completed' as const, // Дейлики сразу помечаются как завершенные
    category: config.category,
    isRecurring: true,
    recurrenceType: 'daily' as const,
    recurrenceInterval: 1,
    recurrenceDays: config.workDays.map(d => d.toString()),
    parentRecurringId: `${project.id}-${employee.id}`,
  }));
}