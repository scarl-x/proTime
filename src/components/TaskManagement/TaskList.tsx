import React, { useState, useRef, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, Users, Clock, DollarSign, AlertTriangle, ChevronRight } from 'lucide-react';
import { UiPreferencesContext } from '../../utils/uiPreferencesContext';
import { Task, Project, User } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface TaskListProps {
  project: Project;
  tasks: Task[];
  employees: User[];
  currentUser: User;
  onCreateTask: () => void;
  onViewTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  calculateTaskOverrun: (task: Task) => number;
}

const STATUS_LABELS = {
  new: 'Новая',
  planned: 'Запланировано',
  'in-progress': 'В работе',
  'code-review': 'Код ревью',
  'testing-internal': 'Тестирование Проявление',
  'testing-client': 'Тестирование ФЗ',
  closed: 'Закрыто',
};

const STATUS_COLORS = {
  new: 'bg-gray-100 text-gray-800',
  planned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'code-review': 'bg-purple-100 text-purple-800',
  'testing-internal': 'bg-orange-100 text-orange-800',
  'testing-client': 'bg-yellow-100 text-yellow-800',
  closed: 'bg-green-100 text-green-800',
};

export const TaskList: React.FC<TaskListProps> = ({
  project,
  tasks,
  employees,
  currentUser,
  onCreateTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  calculateTaskOverrun,
}) => {
  const { hideExtended, setHideExtended } = React.useContext(UiPreferencesContext);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'plannedHours' | 'actualHours' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScrollHint, setShowScrollHint] = useState(false);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Проверяем, есть ли возможность прокрутки
  useEffect(() => {
    const checkScroll = () => {
      if (tableContainerRef.current) {
        const { scrollWidth, clientWidth } = tableContainerRef.current;
        setShowScrollHint(scrollWidth > clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tasks]);

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный';
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    return filtered;
  };

  const sortedTasks = [...getFilteredTasks()].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'createdAt') {
      aValue = new Date(a.createdAt).getTime();
      bValue = new Date(b.createdAt).getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredTasks = getFilteredTasks();
  const totalPlannedHours = filteredTasks.reduce((sum, task) => sum + task.plannedHours, 0);
  const totalActualHours = filteredTasks.reduce((sum, task) => sum + task.actualHours, 0);
  const totalCost = filteredTasks.reduce((sum, task) => sum + task.totalCost, 0);
  const totalOverrun = filteredTasks.reduce((sum, task) => sum + calculateTaskOverrun(task), 0);
  const isAdmin = currentUser.role === 'admin';

  // Проектные метрики: договор / план / факт и разницы
  const contractHours = (project as any).contractHours ?? 0;
  const plannedProjectHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
  const actualProjectHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const diffContractPlan = contractHours - plannedProjectHours;
  const diffPlanActual = plannedProjectHours - actualProjectHours;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Задачи проекта: {project.name}
          </h2>
          <p className="text-gray-600 mt-1">
            Управление задачами и распределение по сотрудникам
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Тумблер Расширенная информация (на странице проекта) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm">
            <span className="text-sm text-gray-700">Расширенная информация</span>
            <button
              type="button"
              onClick={() => setHideExtended(!hideExtended)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${!hideExtended ? 'bg-blue-600' : 'bg-gray-300'}`}
              aria-pressed={!hideExtended}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${!hideExtended ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </button>
          </div>
          <button
            onClick={onCreateTask}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>Создать задачу</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Статус:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Все статусы</option>
              <option value="new">Новая</option>
              <option value="planned">Запланировано</option>
              <option value="in-progress">В работе</option>
              <option value="code-review">Код ревью</option>
              <option value="testing-internal">Тестирование Проявление</option>
              <option value="testing-client">Тестирование ФЗ</option>
              <option value="closed">Закрыто</option>
            </select>
          </div>
          
          {statusFilter !== 'all' && (
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS]}
              </span>
              <button
                onClick={() => setStatusFilter('all')}
                className="text-blue-600 hover:text-blue-700 text-xs underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Всего задач</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTasks.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          {statusFilter !== 'all' && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">
                Из {tasks.length} общих задач
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Часы по договору</p>
              <p className="text-2xl font-bold text-gray-900">{contractHours}ч</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-xs ${diffContractPlan === 0 ? 'text-gray-500' : diffContractPlan > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Разница с планом: {diffContractPlan > 0 ? '+' : ''}{diffContractPlan}ч
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">План часов</p>
              <p className="text-2xl font-bold text-gray-900">{plannedProjectHours}ч</p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className={`text-xs ${diffPlanActual === 0 ? 'text-gray-500' : diffPlanActual > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              Разница с фактом: {diffPlanActual > 0 ? '+' : ''}{diffPlanActual}ч
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Факт часы</p>
              <p className="text-2xl font-bold text-gray-900">{actualProjectHours}ч</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Clock className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {isAdmin && !hideExtended && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Общая стоимость</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCost.toLocaleString('ru-RU')} ₽
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Подсказка о прокрутке */}
      {showScrollHint && tasks.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2">
          <ChevronRight className="h-5 w-5 text-blue-600 animate-pulse" />
          <p className="text-sm text-blue-800">
            <strong>Подсказка:</strong> Прокрутите таблицу вправо, чтобы увидеть все столбцы (перерасход, дата создания, действия)
          </p>
        </div>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden relative">
        <div 
          ref={tableContainerRef}
          className="overflow-x-auto"
          onScroll={() => {
            if (tableContainerRef.current) {
              const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current;
              setShowScrollHint(scrollLeft + clientWidth < scrollWidth - 10);
            }
          }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-80 max-w-xs"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Название задачи</span>
                    {sortBy === 'name' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Статус</span>
                    {sortBy === 'status' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('plannedHours')}
                >
                  <div className="flex items-center space-x-1">
                    <span>План/Факт часы</span>
                    {sortBy === 'plannedHours' && (
                      <span className="text-blue-500">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                {isAdmin && !hideExtended && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стоимость
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Перерасход
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создано
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTasks.map((task) => {
                const overrun = calculateTaskOverrun(task);
                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 max-w-xs">
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900 truncate"
                          title={task.name.length > 40 ? task.name : undefined}
                        >
                          {task.name}
                        </div>
                        {task.description && (
                          <div 
                            className="text-sm text-gray-500 truncate"
                            title={task.description.length > 40 ? task.description : undefined}
                          >
                            {task.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>План: {task.plannedHours}ч</div>
                        <div className={task.actualHours > task.plannedHours ? 'text-red-600' : 'text-green-600'}>
                          Факт: {task.actualHours}ч
                        </div>
                      </div>
                    </td>
                    {isAdmin && !hideExtended && (
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {task.totalCost.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.hourlyRate.toLocaleString('ru-RU')} ₽/ч
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${overrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {overrun > 0 ? `+${overrun}ч` : '0ч'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(task.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getEmployeeName(task.createdBy)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!task.contractHours && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200" title="Требуется заполнить часы по договору администратором">
                            Нужны часы по договору
                          </span>
                        )}
                        <button
                          onClick={() => onViewTask(task)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="Просмотр"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                          title="Редактировать"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Вы уверены, что хотите удалить задачу "${task.name}"?`)) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Индикатор горизонтальной прокрутки */}
        {showScrollHint && tasks.length > 0 && (
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none flex items-center justify-end pr-2">
            <div className="bg-blue-500 text-white rounded-full p-2 shadow-lg animate-pulse">
              <ChevronRight className="h-5 w-5" />
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">Нет задач в этом проекте</p>
            <button
              onClick={onCreateTask}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Создать первую задачу</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};