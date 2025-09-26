import React from 'react';
import { ChevronDown, Folder, Plus } from 'lucide-react';
import { Project } from '../types';

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project | null;
  onProjectChange: (project: Project | null) => void;
  onAddProject?: () => void;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  currentProject,
  onProjectChange,
  onAddProject,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition duration-200 min-w-[200px]"
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: currentProject?.color || '#6B7280' }}
        />
        <span className="font-medium text-gray-900 flex-1 text-left">
          {currentProject ? currentProject.name : 'Все проекты'}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            <button
              onClick={() => {
                onProjectChange(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition duration-200 ${
                currentProject === null ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#6B7280' }}
              />
              <div className="flex-1">
                <div className="font-medium">Все проекты</div>
                <div className="text-xs text-gray-500 truncate">
                  Показать задачи по всем проектам
                </div>
              </div>
            </button>
            <div className="border-t border-gray-200 my-1" />
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectChange(project);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition duration-200 ${
                  currentProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex-1">
                  <div className="font-medium">{project.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {project.description}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : project.status === 'completed'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {project.status === 'active' ? 'Активный' : 
                   project.status === 'completed' ? 'Завершен' : 'Приостановлен'}
                </span>
              </button>
            ))}
            
            {onAddProject && (
              <>
                <div className="border-t border-gray-200 my-1" />
                <button
                  onClick={() => {
                    onAddProject();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition duration-200 text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Создать проект</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};