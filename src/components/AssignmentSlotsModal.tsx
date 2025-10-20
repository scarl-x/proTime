import React from 'react';
import { X } from 'lucide-react';
import { TaskAssignment, User as UserType, TimeSlot, Project, TaskCategory } from '../types';
import { AssignmentSlotsEditor } from './TaskManagement/AssignmentSlotsEditor';

interface AssignmentSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: TaskAssignment;
  employee: UserType;
  timeSlots: TimeSlot[];
  projects: Project[];
  categories?: TaskCategory[];
  onUpdateTimeSlot?: (id: string, updates: Partial<TimeSlot>) => void;
  onDeleteTimeSlot?: (id: string) => void;
  onUpdateAssignment?: (id: string, updates: Partial<TaskAssignment>) => void;
}

export const AssignmentSlotsModal: React.FC<AssignmentSlotsModalProps> = ({
  isOpen,
  onClose,
  assignment,
  employee,
  timeSlots,
  projects,
  categories,
  onUpdateTimeSlot,
  onDeleteTimeSlot,
  onUpdateAssignment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Редактировать распределение
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {employee.name} • {(assignment as any).title || 'Часть задачи'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <AssignmentSlotsEditor
            assignment={assignment}
            employee={employee}
            timeSlots={timeSlots}
            projects={projects}
            categories={categories}
            onUpdateTimeSlot={onUpdateTimeSlot}
            onDeleteTimeSlot={onDeleteTimeSlot}
            onUpdateAssignment={onUpdateAssignment}
          />
        </div>
      </div>
    </div>
  );
};
