import React, { useState, useEffect } from 'react';
import { Bell, X, Clock, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { TimeSlot, User, Project } from '../../types';

interface Notification {
  id: string;
  type: 'deadline' | 'overdue' | 'completed' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  projectId?: string;
  employeeId?: string;
}

interface NotificationCenterProps {
  timeSlots: TimeSlot[];
  employees: User[];
  projects: Project[];
  currentUser: User;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  timeSlots,
  employees,
  projects,
  currentUser,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    generateNotifications();
  }, [timeSlots, currentUser]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Filter slots based on user role
    const relevantSlots = currentUser.role === 'admin' 
      ? timeSlots 
      : timeSlots.filter(slot => slot.employeeId === currentUser.id);

    // Overdue tasks
    const overdueTasks = relevantSlots.filter(slot => 
      slot.status !== 'completed' && slot.date < today
    );

    overdueTasks.forEach(slot => {
      const employee = employees.find(emp => emp.id === slot.employeeId);
      const project = projects.find(proj => proj.id === slot.projectId);
      
      newNotifications.push({
        id: `overdue-${slot.id}`,
        type: 'overdue',
        title: 'Просроченная задача',
        message: `${employee?.name}: "${slot.task}" в проекте "${project?.name}"`,
        timestamp: new Date(slot.date),
        read: false,
        projectId: slot.projectId,
        employeeId: slot.employeeId,
      });
    });

    // Tasks due tomorrow
    const upcomingTasks = relevantSlots.filter(slot => 
      slot.status !== 'completed' && slot.date === tomorrow
    );

    upcomingTasks.forEach(slot => {
      const employee = employees.find(emp => emp.id === slot.employeeId);
      const project = projects.find(proj => proj.id === slot.projectId);
      
      newNotifications.push({
        id: `deadline-${slot.id}`,
        type: 'deadline',
        title: 'Задача на завтра',
        message: `${employee?.name}: "${slot.task}" в проекте "${project?.name}"`,
        timestamp: new Date(),
        read: false,
        projectId: slot.projectId,
        employeeId: slot.employeeId,
      });
    });

    // Recently completed tasks
    const recentlyCompleted = relevantSlots.filter(slot => 
      slot.status === 'completed' && 
      new Date(slot.date).getTime() >= now.getTime() - 24 * 60 * 60 * 1000
    );

    recentlyCompleted.forEach(slot => {
      const employee = employees.find(emp => emp.id === slot.employeeId);
      const project = projects.find(proj => proj.id === slot.projectId);
      
      newNotifications.push({
        id: `completed-${slot.id}`,
        type: 'completed',
        title: 'Задача выполнена',
        message: `${employee?.name} завершил: "${slot.task}" в проекте "${project?.name}"`,
        timestamp: new Date(),
        read: false,
        projectId: slot.projectId,
        employeeId: slot.employeeId,
      });
    });

    // Efficiency notifications for admins
    if (currentUser.role === 'admin') {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekSlots = timeSlots.filter(slot => new Date(slot.date) >= weekStart);
      
      const employeeEfficiency: { [key: string]: { completed: number; total: number } } = {};
      
      weekSlots.forEach(slot => {
        if (!employeeEfficiency[slot.employeeId]) {
          employeeEfficiency[slot.employeeId] = { completed: 0, total: 0 };
        }
        employeeEfficiency[slot.employeeId].total++;
        if (slot.status === 'completed') {
          employeeEfficiency[slot.employeeId].completed++;
        }
      });

      Object.entries(employeeEfficiency).forEach(([employeeId, stats]) => {
        const efficiency = (stats.completed / stats.total) * 100;
        const employee = employees.find(emp => emp.id === employeeId);
        
        if (efficiency < 60 && stats.total >= 5) {
          newNotifications.push({
            id: `efficiency-${employeeId}`,
            type: 'info',
            title: 'Низкая эффективность',
            message: `${employee?.name}: ${efficiency.toFixed(1)}% выполненных задач за неделю`,
            timestamp: new Date(),
            read: false,
            employeeId,
          });
        }
      });
    }

    // Sort by timestamp (newest first)
    newNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'deadline':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'deadline':
        return 'bg-yellow-50 border-yellow-200';
      case 'overdue':
        return 'bg-red-50 border-red-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Уведомления</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Прочитать все
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition duration-200 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {notification.timestamp.toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Нет новых уведомлений</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};