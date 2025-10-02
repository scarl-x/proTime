import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Calendar, X } from 'lucide-react';
import { Task, TimeSlot, TaskAssignment } from '../types';
import { 
  isDeadlineApproaching, 
  isDeadlinePassed, 
  getDaysUntilDeadline, 
  getDaysOverdue,
  getDeadlineStatus,
  isTimeSlotOverdue
} from '../utils/deadlineUtils';

interface DeadlineNotificationsProps {
  tasks: Task[];
  timeSlots: TimeSlot[];
  taskAssignments: TaskAssignment[];
  currentUser: any;
  onClose?: () => void;
  onSlotClick?: (slot: TimeSlot) => void;
  onTaskClick?: (task: Task) => void;
}

interface DeadlineItem {
  id: string;
  type: 'task' | 'timeslot';
  title: string;
  deadline: string;
  status: 'overdue' | 'approaching' | 'normal';
  daysLeft: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadlineType?: 'soft' | 'hard';
}

export const DeadlineNotifications: React.FC<DeadlineNotificationsProps> = ({
  tasks,
  timeSlots,
  taskAssignments,
  currentUser,
  onClose,
  onSlotClick,
  onTaskClick
}) => {
  const [deadlineItems, setDeadlineItems] = useState<DeadlineItem[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const items: DeadlineItem[] = [];

    // Проверяем назначения задач с дедлайнами (только для текущего пользователя)
    taskAssignments
      .filter(assignment => assignment.employeeId === currentUser.id)
      .forEach(assignment => {
        if (assignment.deadline) {
          const isOverdue = isDeadlinePassed(assignment.deadline);
          const isApproaching = isDeadlineApproaching(assignment.deadline);
          
          if (isOverdue || isApproaching) {
            const task = tasks.find(t => t.id === assignment.taskId);
            if (task) {
              items.push({
                id: `assignment-${assignment.id}`,
                type: 'task',
                title: task.name,
                deadline: assignment.deadline,
                status: isOverdue ? 'overdue' : 'approaching',
                daysLeft: isOverdue ? getDaysOverdue(assignment.deadline) : getDaysUntilDeadline(assignment.deadline),
                priority: assignment.priority,
                deadlineType: assignment.deadlineType,
              });
            }
          }
        }
      });

    // Проверяем временные слоты с дедлайнами (только для текущего пользователя)
    timeSlots
      .filter(slot => slot.employeeId === currentUser.id)
      .forEach(slot => {
        if (slot.deadline && slot.status !== 'completed') {
          const isOverdue = isTimeSlotOverdue(slot);
          const isApproaching = isDeadlineApproaching(slot.deadline);
          
          if (isOverdue || isApproaching) {
            items.push({
              id: `slot-${slot.id}`,
              type: 'timeslot',
              title: slot.task,
              deadline: slot.deadline,
              status: isOverdue ? 'overdue' : 'approaching',
              daysLeft: isOverdue ? getDaysOverdue(slot.deadline) : getDaysUntilDeadline(slot.deadline),
              deadlineType: slot.deadlineType,
            });
          }
        }
      });

    // Сортируем по приоритету: просроченные, затем приближающиеся
    items.sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      if (a.status === 'approaching' && b.status !== 'approaching') return -1;
      if (b.status === 'approaching' && a.status !== 'approaching') return 1;
      
      // Сортируем по количеству дней
      return a.daysLeft - b.daysLeft;
    });

    setDeadlineItems(items);
  }, [tasks, timeSlots, taskAssignments, currentUser.id]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || deadlineItems.length === 0) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'approaching':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'approaching':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">
              Дедлайны ({deadlineItems.length})
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {deadlineItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 border-b border-gray-100 last:border-b-0 ${getStatusColor(item.status)} cursor-pointer hover:bg-gray-50`}
              onClick={() => {
                if (item.type === 'timeslot') {
                  const slot = timeSlots.find(s => s.id === item.id.replace('slot-', ''));
                  if (slot && onSlotClick) onSlotClick(slot);
                } else if (item.type === 'task') {
                  const task = tasks.find(t => t.id === item.id.replace('assignment-', ''));
                  if (task && onTaskClick) onTaskClick(task);
                }
              }}
            >
              <div className="flex items-start space-x-3">
                {getStatusIcon(item.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {item.title}
                    </p>
                    {item.priority && (
                      <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </span>
                    )}
                    {item.deadlineType === 'hard' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        ЖЕСТКИЙ
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-600">
                    <span>
                      {item.status === 'overdue' 
                        ? `Просрочено на ${item.daysLeft} дн.`
                        : `Осталось ${item.daysLeft} дн.`
                      }
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(item.deadline).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {item.type === 'task' ? 'Задача проекта' : 'Задача в календаре'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Проверьте все задачи с дедлайнами
          </p>
        </div>
      </div>
    </div>
  );
};
