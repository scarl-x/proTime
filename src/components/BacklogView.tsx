import React, { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, Filter } from 'lucide-react';
import { Task, User, Project, TimeSlot, TaskAssignment } from '../types';
import { useTasks } from '../hooks/useTasks';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { useProjects } from '../hooks/useProjects';
import { formatDate, formatTime } from '../utils/dateUtils';

interface BacklogViewProps {
  currentUser: User;
  onTaskClick?: (task: Task) => void;
  onScheduleTask?: (task: Task) => void;
}

type TaskStatus = 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';
type FilterStatus = 'all' | 'new' | 'planned' | 'in-progress' | 'code-review' | 'testing-internal' | 'testing-client' | 'closed';

const statusLabels: Record<TaskStatus, string> = {
  'new': 'Новая',
  'planned': 'Запланирована',
  'in-progress': 'В работе',
  'code-review': 'На ревью',
  'testing-internal': 'Тестирование',
  'testing-client': 'Тестирование клиента',
  'closed': 'Закрыта'
};

const statusColors: Record<TaskStatus, string> = {
  'new': 'bg-gray-100 text-gray-800',
  'planned': 'bg-yellow-100 text-yellow-800',
  'in-progress': 'bg-blue-100 text-blue-800',
  'code-review': 'bg-purple-100 text-purple-800',
  'testing-internal': 'bg-orange-100 text-orange-800',
  'testing-client': 'bg-pink-100 text-pink-800',
  'closed': 'bg-green-100 text-green-800'
};

const statusIcons: Record<TaskStatus, React.ComponentType<any>> = {
  'new': AlertCircle,
  'planned': Clock,
  'in-progress': Clock,
  'code-review': CheckCircle,
  'testing-internal': CheckCircle,
  'testing-client': CheckCircle,
  'closed': CheckCircle
};

export const BacklogView: React.FC<BacklogViewProps> = ({
  currentUser,
  onTaskClick,
  onScheduleTask
}) => {
  const { tasks, taskAssignments } = useTasks();
  const { timeSlots } = useTimeSlots();
  const { projects } = useProjects();
  
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'createdAt'>('createdAt');
  const [showFilters, setShowFilters] = useState(false);

  // Получаем задачи, назначенные на текущего пользователя, но не распределенные в календарь
  const getUnassignedTasks = () => {
    // Получаем ID задач, назначенных на текущего пользователя
    const assignedTaskIds = taskAssignments
      .filter(assignment => assignment.employeeId === currentUser.id)
      .map(assignment => assignment.taskId);

    // Получаем ID задач, которые уже распределены в календарь (через taskId)
    const scheduledTaskIds = timeSlots
      .filter(slot => slot.employeeId === currentUser.id)
      .map(slot => slot.taskId)
      .filter(Boolean);

    // Получаем названия задач, которые уже распределены в календарь (через название задачи)
    const scheduledTaskNames = timeSlots
      .filter(slot => slot.employeeId === currentUser.id)
      .map(slot => slot.task);

    // Возвращаем задачи, которые назначены на пользователя, но не распределены в календарь
    return tasks.filter(task => {
      const isAssigned = assignedTaskIds.includes(task.id);
      const isScheduledById = scheduledTaskIds.includes(task.id);
      
      // Проверяем, есть ли задача в календаре по названию
      // Учитываем, что задачи из проектов создаются с суффиксом " (из задачи проекта)"
      const isScheduledByName = scheduledTaskNames.some(name => {
        // Точное совпадение названия
        if (name === task.name) return true;
        // Совпадение с суффиксом из проекта
        if (name === `${task.name} (из задачи проекта)`) return true;
        // Частичное совпадение (на случай других форматов)
        if (name.includes(task.name) || task.name.includes(name)) return true;
        return false;
      });
      
      return isAssigned && !isScheduledById && !isScheduledByName;
    });
  };

  const unassignedTasks = getUnassignedTasks();

  // Фильтрация задач
  const getFilteredTasks = () => {
    let filtered = unassignedTasks;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterProject !== 'all') {
      filtered = filtered.filter(task => task.projectId === filterProject);
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          // В Task нет поля dueDate, используем createdAt
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredTasks = getFilteredTasks();


  const handleScheduleTask = (task: Task) => {
    if (onScheduleTask) {
      onScheduleTask(task);
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Неизвестный проект';
  };

  const getProjectColor = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#6B7280';
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Нераспределенные задачи</h1>
          <p className="text-gray-600 mt-1">
            Задачи, назначенные на вас, но еще не распределенные в календарь
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Фильтры
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все статусы</option>
                <option value="new">Новая</option>
                <option value="planned">Запланирована</option>
                <option value="in-progress">В работе</option>
                <option value="code-review">На ревью</option>
                <option value="testing-internal">Тестирование</option>
                <option value="testing-client">Тестирование клиента</option>
                <option value="closed">Закрыта</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Проект
              </label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все проекты</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сортировка
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">По дате создания</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет нераспределенных задач
            </h3>
            <p className="text-gray-500">
              Все ваши задачи уже распределены в календарь или отсутствуют
            </p>
          </div>
        ) : (
          filteredTasks.map(task => {
            const StatusIcon = statusIcons[task.status as TaskStatus] || AlertCircle;
            
            return (
              <div
                key={task.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {task.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[task.status as TaskStatus]}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusLabels[task.status as TaskStatus]}
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getProjectColor(task.projectId) }}
                          />
                          <span>{getProjectName(task.projectId)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-gray-600">
                            {task.plannedHours}ч
                          </span>
                        </div>
                        
                        
                        <div className="flex items-center gap-1">
                          <span>Создана: {formatDate(task.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {/* Schedule Task */}
                      <button
                        onClick={() => handleScheduleTask(task)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Распределить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
