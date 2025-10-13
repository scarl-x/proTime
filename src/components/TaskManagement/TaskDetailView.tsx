import React, { useState } from 'react';
import { X, Users, Clock, DollarSign, AlertTriangle, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { Task, TaskAssignment, User, TimeSlot, Project } from '../../types';
import { formatDate } from '../../utils/dateUtils';
import { TaskDistributionModal } from './TaskDistributionModal';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { UiPreferencesContext } from '../../utils/uiPreferencesContext';

interface TaskDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  assignments: TaskAssignment[];
  employees: User[];
  currentUser: User;
  project: Project;
  timeSlots: TimeSlot[];
  onCreateTimeSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  onAssignEmployee: (taskId: string, employeeId: string, allocatedHours: number) => void;
  onUpdateAssignment: (assignmentId: string, updates: Partial<TaskAssignment>) => void;
  onRemoveAssignment: (assignmentId: string) => void;
  calculateTaskOverrun: (task: Task) => number;
  calculateEmployeeOverrun: (taskId: string, employeeId: string) => number;
}

export const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  isOpen,
  onClose,
  task,
  assignments,
  employees,
  currentUser,
  project,
  timeSlots,
  onCreateTimeSlot,
  onAssignEmployee,
  onUpdateAssignment,
  onRemoveAssignment,
  calculateTaskOverrun,
  calculateEmployeeOverrun,
}) => {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TaskAssignment | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [allocatedHours, setAllocatedHours] = useState(0);
  const { hideExtended } = React.useContext(UiPreferencesContext);

  if (!isOpen) return null;

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный';
  };

  const getEmployeePosition = (id: string) => {
    return employees.find(emp => emp.id === id)?.position || 'Сотрудник';
  };

  const totalAllocatedHours = assignments.reduce((sum, assignment) => sum + assignment.allocatedHours, 0);
  const remainingHours = task.plannedHours - totalAllocatedHours;
  const taskOverrun = calculateTaskOverrun(task);

  // Админ должен рассматриваться как сотрудник: разрешаем назначать задачи на всех пользователей
  const isAdmin = currentUser.role === 'admin';
  const projectMemberIds = new Set(project.teamMembers);
  const candidateEmployees = isAdmin
    ? employees
    : employees.filter(emp => projectMemberIds.has(emp.id));

  const availableEmployees = candidateEmployees.filter(emp =>
    !assignments.some(assignment => assignment.employeeId === emp.id)
  );

  const handleAssignEmployee = () => {
    if (selectedEmployeeId && allocatedHours > 0) {
      onAssignEmployee(task.id, selectedEmployeeId, allocatedHours);
      setShowAssignModal(false);
      setSelectedEmployeeId('');
      setAllocatedHours(0);
    }
  };

  const handleDistributeToEmployee = (assignment: TaskAssignment) => {
    setSelectedAssignment(assignment);
    setShowDistributionModal(true);
  };

  const STATUS_LABELS = {
    new: 'Новая',
    planned: 'Запланировано',
    'in-progress': 'В работе',
    'code-review': 'Код ревью',
    'testing-internal': 'Тестирование Проявление',
    'testing-client': 'Тестирование ФЗ',
    closed: 'Закрыто',
    'on-hold': 'Приостановлено',
  };

  const STATUS_COLORS = {
    new: 'bg-gray-100 text-gray-800',
    planned: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'code-review': 'bg-purple-100 text-purple-800',
    'testing-internal': 'bg-orange-100 text-orange-800',
    'testing-client': 'bg-yellow-100 text-yellow-800',
    closed: 'bg-green-100 text-green-800',
    'on-hold': 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{task.name}</h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${STATUS_COLORS[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Task Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Плановые часы</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{task.plannedHours}ч</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Фактические часы</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{task.actualHours}ч</p>
            </div>

            {isAdmin && !hideExtended && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Стоимость</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {task.totalCost.toLocaleString('ru-RU')} ₽
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {task.hourlyRate.toLocaleString('ru-RU')} ₽/ч
                </p>
              </div>
            )}

            <div className={`rounded-lg p-4 ${taskOverrun > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className={`h-5 w-5 ${taskOverrun > 0 ? 'text-red-600' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${taskOverrun > 0 ? 'text-red-900' : 'text-green-900'}`}>
                  Перерасход
                </span>
              </div>
              <p className={`text-2xl font-bold ${taskOverrun > 0 ? 'text-red-900' : 'text-green-900'}`}>
                {taskOverrun > 0 ? `+${taskOverrun}ч` : '0ч'}
              </p>
            </div>
          </div>

          {/* Finance section (admin only) */}
          {isAdmin && !hideExtended && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Финансы</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">Ставка за час</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{task.hourlyRate.toLocaleString('ru-RU')} ₽/ч</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <span className="text-sm font-medium text-gray-700">Плановая стоимость</span>
                  <p className="text-xl font-bold text-gray-900">{(task.plannedHours * task.hourlyRate).toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="bg-white rounded-lg border p-4">
                  <span className="text-sm font-medium text-gray-700">Текущая стоимость</span>
                  <p className="text-xl font-bold text-gray-900">{task.totalCost.toLocaleString('ru-RU')} ₽</p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Описание</h3>
              <div className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                <MarkdownRenderer content={task.description} />
              </div>
            </div>
          )}

          {/* Hours Distribution */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Распределение часов</h3>
              <div className="text-sm text-gray-600">
                Распределено: {totalAllocatedHours}ч из {task.plannedHours}ч
                {remainingHours > 0 && (
                  <span className="text-orange-600 ml-2">
                    (осталось: {remainingHours}ч)
                  </span>
                )}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((totalAllocatedHours / task.plannedHours) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Employee Assignments */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Назначения сотрудников</h3>
              <button
                onClick={() => setShowAssignModal(true)}
                disabled={availableEmployees.length === 0 || remainingHours <= 0}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span>Назначить сотрудника</span>
              </button>
            </div>

            {assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const employeeOverrun = calculateEmployeeOverrun(task.id, assignment.employeeId);
                  return (
                    <div key={assignment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {getEmployeeName(assignment.employeeId)}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {getEmployeePosition(assignment.employeeId)}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Выделено:</span>
                              <span className="font-medium ml-1">{assignment.allocatedHours}ч</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Потрачено:</span>
                              <span className={`font-medium ml-1 ${
                                assignment.actualHours > assignment.allocatedHours ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {assignment.actualHours}ч
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Перерасход:</span>
                              <span className={`font-medium ml-1 ${employeeOverrun > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {employeeOverrun > 0 ? `+${employeeOverrun}ч` : '0ч'}
                              </span>
                            </div>
                          </div>

                          {/* Progress bar for employee */}
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  assignment.actualHours > assignment.allocatedHours ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${Math.min((assignment.actualHours / assignment.allocatedHours) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleDistributeToEmployee(assignment)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                            title="Распределить в календарь"
                          >
                            <Calendar className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Удалить назначение для ${getEmployeeName(assignment.employeeId)}?`)) {
                                onRemoveAssignment(assignment.id);
                              }
                            }}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                            title="Удалить назначение"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Задача еще не назначена сотрудникам</p>
              </div>
            )}
          </div>

          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Информация о задаче</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span>Создано:</span>
                <span className="ml-2">{formatDate(task.createdAt)}</span>
              </div>
              <div>
                <span>Обновлено:</span>
                <span className="ml-2">{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>


      {/* Task Distribution Modal */}
      {showDistributionModal && selectedAssignment && (
        <TaskDistributionModal
          isOpen={showDistributionModal}
          onClose={() => {
            setShowDistributionModal(false);
            setSelectedAssignment(null);
          }}
          assignment={selectedAssignment}
          employee={employees.find(emp => emp.id === selectedAssignment.employeeId)!}
          task={task}
          project={project}
          timeSlots={timeSlots}
          onCreateTimeSlot={onCreateTimeSlot}
        />
      )}
        {/* Assign Employee Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Назначить сотрудника
                </h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Сотрудник
                    </label>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Выберите сотрудника</option>
                      {availableEmployees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} - {getEmployeePosition(employee.id)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Выделить часов
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      max={remainingHours}
                      value={allocatedHours}
                      onChange={(e) => setAllocatedHours(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Доступно для распределения: {remainingHours}ч
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleAssignEmployee}
                    disabled={!selectedEmployeeId || allocatedHours <= 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Назначить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
