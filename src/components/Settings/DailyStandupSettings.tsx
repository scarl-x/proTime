import React, { useState } from 'react';
import { Clock, Users, Calendar, Settings, Save, RefreshCw, Folder } from 'lucide-react';
import { DailyStandupConfig } from '../../utils/dailyStandupUtils';
import { Project } from '../../types';

interface DailyStandupSettingsProps {
  configs: { [projectId: string]: DailyStandupConfig };
  projects: Project[];
  getProjectConfig: (projectId: string) => DailyStandupConfig;
  onUpdateConfig: (projectId: string, config: Partial<DailyStandupConfig>) => void;
  onInitializeStandups: () => void;
  standupStats: {
    total: number;
    completed: number;
    completionRate: number;
    todayCount: number;
    todayCompleted: number;
    projectStats: Array<{
      projectId: string;
      projectName: string;
      isEnabled: boolean;
      total: number;
      completed: number;
    }>;
  };
}

const WEEKDAYS = [
  { id: 1, name: 'Понедельник', short: 'Пн' },
  { id: 2, name: 'Вторник', short: 'Вт' },
  { id: 3, name: 'Среда', short: 'Ср' },
  { id: 4, name: 'Четверг', short: 'Чт' },
  { id: 5, name: 'Пятница', short: 'Пт' },
  { id: 6, name: 'Суббота', short: 'Сб' },
  { id: 0, name: 'Воскресенье', short: 'Вс' },
];

export const DailyStandupSettings: React.FC<DailyStandupSettingsProps> = ({
  configs,
  projects,
  getProjectConfig,
  onUpdateConfig,
  onInitializeStandups,
  standupStats,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [hasChanges, setHasChanges] = useState<{ [projectId: string]: boolean }>({});

  const currentConfig = getProjectConfig(selectedProjectId);
  const localConfig = localConfigs[selectedProjectId] || currentConfig;
  const handleConfigChange = (updates: Partial<DailyStandupConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfigs(prev => ({ ...prev, [selectedProjectId]: newConfig }));
    setHasChanges(prev => ({ ...prev, [selectedProjectId]: true }));
    
    // Если изменили статус включения/отключения, сразу сохраняем
    if (updates.isEnabled !== undefined) {
      console.log('Изменен статус дейликов для проекта', selectedProjectId, 'на:', updates.isEnabled);
      onUpdateConfig(selectedProjectId, newConfig);
      setHasChanges(prev => ({ ...prev, [selectedProjectId]: false }));
    }
  };

  const handleSave = () => {
    console.log('Сохраняем конфигурацию дейликов для проекта:', selectedProjectId, localConfig);
    onUpdateConfig(selectedProjectId, localConfig);
    setHasChanges(prev => ({ ...prev, [selectedProjectId]: false }));
  };

  const toggleWorkDay = (dayId: number) => {
    const newWorkDays = localConfig.workDays.includes(dayId)
      ? localConfig.workDays.filter(d => d !== dayId)
      : [...localConfig.workDays, dayId].sort();
    
    handleConfigChange({ workDays: newWorkDays });
  };

  const calculateDuration = () => {
    if (!localConfig.startTime || !localConfig.endTime) return 0;
    const start = new Date(`2000-01-01 ${localConfig.startTime}`);
    const end = new Date(`2000-01-01 ${localConfig.endTime}`);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Настройки ежедневных дейликов</h2>
          <p className="text-gray-600 mt-1">
            Автоматическое создание ежедневных совещаний для всей команды
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего дейликов</p>
              <p className="text-2xl font-bold text-gray-900">{standupStats.total}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Завершено</p>
              <p className="text-2xl font-bold text-gray-900">{standupStats.completed}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              {standupStats.completionRate.toFixed(1)}% выполнено
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Сегодня</p>
              <p className="text-2xl font-bold text-gray-900">
                {standupStats.todayCompleted}/{standupStats.todayCount}
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Статус</p>
              <p className={`text-lg font-bold ${localConfig.isEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {localConfig.isEnabled ? 'Включено' : 'Отключено'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${localConfig.isEnabled ? 'bg-green-100' : 'bg-red-100'}`}>
              <Settings className={`h-6 w-6 ${localConfig.isEnabled ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Активных проектов</p>
              <p className="text-2xl font-bold text-gray-900">
                {standupStats.projectStats.filter(p => p.isEnabled).length}
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Folder className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-xs text-gray-500">
              из {projects.length} проектов
            </p>
          </div>
        </div>
      </div>

      {/* Project Stats */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Статистика по проектам</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Проект</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Время</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Всего дейликов</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Завершено</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {standupStats.projectStats.map((projectStat) => {
                const project = projects.find(p => p.id === projectStat.projectId);
                const projectConfig = getProjectConfig(projectStat.projectId);
                return (
                  <tr key={projectStat.projectId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: project?.color }}
                        />
                        <span className="font-medium text-gray-900">{projectStat.projectName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        projectStat.isEnabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {projectStat.isEnabled ? 'Включено' : 'Отключено'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {projectConfig.startTime} - {projectConfig.endTime}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {projectStat.total}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {projectStat.completed}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {/* Configuration */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Настройки дейликов</h3>
          
          {/* Project Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Проект:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Автоматические дейлики для проекта "{projects.find(p => p.id === selectedProjectId)?.name}"
              </h4>
              <p className="text-sm text-gray-600">
                Создавать ежедневные совещания автоматически для участников команды этого проекта
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.isEnabled}
                onChange={(e) => handleConfigChange({ isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {localConfig.isEnabled && (
            <>
              {/* Time Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>Время начала</span>
                  </label>
                  <input
                    type="time"
                    value={localConfig.startTime}
                    onChange={(e) => handleConfigChange({ startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4" />
                    <span>Время окончания</span>
                  </label>
                  <input
                    type="time"
                    value={localConfig.endTime}
                    onChange={(e) => handleConfigChange({ endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Продолжительность
                  </label>
                  <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                    {calculateDuration()} часов
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название задачи
                  </label>
                  <input
                    type="text"
                    value={localConfig.task}
                    onChange={(e) => handleConfigChange({ task: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ежедневный дейлик команды"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Категория
                  </label>
                  <input
                    type="text"
                    value={localConfig.category}
                    onChange={(e) => handleConfigChange({ category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Совещание"
                  />
                </div>
              </div>

              {/* Work Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Рабочие дни
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleWorkDay(day.id)}
                      className={`px-4 py-2 text-sm rounded-lg transition duration-200 ${
                        localConfig.workDays.includes(day.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Выберите дни недели для автоматического создания дейликов
                </p>
              </div>

              {/* Preview */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Предварительный просмотр</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Проект:</strong> {projects.find(p => p.id === selectedProjectId)?.name}</p>
                  <p><strong>Время:</strong> {localConfig.startTime} - {localConfig.endTime} ({calculateDuration()}ч)</p>
                  <p><strong>Задача:</strong> {localConfig.task}</p>
                  <p><strong>Категория:</strong> {localConfig.category}</p>
                  <p><strong>Дни:</strong> {localConfig.workDays.map(d => WEEKDAYS.find(w => w.id === d)?.short).join(', ')}</p>
                  <p><strong>Участники команды:</strong> {projects.find(p => p.id === selectedProjectId)?.teamMembers.length || 0} чел.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={onInitializeStandups}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Создать дейлики на месяц</span>
          </button>

          {hasChanges[selectedProjectId] && (
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              <Save className="h-4 w-4" />
              <span>Сохранить настройки</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};