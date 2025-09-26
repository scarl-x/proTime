import React from 'react';
import { WeeklyReport as WeeklyReportType, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface WeeklyReportProps {
  reports: WeeklyReportType[];
  employees: User[];
}

export const WeeklyReport: React.FC<WeeklyReportProps> = ({ reports, employees }) => {
  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный сотрудник';
  };

  // Фильтруем дейлики из отчетов
  const getFilteredSlots = (slots: any[]) => {
    return slots.filter(slot => slot.task !== 'Ежедневный дейлик команды');
  };

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-green-600';
    if (Math.abs(variance) <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceBg = (variance: number) => {
    if (variance === 0) return 'bg-green-50 border-green-200';
    if (Math.abs(variance) <= 2) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Еженедельные отчеты
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Детальный анализ производительности команды
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сотрудник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Неделя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Плановые часы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Фактические часы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Отклонение
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {getEmployeeName(report.employeeId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.totalPlannedHours}ч
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {report.totalActualHours}ч
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getVarianceColor(report.variance)}`}>
                      {report.variance > 0 ? '+' : ''}{report.variance}ч
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVarianceBg(
                        report.variance
                      )} ${getVarianceColor(report.variance)}`}
                    >
                      {report.variance === 0
                        ? 'Точно в срок'
                        : Math.abs(report.variance) <= 2
                        ? 'Небольшое отклонение'
                        : 'Значительное отклонение'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed breakdown */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-sm border p-6 ${getVarianceBg(report.variance)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {getEmployeeName(report.employeeId)}
                </h4>
                <span
                  className={`text-sm font-medium ${getVarianceColor(report.variance)}`}
                >
                  {report.variance > 0 ? '+' : ''}{report.variance}ч
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Плановые часы:</span>
                  <span className="font-medium">{report.totalPlannedHours}ч</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Фактические часы:</span>
                  <span className="font-medium">{report.totalActualHours}ч</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Количество задач:</span>
                  <span className="font-medium">{getFilteredSlots(report.slots).length}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="text-xs text-gray-500">
                  {formatDate(report.weekStart)} - {formatDate(report.weekEnd)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};