import React, { useMemo, useState } from 'react';
import { Calendar, Clock, Users, CheckCircle2, Trash2 } from 'lucide-react';
import { Project, User } from '../../types';
import { useDailyStandups, TeamStandupConfig } from '../../hooks/useDailyStandups';

interface DailyStandupSettingsProps {
  projects: Project[];
  employees: User[];
  onNotify?: (type: 'success' | 'error' | 'info', message: string) => void;
}

const WEEKDAYS = [
  { id: 0, label: 'Пн' },
  { id: 1, label: 'Вт' },
  { id: 2, label: 'Ср' },
  { id: 3, label: 'Чт' },
  { id: 4, label: 'Пт' },
  { id: 5, label: 'Сб' },
  { id: 6, label: 'Вс' },
];

export const DailyStandupSettings: React.FC<DailyStandupSettingsProps> = ({ projects, employees, onNotify }) => {
  const { isProcessing, createStandupsForTeam, deleteStandupsForTeam } = useDailyStandups();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([0,1,2,3,4]);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState(0.5);
  const [customTitle, setCustomTitle] = useState('Ежедневный дейлик команды');
  const [strictTitleDelete, setStrictTitleDelete] = useState(true);
  const [useProjectMembers, setUseProjectMembers] = useState(true);
  const [manualEmployeeIds, setManualEmployeeIds] = useState<string[]>([]);

  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId) || null, [projects, selectedProjectId]);

  const projectEmployees = useMemo(() => {
    if (!selectedProject) return [];
    return employees.filter(emp => selectedProject.teamMembers?.includes(emp.id) || false);
  }, [selectedProject, employees]);

  const participants = useMemo(() => {
    if (useProjectMembers) {
      return selectedProject?.teamMembers || [];
    }
    return manualEmployeeIds;
  }, [useProjectMembers, manualEmployeeIds, selectedProject]);

  const handleToggleWeekDay = (dayId: number) => {
    setSelectedWeekDays(prev => prev.includes(dayId) ? prev.filter(id => id !== dayId) : [...prev, dayId].sort());
  };

  const handleToggleEmployee = (employeeId: string) => {
    setManualEmployeeIds(prev => prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]);
  };

  const handleCreate = async () => {
    if (!selectedProject) return;

    const cfg: TeamStandupConfig = {
      projectId: selectedProject.id,
      employeeIds: participants,
      startDate,
      endDate,
      weekDays: selectedWeekDays,
      startTime,
      durationHours,
      title: customTitle,
      category: 'Совещание',
    };

    try {
      const { created } = await createStandupsForTeam(cfg, selectedProject, employees);
      onNotify?.('success', `Создано дейликов: ${created}`);
    } catch (e) {
      onNotify?.('error', 'Не удалось создать дейлики');
    }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    if (!window.confirm('Удалить дейлики за указанный период? Действие необратимо.')) return;

    try {
      const { deleted } = await deleteStandupsForTeam({
        projectId: selectedProject.id,
        startDate,
        endDate,
        titleEquals: strictTitleDelete ? customTitle : undefined,
      });
      onNotify?.('success', `Удалено дейликов: ${deleted}`);
    } catch (e) {
      onNotify?.('error', 'Не удалось удалить дейлики');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Настройки дейликов по командам
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Проект (команда)</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Выберите проект</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Заголовок события</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ежедневный дейлик команды"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Период: начало</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Период: окончание</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Дни недели</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleToggleWeekDay(d.id)}
                  className={`px-3 py-1 rounded-lg border text-sm ${selectedWeekDays.includes(d.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Clock className="h-4 w-4"/>Время начала</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Длительность (часы)</label>
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={durationHours}
                onChange={(e) => setDurationHours(parseFloat(e.target.value) || 0.5)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"><Users className="h-4 w-4"/>Участники</label>
            <div className="flex items-center gap-3 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={useProjectMembers}
                  onChange={() => setUseProjectMembers(true)}
                />
                <span>Все участники проекта</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!useProjectMembers}
                  onChange={() => setUseProjectMembers(false)}
                />
                <span>Выбрать вручную</span>
              </label>
            </div>

            {!useProjectMembers && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {projectEmployees.map(emp => (
                  <label key={emp.id} className={`flex items-center gap-2 p-2 rounded border ${manualEmployeeIds.includes(emp.id) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={manualEmployeeIds.includes(emp.id)}
                      onChange={() => handleToggleEmployee(emp.id)}
                    />
                    <span className="text-sm text-gray-800">{emp.name}</span>
                  </label>
                ))}
                {projectEmployees.length === 0 && (
                  <div className="col-span-full text-sm text-gray-500 p-2">
                    В проекте нет участников
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <input
              id="strictTitleDelete"
              type="checkbox"
              checked={strictTitleDelete}
              onChange={(e) => setStrictTitleDelete(e.target.checked)}
            />
            <label htmlFor="strictTitleDelete">Удалять только с заголовком “{customTitle}”</label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedProject || isProcessing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-60"
            >
              <Trash2 className="h-5 w-5" />
              Удалить дейлики
            </button>

            <button
            type="button"
            disabled={!selectedProject || selectedWeekDays.length === 0 || participants.length === 0 || isProcessing}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
              <CheckCircle2 className="h-5 w-5" />
              Создать дейлики
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">Дейлики будут видны в календаре и в списках задач; фактические часы равны плановым.</p>
      </div>
    </div>
  );
};


