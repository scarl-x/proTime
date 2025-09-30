import React, { useMemo, useState } from 'react';
import { TimeSlot, User } from '../../types';

interface OverdueDeadlinesReportProps {
  timeSlots: TimeSlot[];
  employees: User[];
}

export const OverdueDeadlinesReport: React.FC<OverdueDeadlinesReportProps> = ({ timeSlots, employees }) => {
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'overdueCount' | 'avgDelay' | 'totalDelay'>('overdueCount');

  const employeeById = useMemo(() => {
    const map: Record<string, User> = {};
    for (const e of employees) map[e.id] = e;
    return map;
  }, [employees]);

  const stats = useMemo(() => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    type Agg = {
      employeeId: string;
      overdueCount: number;
      totalDelayDays: number;
      maxDelayDays: number;
      hardOverdueCount: number;
      slots: TimeSlot[];
    };

    const result: Record<string, Agg> = {};

    for (const slot of timeSlots) {
      if (!slot.employeeId) continue;
      const deadlineDate = slot.deadline ? new Date(slot.deadline) : null;
      const isCompleted = (slot.status as any) === 'completed' || (slot.status as any) === 'завершено';

      // Если нет дедлайна — пропускаем
      if (!deadlineDate) continue;

      // Считаем просроченными, если сегодня позже дедлайна и задача:
      // - не завершена, либо завершена, но завершение явно после дедлайна (у нас нет завершения, поэтому учитываем незавершенные)
      const isOverdue = deadlineDate < startOfToday && !isCompleted;
      if (!isOverdue) continue;

      const delayDays = Math.ceil((startOfToday.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));

      if (!result[slot.employeeId]) {
        result[slot.employeeId] = {
          employeeId: slot.employeeId,
          overdueCount: 0,
          totalDelayDays: 0,
          maxDelayDays: 0,
          hardOverdueCount: 0,
          slots: [],
        };
      }

      const rec = result[slot.employeeId];
      rec.overdueCount += 1;
      rec.totalDelayDays += delayDays;
      rec.maxDelayDays = Math.max(rec.maxDelayDays, delayDays);
      if (slot.deadlineType === 'hard') rec.hardOverdueCount += 1;
      rec.slots.push(slot);
    }

    let arr = Object.values(result).map(r => ({
      ...r,
      avgDelayDays: r.overdueCount > 0 ? +(r.totalDelayDays / r.overdueCount).toFixed(1) : 0,
      employee: employeeById[r.employeeId],
    }));

    if (onlyActive) {
      arr = arr.filter(r => r.overdueCount > 0);
    }

    arr.sort((a, b) => {
      if (sortBy === 'avgDelay') return b.avgDelayDays - a.avgDelayDays;
      if (sortBy === 'totalDelay') return b.totalDelayDays - a.totalDelayDays;
      return b.overdueCount - a.overdueCount;
    });

    return arr;
  }, [timeSlots, employees, employeeById, sortBy, onlyActive]);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Просроченные дедлайны</h3>
        <p className="text-xs text-gray-500 mt-1">Аналитика просрочек по сотрудникам</p>
      </div>

      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
            Показывать только с просрочками
          </label>
        </div>
        <div className="text-sm">
          Сортировка:
          <select
            className="ml-2 border rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="overdueCount">По количеству просрочек</option>
            <option value="avgDelay">По среднему опозданию (дни)</option>
            <option value="totalDelay">По сумме опозданий (дни)</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Просрочек</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Жёстких</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Средн. опоздание (дн)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма опозданий (дн)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Макс. опоздание (дн)</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((row) => (
              <tr key={row.employeeId} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-900">{row.employee?.name || row.employeeId}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.overdueCount}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.hardOverdueCount}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.avgDelayDays}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.totalDelayDays}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{row.maxDelayDays}</td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Нет данных о просроченных дедлайнах</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


