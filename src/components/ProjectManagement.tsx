import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Calendar, Folder, Eye } from 'lucide-react';
import { Project, User } from '../types';

interface ProjectManagementProps {
  projects: Project[];
  employees: User[];
  onAddProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onUpdateProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  onAddTeamMember: (projectId: string, employeeId: string) => void;
  onRemoveTeamMember: (projectId: string, employeeId: string) => void;
  onViewProjectTasks?: (project: Project) => void;
}

interface ProjectFormData {
  name: string;
  description: string;
  color: string;
  status: 'active' | 'completed' | 'on-hold';
  teamLeadId?: string;
  teamMembers: string[];
}

const PROJECT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
];

export const ProjectManagement: React.FC<ProjectManagementProps> = ({
  projects,
  employees,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTeamMember,
  onRemoveTeamMember,
  onViewProjectTasks,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
    status: 'active',
    teamLeadId: undefined,
    teamMembers: [],
  });

  const employeeList = employees; // админы тоже сотрудники

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProject) {
      onUpdateProject(editingProject.id, formData);
    } else {
      onAddProject(formData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: PROJECT_COLORS[0],
      status: 'active',
      teamMembers: [],
    });
    setEditingProject(null);
    setShowModal(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      teamLeadId: project.teamLeadId,
      teamMembers: project.teamMembers,
    });
    setShowModal(true);
  };

  const handleDelete = (project: Project) => {
    if (window.confirm(`Вы уверены, что хотите удалить проект "${project.name}"?`)) {
      onDeleteProject(project.id);
    }
  };

  const toggleTeamMember = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(employeeId)
        ? prev.teamMembers.filter(id => id !== employeeId)
        : [...prev.teamMembers, employeeId]
    }));
  };

  const getEmployeeName = (id: string) => {
    return employees.find(emp => emp.id === id)?.name || 'Неизвестный сотрудник';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление проектами</h2>
          <p className="text-gray-600 mt-1">
            Создавайте и управляйте проектами команды
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          <span>Создать проект</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition duration-200"
          >
            <div
              className="h-2"
              style={{ backgroundColor: project.color }}
            />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {project.description}
                  </p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {project.status === 'active' ? 'Активный' : 
                     project.status === 'completed' ? 'Завершен' : 'Приостановлен'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {onViewProjectTasks && (
                    <button
                      onClick={() => onViewProjectTasks(project)}
                      className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition duration-200"
                      title="Задачи проекта"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(project)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition duration-200"
                    title="Редактировать"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{project.teamMembers.length} участников</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(project.createdAt).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>

              {project.teamMembers.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-gray-500 mb-2">Команда:</div>
                  <div className="flex flex-wrap gap-1">
                    {project.teamMembers.slice(0, 3).map((memberId) => (
                      <span
                        key={memberId}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {getEmployeeName(memberId)}
                      </span>
                    ))}
                    {project.teamMembers.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        +{project.teamMembers.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Нет проектов
          </h3>
          <p className="text-gray-600 mb-6">
            Создайте первый проект для вашей команды
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 mx-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Создать проект</span>
          </button>
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingProject ? 'Редактировать проект' : 'Создать проект'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название проекта *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Веб-приложение CRM"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Краткое описание проекта..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Цвет проекта
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full border-2 transition duration-200 ${
                            formData.color === color ? 'border-gray-400' : 'border-gray-200'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Статус
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Активный</option>
                      <option value="on-hold">Приостановлен</option>
                      <option value="completed">Завершен</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тим-лид проекта
                  </label>
                  <select
                    value={formData.teamLeadId || ''}
                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Не назначен</option>
                    {employeeList.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Участники команды
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {employeeList.map((employee) => (
                      <label
                        key={employee.id}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={formData.teamMembers.includes(employee.id)}
                          onChange={() => toggleTeamMember(employee.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {employee.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition duration-200"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  {editingProject ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};