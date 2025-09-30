import React, { useMemo, useState } from 'react';
import { TimeSlot, User, Project } from '../../types';

interface PerformanceAnalyticsProps {
  timeSlots: TimeSlot[];
  employees: User[];
  projects: Project[];
}

type Range = 'last4w' | 'last12w' | 'ytd';

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ timeSlots, employees, projects }) => {
  const [range, setRange] = useState<Range>('last4w');

  const today = new Date();
  const startDate = useMemo(() => {
    const d = new Date(today);
    if (range === 'last4w') d.setDate(d.getDate() - 7 * 4);
    if (range === 'last12w') d.setDate(d.getDate() - 7 * 12);
    if (range === 'ytd') d.setMonth(0, 1);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, [range]);

  const filtered = useMemo(() => {
    return timeSlots.filter(s => new Date(s.date) >= startDate);
  }, [timeSlots, startDate]);

  const kpis = useMemo(() => {
    const planned = filtered.reduce((sum, s) => sum + s.plannedHours, 0);
    const actual = filtered.reduce((sum, s) => sum + s.actualHours, 0);
    const completed = filtered.filter(s => (s.status as any) === 'completed' || (s.status as any) === 'завершено').length;
    const total = filtered.length;
    const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

    // SLA дедлайнов: доля задач, завершенных без просрочки (приближенно: дедлайн не просрочен или завершено до дедлайна; без даты завершения считаем по факту отсутствия просрочки сейчас)
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const withDeadline = filtered.filter(s => !!s.deadline);
    const notOverdueNow = withDeadline.filter(s => new Date(s.deadline!) >= startOfToday || (s.status as any) === 'completed' || (s.status as any) === 'завершено');
    const sla = withDeadline.length > 0 ? Math.round((notOverdueNow.length / withDeadline.length) * 100) : 100;

    return { planned, actual, efficiency, sla };
  }, [filtered]);

  const byEmployee = useMemo(() => {
    const map = new Map<string, { planned: number; actual: number; overdue: number }>();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (const s of filtered) {
      if (!map.has(s.employeeId)) map.set(s.employeeId, { planned: 0, actual: 0, overdue: 0 });
      const rec = map.get(s.employeeId)!;
      rec.planned += s.plannedHours;
      rec.actual += s.actualHours;
      if (s.deadline && new Date(s.deadline) < startOfToday && ((s.status as any) !== 'completed' && (s.status as any) !== 'завершено')) rec.overdue += 1;
    }
    return Array.from(map.entries()).map(([employeeId, v]) => ({ employeeId, ...v }));
  }, [filtered]);

  const byProject = useMemo(() => {
    const map = new Map<string, { planned: number; actual: number; overdue: number }>();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    for (const s of filtered) {
      if (!map.has(s.projectId)) map.set(s.projectId, { planned: 0, actual: 0, overdue: 0 });
      const rec = map.get(s.projectId)!;
      rec.planned += s.plannedHours;
      rec.actual += s.actualHours;
      if (s.deadline && new Date(s.deadline) < startOfToday && ((s.status as any) !== 'completed' && (s.status as any) !== 'завершено')) rec.overdue += 1;
    }
    return Array.from(map.entries()).map(([projectId, v]) => ({ projectId, ...v }));
  }, [filtered]);

  const nameByEmployee = useMemo(() => Object.fromEntries(employees.map(e => [e.id, e.name])), [employees]);
  const nameByProject = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p.name])), [projects]);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Производительность команды</h3>
        <p className="text-xs text-gray-500 mt-1">Современная аналитика: KPI, SLA дедлайнов, разрез по проектам и сотрудникам</p>
      </div>

      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="text-sm">
          Период:
          <select className="ml-2 border rounded px-2 py-1 text-sm" value={range} onChange={e => setRange(e.target.value as Range)}>
            <option value="last4w">Последние 4 недели</option>
            <option value="last12w">Последние 12 недель</option>
            <option value="ytd">С начала года</option>
          </select>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
          <div className="text-xs text-blue-700">План, ч</div>
          <div className="text-xl font-semibold text-blue-900">{kpis.planned}</div>
        </div>
        <div className="p-4 rounded-lg bg-green-50 border border-green-100">
          <div className="text-xs text-green-700">Факт, ч</div>
          <div className="text-xl font-semibold text-green-900">{kpis.actual}</div>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-100">
          <div className="text-xs text-purple-700">Завершено, %</div>
          <div className="text-xl font-semibold text-purple-900">{kpis.efficiency}%</div>
        </div>
        <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
          <div className="text-xs text-amber-700">SLA дедлайнов</div>
          <div className="text-xl font-semibold text-amber-900">{kpis.sla}%</div>
        </div>
      </div>

      {/* Разрез по сотрудникам */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">По сотрудникам</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сотрудник</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">План, ч</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Факт, ч</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Просрочек</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {byEmployee.map(r => (
                <tr key={r.employeeId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{nameByEmployee[r.employeeId] || r.employeeId}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.planned}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.actual}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.overdue}</td>
                </tr>
              ))}
              {byEmployee.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Разрез по проектам */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">По проектам</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Проект</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">План, ч</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Факт, ч</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Просрочек</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {byProject.map(r => (
                <tr key={r.projectId} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{nameByProject[r.projectId] || r.projectId}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.planned}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.actual}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{r.overdue}</td>
                </tr>
              ))}
              {byProject.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">Нет данных</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


