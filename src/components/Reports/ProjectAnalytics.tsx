import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, Clock, Target, Filter, Calendar, User } from 'lucide-react';
import { Project, TimeSlot, User as UserType } from '../../types';
import { formatDate, getWeekStart } from '../../utils/dateUtils';

interface ProjectAnalyticsProps {
  projects: Project[];
  timeSlots: TimeSlot[];
  employees: UserType[];
}

interface ProjectStats {
  projectId: string;
  totalPlanned: number;
  totalActual: number;
  variance: number;
  completedTasks: number;
  totalTasks: number;
  efficiency: number;
  activeEmployees: number;
  weeklyData: { week: string; planned: number; actual: number }[];
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({
  projects,
  timeSlots,
  employees,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('month');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    return ranges[dateFilter as keyof typeof ranges] || ranges.month;
  };

  const getFilteredSlots = () => {
    const startDate = getDateRange();
    let filtered = timeSlots.filter(slot => 
      new Date(slot.date) >= startDate &&
      slot.task !== 'Ежедневный дейлик команды' // Исключаем дейлики из аналитики
    );

    if (selectedProject !== 'all') {
      filtered = filtered.filter(slot => slot.projectId === selectedProject);
    }

    if (employeeFilter !== 'all') {
      filtered = filtered.filter(slot => slot.employeeId === employeeFilter);
    }

    return filtered;
  };

  const calculateProjectStats = (projectId: string): ProjectStats => {
    const projectSlots = timeSlots.filter(slot => 
      slot.projectId === projectId &&
      slot.task !== 'Ежедневный дейлик команды' // Исключаем дейлики
    );
    const filteredSlots = getFilteredSlots().filter(slot => slot.projectId === projectId);

    const totalPlanned = filteredSlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActual = filteredSlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    const completedTasks = filteredSlots.filter(slot => slot.status === 'завершено').length;
    const totalTasks = filteredSlots.length;
    const activeEmployees = new Set(filteredSlots.map(slot => slot.employeeId)).size;

    // Weekly data for charts
    const weeklyData: { [key: string]: { planned: number; actual: number } } = {};
    filteredSlots.forEach(slot => {
      const week = getWeekStart(new Date(slot.date));
      if (!weeklyData[week]) {
        weeklyData[week] = { planned: 0, actual: 0 };
      }
      weeklyData[week].planned += slot.plannedHours;
      weeklyData[week].actual += slot.actualHours;
    });

    const weeklyDataArray = Object.entries(weeklyData)
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8); // Last 8 weeks

    return {
      projectId,
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      completedTasks,
      totalTasks,
      efficiency: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      activeEmployees,
      weeklyData: weeklyDataArray,
    };
  };

  const getOverallStats = () => {
    const filteredSlots = getFilteredSlots();
    const totalPlanned = filteredSlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActual = filteredSlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    const completedTasks = filteredSlots.filter(slot => slot.status === 'завершено').length;
    const totalTasks = filteredSlots.length;
    const activeProjects = new Set(filteredSlots.map(slot => slot.projectId)).size;
    const activeEmployees = new Set(filteredSlots.map(slot => slot.employeeId)).size;

    return {
      totalPlanned,
      totalActual,
      variance: totalActual - totalPlanned,
      completedTasks,
      totalTasks,
      efficiency: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      activeProjects,
      activeEmployees,
    };
  };

  const getEmployeeStats = () => {
    const filteredSlots = getFilteredSlots();
    const employeeStats: { [key: string]: any } = {};

    filteredSlots.forEach(slot => {
      if (!employeeStats[slot.employeeId]) {
        employeeStats[slot.employeeId] = {
          totalPlanned: 0,
          totalActual: 0,
          completedTasks: 0,
          totalTasks: 0,
        };
      }
      employeeStats[slot.employeeId].totalPlanned += slot.plannedHours;
      employeeStats[slot.employeeId].totalActual += slot.actualHours;
      employeeStats[slot.employeeId].totalTasks += 1;
      if (slot.status === 'completed') {
        employeeStats[slot.employeeId].completedTasks += 1;
      }
    });

    return Object.entries(employeeStats).map(([employeeId, stats]) => ({
      employeeId,
      name: employees.find(emp => emp.id === employeeId)?.name || 'Unknown',
      ...stats,
      efficiency: stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0,
      variance: stats.totalActual - stats.totalPlanned,
    }));
  };

  const overallStats = getOverallStats();
  const employeeStats = getEmployeeStats();
  const projectStats = projects.map(project => calculateProjectStats(project.id));

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return 'text-green-600 bg-green-50';
    if (efficiency >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 2) return 'text-green-600';
    if (Math.abs(variance) <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Аналитика проектов</h2>
          <p className="text-gray-600 mt-1">
            Детальная аналитика по проектам и сотрудникам
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Фильтры:</span>
          </div>
          
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все проекты</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">Последняя неделя</option>
            <option value="month">Последний месяц</option>
            <option value="quarter">Последний квартал</option>
            <option value="year">Последний год</option>
          </select>

          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все сотрудники</option>
            {employees.filter(emp => emp.role === 'employee').map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Общая эффективность</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {overallStats.efficiency.toFixed(1)}%
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
              <Target className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>Завершено задач</span>
              <span>{overallStats.completedTasks}/{overallStats.totalTasks}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Отработано часов</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {overallStats.totalActual}ч
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>Планировалось</span>
              <span>{overallStats.totalPlanned}ч</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Активные проекты</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {overallStats.activeProjects}
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
              <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs sm:text-sm text-gray-600">
              <span>Активных сотрудников</span>
              <span>{overallStats.activeEmployees}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Отклонение</p>
              <p className={`text-lg sm:text-2xl font-bold ${getVarianceColor(overallStats.variance)}`}>
                {overallStats.variance > 0 ? '+' : ''}{overallStats.variance}ч
              </p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-full">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xs sm:text-sm text-gray-600">
              {Math.abs(overallStats.variance) <= 2 ? 'В пределах нормы' : 'Требует внимания'}
            </div>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      {selectedProject === 'all' && (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Статистика по проектам</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Эффективность</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Часы</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Задачи</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Команда</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Отклонение</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projectStats.map((stats) => {
                  const project = projects.find(p => p.id === stats.projectId);
                  return (
                    <tr key={stats.projectId} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: project?.color }}
                          />
                          <span className="font-medium text-gray-900 text-sm truncate">{project?.name}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEfficiencyColor(stats.efficiency)}`}>
                          {stats.efficiency.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900">
                        {stats.totalActual}/{stats.totalPlanned}ч
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                        {stats.completedTasks}/{stats.totalTasks}
                      </td>
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                        {stats.activeEmployees} чел.
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className={`text-xs sm:text-sm font-medium ${getVarianceColor(stats.variance)}`}>
                          {stats.variance > 0 ? '+' : ''}{stats.variance}ч
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Performance */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Производительность сотрудников</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
          {employeeStats.map((stats) => (
            <div key={stats.employeeId} className="border rounded-lg p-3 sm:p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{stats.name}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {employees.find(emp => emp.id === stats.employeeId)?.position || 'Сотрудник'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Эффективность:</span>
                  <span className={`text-xs sm:text-sm font-medium ${getEfficiencyColor(stats.efficiency).split(' ')[0]}`}>
                    {stats.efficiency.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Часы:</span>
                  <span className="text-xs sm:text-sm font-medium">{stats.totalActual}/{stats.totalPlanned}ч</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Задачи:</span>
                  <span className="text-xs sm:text-sm font-medium">{stats.completedTasks}/{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">Отклонение:</span>
                  <span className={`text-xs sm:text-sm font-medium ${getVarianceColor(stats.variance)}`}>
                    {stats.variance > 0 ? '+' : ''}{stats.variance}ч
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Trend Chart */}
      {selectedProject !== 'all' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Динамика работы по неделям</h3>
          <div className="space-y-4">
            {projectStats.find(p => p.projectId === selectedProject)?.weeklyData.map((week, index) => (
              <div key={week.week} className="flex items-center space-x-4">
                <div className="w-24 text-sm text-gray-600">
                  {formatDate(week.week)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                      <div
                        className="bg-blue-500 h-4 rounded-full"
                        style={{ width: `${Math.min((week.planned / Math.max(...projectStats.find(p => p.projectId === selectedProject)?.weeklyData.map(w => w.planned) || [1])) * 100, 100)}%` }}
                      />
                      <div
                        className="bg-green-500 h-4 rounded-full absolute top-0"
                        style={{ 
                          width: `${Math.min((week.actual / Math.max(...projectStats.find(p => p.projectId === selectedProject)?.weeklyData.map(w => w.planned) || [1])) * 100, 100)}%`,
                          opacity: 0.7
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-600 w-20">
                      {week.actual}/{week.planned}ч
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-600">Планируемые часы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-600">Фактические часы</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};