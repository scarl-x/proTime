export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ru-RU');
};

export const formatTime = (time: string): string => {
  return time;
};

export const getWeekStart = (date: Date): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const getWeekDates = (weekStart: string): string[] => {
  const dates: string[] = [];
  const start = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

export const getDayName = (date: string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', { weekday: 'short' });
};

export const getMonthName = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
};