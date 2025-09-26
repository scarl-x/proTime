export interface RecurringTaskConfig {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number; // каждые N дней/недель/месяцев
  weekDays?: number[]; // для weekly: 0=Вс, 1=Пн, ..., 6=Сб
  endDate?: string;
  count?: number; // максимальное количество повторений
}

export const WEEKDAY_NAMES = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота'
];

export const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export function generateRecurringTasks(
  baseTask: any,
  config: RecurringTaskConfig,
  maxTasks: number = 100
): any[] {
  const tasks: any[] = [];
  const startDate = new Date(baseTask.date);
  let currentDate = new Date(startDate);
  let count = 0;

  const endDate = config.endDate ? new Date(config.endDate) : null;
  const maxCount = config.count || maxTasks;
  
  // Генерируем один UUID для всей серии повторяющихся задач
  const recurringSeriesId = crypto.randomUUID();

  while (count < maxCount) {
    // Проверяем, не превышена ли конечная дата
    if (endDate && currentDate > endDate) {
      break;
    }

    // Для первой задачи используем исходную дату
    if (count > 0) {
      // Генерируем следующую дату в зависимости от типа повторения
      switch (config.type) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + config.interval);
          break;
        case 'weekly':
          if (config.weekDays && config.weekDays.length > 0) {
            // Находим следующий подходящий день недели
            let found = false;
            let attempts = 0;
            while (!found && attempts < 14) { // максимум 2 недели поиска
              currentDate.setDate(currentDate.getDate() + 1);
              const dayOfWeek = currentDate.getDay();
              if (config.weekDays.includes(dayOfWeek)) {
                found = true;
              }
              attempts++;
            }
            if (!found) break; // выходим если не нашли подходящий день
          } else {
            currentDate.setDate(currentDate.getDate() + (7 * config.interval));
          }
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + config.interval);
          break;
      }
    }

    // Проверяем еще раз после вычисления новой даты
    if (endDate && currentDate > endDate) {
      break;
    }

    // Для еженедельного повторения проверяем день недели
    if (config.type === 'weekly' && config.weekDays && config.weekDays.length > 0) {
      const dayOfWeek = currentDate.getDay();
      if (count > 0 && !config.weekDays.includes(dayOfWeek)) {
        continue; // пропускаем этот день
      }
    }

    const task = {
      ...baseTask,
      date: currentDate.toISOString().split('T')[0],
      isRecurring: count === 0, // только первая задача помечается как повторяющаяся
      recurrenceType: count === 0 ? config.type : undefined,
      recurrenceInterval: count === 0 ? config.interval : undefined,
      recurrenceEndDate: count === 0 ? config.endDate : undefined,
      recurrenceDays: count === 0 ? config.weekDays?.map(d => d.toString()) : undefined,
      recurrenceCount: count === 0 ? config.count : undefined,
      parentRecurringId: count > 0 ? recurringSeriesId : undefined,
    };

    tasks.push(task);
    count++;

    // Для ежедневного и ежемесячного повторения переходим к следующей итерации
    if (config.type !== 'weekly') {
      continue;
    }

    // Для еженедельного повторения, если указаны конкретные дни
    if (config.type === 'weekly' && config.weekDays && config.weekDays.length > 1) {
      // Добавляем остальные дни текущей недели
      const currentWeekStart = new Date(currentDate);
      currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
      
      for (const dayOfWeek of config.weekDays) {
        if (dayOfWeek === currentDate.getDay()) continue; // уже добавили
        
        const taskDate = new Date(currentWeekStart);
        taskDate.setDate(currentWeekStart.getDate() + dayOfWeek);
        
        if (taskDate <= currentDate) continue; // не добавляем прошедшие дни
        if (endDate && taskDate > endDate) continue;
        
        const weekTask = {
          ...baseTask,
          date: taskDate.toISOString().split('T')[0],
          parentRecurringId: recurringSeriesId,
        };
        
        tasks.push(weekTask);
        count++;
        
        if (count >= maxCount) break;
      }
    }
  }

  return tasks;
}

export function getRecurrenceDescription(
  type?: 'daily' | 'weekly' | 'monthly',
  interval?: number,
  weekDays?: string[],
  endDate?: string,
  count?: number
): string {
  if (!type) return '';

  let description = '';

  switch (type) {
    case 'daily':
      description = interval === 1 ? 'Каждый день' : `Каждые ${interval} дня`;
      break;
    case 'weekly':
      if (weekDays && weekDays.length > 0) {
        const dayNames = weekDays.map(d => WEEKDAY_SHORT[parseInt(d)]).join(', ');
        description = interval === 1 
          ? `Каждую неделю (${dayNames})`
          : `Каждые ${interval} недели (${dayNames})`;
      } else {
        description = interval === 1 ? 'Каждую неделю' : `Каждые ${interval} недели`;
      }
      break;
    case 'monthly':
      description = interval === 1 ? 'Каждый месяц' : `Каждые ${interval} месяца`;
      break;
  }

  if (endDate) {
    description += ` до ${new Date(endDate).toLocaleDateString('ru-RU')}`;
  } else if (count) {
    description += ` (${count} раз)`;
  }

  return description;
}

export function isRecurringTask(task: any): boolean {
  return task.isRecurring === true;
}

export function isRecurringInstance(task: any): boolean {
  return !!task.parentRecurringId;
}