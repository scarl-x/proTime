import React, { useMemo } from 'react';
import { TimeSlot, User } from '../../types';

interface OverdueTasksListProps {
  employee: User;
  timeSlots: TimeSlot[];
  projects: any[];
  onSlotClick?: (slot: TimeSlot) => void;
  onComplete?: (slot: TimeSlot) => void;
  onPostpone?: (slot: TimeSlot, days: number) => void;
}

export const OverdueTasksList: React.FC<OverdueTasksListProps> = ({ employee, timeSlots, projects, onSlotClick, onComplete, onPostpone }) => {
  const startOfToday = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const projectById = useMemo(() => Object.fromEntries(projects.map(p => [p.id, p])), [projects]);

  const overdueSlots = useMemo(() => {
    return timeSlots
      .filter(s => s.employeeId === employee.id)
      .filter(s => s.deadline)
      .filter(s => (s as any).status !== 'completed')
      .filter(s => new Date(s.deadline!) < startOfToday)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
  }, [timeSlots, employee.id, startOfToday]);

  const daysOverdue = (deadline: string) => {
    const diff = startOfToday.getTime() - new Date(deadline).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Просроченные задачи</h2>
          <p className="text-gray-600 mt-1">Все задачи сотрудника, по которым истёк дедлайн</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Задача</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Проект</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дедлайн</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Просрочка (дн.)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {overdueSlots.map(slot => (
              <tr key={slot.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 truncate max-w-[320px]" title={slot.task}>{slot.task}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{projectById[slot.projectId!]?.name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.date}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{slot.deadline}</td>
                <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">{daysOverdue(slot.deadline!)}</td>
                <td className="px-4 py-3 text-sm text-right space-x-2">
                  <button
                    className="px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                    onClick={() => onComplete && onComplete(slot)}
                  >
                    Завершить
                  </button>
                  <div className="inline-flex rounded-md shadow-sm align-middle" role="group">
                    {[1, 3, 7].map(d => (
                      <button
                        key={d}
                        className="px-2 py-1 border border-gray-200 text-gray-700 hover:bg-gray-50 first:rounded-l last:rounded-r"
                        onClick={() => onPostpone && onPostpone(slot, d)}
                        title={`Перенести на +${d} дн.`}
                      >
                        +{d}д
                      </button>
                    ))}
                  </div>
                  {onSlotClick && (
                    <button
                      className="ml-2 px-2 py-1 rounded border border-gray-200 hover:bg-gray-50"
                      onClick={() => onSlotClick(slot)}
                    >
                      Детали
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {overdueSlots.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">Нет просроченных задач</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


