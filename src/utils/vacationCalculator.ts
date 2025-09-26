/**
 * Калькулятор отпускного баланса согласно ТК РФ
 */

export interface VacationCalculation {
  totalWorkedMonths: number;
  earnedDays: number;
  usedDays: number;
  currentBalance: number;
  canTakeVacation: boolean; // после 6 месяцев стажа
  nextEarnDate: string; // дата следующего начисления
  workYearStart: string; // начало рабочего года
  workYearEnd: string; // конец рабочего года
}

export interface VacationHistory {
  date: string;
  type: 'earned' | 'used';
  days: number;
  description: string;
  balance: number;
}

/**
 * Рассчитывает количество полных отработанных месяцев
 */
export function calculateWorkedMonths(employmentDate: string, currentDate: string): number {
  const startDate = new Date(employmentDate);
  const endDate = new Date(currentDate);
  
  if (startDate > endDate) return 0;
  
  let months = 0;
  const tempDate = new Date(startDate);
  
  while (tempDate < endDate) {
    const monthStart = new Date(tempDate);
    const monthEnd = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    
    // Если текущая дата меньше конца месяца, используем текущую дату
    const actualMonthEnd = endDate < monthEnd ? endDate : monthEnd;
    
    // Рассчитываем количество дней в месяце
    const daysInMonth = monthEnd.getDate();
    const workedDaysInMonth = Math.max(0, 
      Math.floor((actualMonthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    
    // Месяц считается полным, если отработано 15+ дней
    if (workedDaysInMonth >= 15) {
      months++;
    }
    
    // Переходим к следующему месяцу
    tempDate.setMonth(tempDate.getMonth() + 1);
    tempDate.setDate(1);
  }
  
  return months;
}

/**
 * Рассчитывает отпускной баланс согласно ТК РФ
 */
export function calculateVacationBalance(
  employmentDate: string,
  currentDate: string,
  usedVacationDays: number
): VacationCalculation {
  const startDate = new Date(employmentDate);
  const endDate = new Date(currentDate);
  
  // Рассчитываем отработанные месяцы
  const totalWorkedMonths = calculateWorkedMonths(employmentDate, currentDate);
  
  // Начисленные дни: 28 дней в год / 12 месяцев = 2.33 дня за месяц
  const earnedDays = Math.round(totalWorkedMonths * (28 / 12) * 100) / 100; // округляем до 2 знаков
  
  // Текущий баланс
  const currentBalance = Math.floor(earnedDays - usedVacationDays);
  
  // Право на отпуск после 6 месяцев стажа
  const canTakeVacation = totalWorkedMonths >= 6;
  
  // Рабочий год начинается с даты трудоустройства
  const workYearStart = new Date(startDate);
  const workYearEnd = new Date(startDate);
  workYearEnd.setFullYear(workYearEnd.getFullYear() + 1);
  workYearEnd.setDate(workYearEnd.getDate() - 1);
  
  // Дата следующего начисления (1 число следующего месяца)
  const nextEarnDate = new Date(endDate);
  nextEarnDate.setMonth(nextEarnDate.getMonth() + 1);
  nextEarnDate.setDate(1);
  
  return {
    totalWorkedMonths,
    earnedDays: Math.round(earnedDays * 100) / 100,
    usedDays: usedVacationDays,
    currentBalance,
    canTakeVacation,
    nextEarnDate: nextEarnDate.toISOString().split('T')[0],
    workYearStart: workYearStart.toISOString().split('T')[0],
    workYearEnd: workYearEnd.toISOString().split('T')[0],
  };
}

/**
 * Генерирует историю начислений и использования отпуска
 */
export function generateVacationHistory(
  employmentDate: string,
  currentDate: string,
  vacationRequests: Array<{ startDate: string; daysCount: number; status: string }>
): VacationHistory[] {
  const history: VacationHistory[] = [];
  const startDate = new Date(employmentDate);
  const endDate = new Date(currentDate);
  
  let currentBalance = 0;
  let currentMonth = new Date(startDate);
  currentMonth.setDate(1); // Начало месяца трудоустройства
  
  // Генерируем историю начислений по месяцам
  while (currentMonth <= endDate) {
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const actualMonthEnd = endDate < monthEnd ? endDate : monthEnd;
    
    // Рассчитываем отработанные дни в месяце
    const monthStart = currentMonth < startDate ? startDate : currentMonth;
    const workedDays = Math.floor((actualMonthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Если отработано 15+ дней, начисляем отпуск
    if (workedDays >= 15) {
      const earnedThisMonth = Math.round((28 / 12) * 100) / 100;
      currentBalance += earnedThisMonth;
      
      history.push({
        date: monthEnd.toISOString().split('T')[0],
        type: 'earned',
        days: earnedThisMonth,
        description: `Начислено за ${currentMonth.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} (${workedDays} дней)`,
        balance: Math.round(currentBalance * 100) / 100,
      });
    }
    
    // Переходим к следующему месяцу
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  
  // Добавляем использованные отпуска
  const approvedVacations = vacationRequests
    .filter(req => req.status === 'approved')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  
  approvedVacations.forEach(vacation => {
    currentBalance -= vacation.daysCount;
    history.push({
      date: vacation.startDate,
      type: 'used',
      days: vacation.daysCount,
      description: `Использован отпуск`,
      balance: Math.round(currentBalance * 100) / 100,
    });
  });
  
  // Сортируем по дате
  return history.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Проверяет, может ли сотрудник взять отпуск на указанное количество дней
 */
export function canTakeVacation(
  employmentDate: string,
  currentDate: string,
  usedVacationDays: number,
  requestedDays: number
): { canTake: boolean; reason?: string } {
  const calculation = calculateVacationBalance(employmentDate, currentDate, usedVacationDays);
  
  if (!calculation.canTakeVacation) {
    return {
      canTake: false,
      reason: 'Право на отпуск появляется после 6 месяцев работы'
    };
  }
  
  if (calculation.currentBalance < requestedDays) {
    return {
      canTake: false,
      reason: `Недостаточно дней отпуска. Доступно: ${calculation.currentBalance} дней`
    };
  }
  
  return { canTake: true };
}

/**
 * Форматирует количество месяцев в читаемый вид
 */
export function formatWorkedPeriod(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  let result = '';
  if (years > 0) {
    result += `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  }
  if (remainingMonths > 0) {
    if (result) result += ' ';
    result += `${remainingMonths} ${remainingMonths === 1 ? 'месяц' : remainingMonths < 5 ? 'месяца' : 'месяцев'}`;
  }
  
  return result || '0 месяцев';
}