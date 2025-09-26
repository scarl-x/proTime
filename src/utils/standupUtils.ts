import { TimeSlot } from '../types';

export interface StandupScheduleParams {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  weekDays: number[]; // 0-6, where 0 is Monday per app convention
  startTime: string; // HH:mm
  durationHours: number; // e.g., 0.5 for 30 minutes
}

export interface StandupOccurrence {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  plannedHours: number;
}

export function addHoursToTime(startTime: string, hoursToAdd: number): string {
  const [h, m] = startTime.split(':').map((v) => parseInt(v, 10));
  const start = new Date(2000, 0, 1, h, m, 0, 0);
  const millis = Math.round(hoursToAdd * 60) * 60 * 1000;
  const end = new Date(start.getTime() + millis);
  const hh = end.getHours().toString().padStart(2, '0');
  const mm = end.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// Generate calendar occurrences for given date range and weekdays (Mon-Sun => 0-6)
export function generateStandupOccurrences(params: StandupScheduleParams): StandupOccurrence[] {
  const { startDate, endDate, weekDays, startTime, durationHours } = params;
  const result: StandupOccurrence[] = [];

  // Parse dates as local dates to avoid UTC timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // JavaScript getDay(): 0=Sun..6=Sat. In app we use 0=Mon..6=Sun
    const jsDay = d.getDay();
    const appDay = jsDay === 0 ? 6 : jsDay - 1;
    if (!weekDays.includes(appDay)) continue;

    // Format date as YYYY-MM-DD in local timezone
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const endTime = addHoursToTime(startTime, durationHours);
    result.push({
      date: dateStr,
      startTime,
      endTime,
      plannedHours: durationHours,
    });
  }

  return result;
}

export function buildStandupTimeSlot(base: {
  employeeId: string;
  projectId: string;
  occurrence: StandupOccurrence;
  taskTitle: string;
  category?: string;
}): Omit<TimeSlot, 'id'> {
  const { employeeId, projectId, occurrence, taskTitle, category } = base;
  return {
    employeeId,
    projectId,
    taskId: undefined,
    date: occurrence.date,
    startTime: occurrence.startTime,
    endTime: occurrence.endTime,
    task: taskTitle,
    plannedHours: occurrence.plannedHours,
    actualHours: occurrence.plannedHours, // фактические всегда равны плановым для дейликов
    status: 'planned',
    category: category || 'Совещание',
    parentTaskId: undefined,
    taskSequence: undefined,
    totalTaskHours: undefined,
    isPaused: false,
    isRecurring: true,
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    recurrenceEndDate: undefined,
    recurrenceDays: undefined,
    parentRecurringId: undefined,
    recurrenceCount: undefined,
  };
}


