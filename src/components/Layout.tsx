import React, { useEffect, useMemo, useState, useRef } from 'react';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';
import { DisplayTimezoneContext } from '../utils/timezoneContext';
import { formatTimeForDisplay } from '../utils/timezone';
import { Clock, Users, Calendar, BarChart3, LogOut, Settings, UserPlus, Folder, TrendingUp, CalendarCheck, Plane, Tag, MessageCircle, User as UserIcon, ListTodo, Send } from 'lucide-react';
import logoUrl from '/brand/proyavlenie_03.png';
import { User } from '../types';
import { NotificationCenter } from './Notifications/NotificationCenter';
import { TimezoneSelector } from './TimezoneSelector';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
  timeSlots?: any[];
  employees?: User[];
  projects?: any[];
  updateTimezone?: (timezone: string) => Promise<void>;
}

interface TabGroup {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  subTabs?: Tab[];
}

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  activeTab,
  onTabChange,
  children,
  timeSlots = [],
  employees = [],
  projects = [],
  updateTimezone,
}) => {
  const [localTime, setLocalTime] = useState<string>('');

  // Эффективная timezone: user.profile -> system fallback
  const effectiveZone = useMemo(() => {
    if (user.timezone) {
      return user.timezone;
    }
    
    // Fallback на системное время - определяем ближайший российский timezone
    const off = -new Date().getTimezoneOffset();
    const h = Math.floor(off/60);
    
    // Маппинг UTC offset на российские timezone
    const offsetToTimezone: { [key: number]: string } = {
      2: 'Europe/Kaliningrad',
      3: 'Europe/Moscow',
      4: 'Europe/Samara',
      5: 'Asia/Yekaterinburg',
      6: 'Asia/Omsk',
      7: 'Asia/Novosibirsk',
      8: 'Asia/Irkutsk',
      9: 'Asia/Yakutsk',
      10: 'Asia/Vladivostok',
      11: 'Asia/Magadan',
      12: 'Asia/Kamchatka',
    };
    
    const fallbackTimezone = offsetToTimezone[h] || 'Europe/Moscow';
    return fallbackTimezone;
  }, [user.timezone]);

  useEffect(() => {
    const formatTime = () => {
      setLocalTime(formatTimeForDisplay(effectiveZone));
    };
    formatTime();
    const id = setInterval(formatTime, 60 * 1000);
    return () => clearInterval(id);
  }, [effectiveZone]);

  // Обработчик смены timezone
  const handleTimezoneChange = async (timezone: string) => {
    if (updateTimezone) {
      await updateTimezone(timezone);
    }
  };

  // Не форсируем customOffset из профиля, чтобы позволить выбрать системный
  const [activeGroup, setActiveGroup] = React.useState<string>(user.role === 'admin' ? 'personal' : 'calendar');
  const [activeSubTab, setActiveSubTab] = React.useState<string>(user.role === 'admin' ? 'calendar' : '');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const adminTabGroups: (TabGroup | Tab)[] = [
    { id: 'personal', 
      label: 'Мое рабочее место', 
      icon: UserIcon,
      subTabs: [
        { id: 'calendar', label: 'Календарь', icon: Calendar },
        { id: 'my-schedule', label: 'Мое расписание', icon: Clock },
        { id: 'backlog', label: 'Нераспределенные задачи', icon: ListTodo },
        { id: 'task-categories', label: 'Категории задач', icon: Tag },
        { id: 'timesheet', label: 'Табель', icon: Clock },
      ]
    },
    {
      id: 'team-group',
      label: 'Команда',
      icon: Users,
      subTabs: [
        { id: 'employees', label: 'Обзор команды', icon: Users },
        { id: 'manage-employees', label: 'Управление командой', icon: UserPlus },
        { id: 'birthdays', label: 'Дни рождения', icon: Calendar },
      ]
    },
    {
      id: 'projects-group',
      label: 'Проекты',
      icon: Folder,
      subTabs: [
        { id: 'projects', label: 'Управление проектами', icon: Folder },
      ]
    },
    {
      id: 'bookings-group',
      label: 'Бронирование',
      icon: CalendarCheck,
      subTabs: [
        { id: 'bookings', label: 'Доступность команды', icon: CalendarCheck },
        { id: 'my-bookings', label: 'Мои бронирования', icon: CalendarCheck },
        { id: 'my-requests', label: 'Мои запросы', icon: Send },
      ]
    },
    {
      id: 'leave-group',
      label: 'Отпуска',
      icon: Plane,
      subTabs: [
        { id: 'leave-requests', label: 'Заявки на отпуска', icon: Plane },
        { id: 'leave-balance', label: 'Баланс отпусков', icon: Plane },
        { id: 'leave-calendar', label: 'Календарь отпусков', icon: Plane },
      ]
    },
    {
      id: 'reports-group',
      label: 'Отчеты и аналитика',
      icon: BarChart3,
      subTabs: [
        { id: 'reports', label: 'Еженедельные отчеты', icon: BarChart3 },
        { id: 'analytics', label: 'Аналитика проектов', icon: TrendingUp },
        { id: 'overdue-report', label: 'Просроченные дедлайны', icon: TrendingUp },
        { id: 'performance', label: 'Производительность команды', icon: TrendingUp },
      ]
    },
    {
      id: 'settings-group',
      label: 'Настройки',
      icon: Settings,
      subTabs: [
        { id: 'daily-standups', label: 'Настройки дейликов', icon: MessageCircle },
      ]
    },
  ];

  const isTeamLead = projects?.some(p => (p as any).teamLeadId === user.id);

  const employeeTabGroups: (TabGroup | Tab)[] = [
    { id: 'calendar', label: 'Мой календарь', icon: Calendar },
    {
      id: 'schedule-group',
      label: 'Мое расписание',
      icon: Clock,
      subTabs: [
        { id: 'my-schedule', label: 'Расписание', icon: Clock },
        { id: 'backlog', label: 'Нераспределенные задачи', icon: ListTodo },
      ]
    },
    { id: 'task-categories', label: 'Категории задач', icon: Tag },
    ...(isTeamLead ? [{ id: 'lead-projects', label: 'Проекты', icon: Folder } as Tab] : []),
    {
      id: 'team-group',
      label: 'Команда',
      icon: Users,
      subTabs: [
        { id: 'birthdays', label: 'Дни рождения', icon: Calendar },
        { id: 'bookings', label: 'Бронирование времени', icon: CalendarCheck },
        { id: 'my-bookings', label: 'Мои бронирования', icon: CalendarCheck },
        { id: 'my-requests', label: 'Мои запросы', icon: Send },
      ]
    },
    { id: 'leave-requests', label: 'Мои отпуска', icon: Plane },
    { id: 'timesheet', label: 'Табель', icon: Clock },
  ];

  const tabGroups = user.role === 'admin' ? adminTabGroups : employeeTabGroups;

  const handleTabClick = (tabId: string, isGroup: boolean = false, subTabId?: string) => {
    if (isGroup && subTabId) {
      // Clicking on a sub-tab
      setActiveGroup(tabId);
      setActiveSubTab(subTabId);
      onTabChange(subTabId);
    } else if (isGroup) {
      // Clicking on a group - show first sub-tab
      const group = tabGroups.find(t => t.id === tabId) as TabGroup;
      if (group?.subTabs && group.subTabs.length > 0) {
        setActiveGroup(tabId);
        setActiveSubTab(group.subTabs[0].id);
        onTabChange(group.subTabs[0].id);
      }
    } else {
      // Clicking on a regular tab
      setActiveGroup(tabId);
      setActiveSubTab('');
      onTabChange(tabId);
    }
  };

  // Initialize active group and sub-tab based on current activeTab
  React.useEffect(() => {
    for (const item of tabGroups) {
      if ('subTabs' in item && item.subTabs) {
        const subTab = item.subTabs.find(sub => sub.id === activeTab);
        if (subTab) {
          setActiveGroup(item.id);
          setActiveSubTab(subTab.id);
          return;
        }
      } else if (item.id === activeTab) {
        setActiveGroup(item.id);
        setActiveSubTab('');
        return;
      }
    }
    
    // Если не найдена группа, устанавливаем календарь по умолчанию
    if (activeTab === 'calendar') {
      setActiveGroup('calendar');
      setActiveSubTab('');
    }
  }, [activeTab, tabGroups]);

  const getCurrentGroup = () => {
    return tabGroups.find(item => item.id === activeGroup) as TabGroup | Tab;
  };

  const isTabActive = (tabId: string) => {
    return activeGroup === tabId || activeSubTab === tabId;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src={logoUrl} alt="Проявление" className="h-12 w-auto" />
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500 capitalize">
                  {user.role === 'admin' ? 'Администратор' : 'Сотрудник'}
                </p>
              </div>
            <div className="flex items-center space-x-2">
              {/* Время пользователя и выбор часового пояса */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center text-gray-600 text-sm px-2 py-1 rounded-md border border-gray-200 bg-white">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span>{localTime}</span>
                </div>
                <TimezoneSelector
                  currentTimezone={effectiveZone}
                  onTimezoneChange={handleTimezoneChange}
                />
              </div>
                <NotificationCenter
                  timeSlots={timeSlots}
                  employees={employees}
                  projects={projects}
                  currentUser={user}
                />
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200 hidden sm:block">
                  <Settings className="h-5 w-5" />
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
                {/* Mobile menu button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition duration-200 sm:hidden"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className={`bg-white border-b ${isMobileMenuOpen ? 'block' : 'hidden sm:block'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 py-2 sm:py-0">
            {tabGroups.map((item) => {
              const isGroup = 'subTabs' in item;
              const isActive = isTabActive(item.id);
              
              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => handleTabClick(item.id, isGroup)}
                    className={`flex items-center space-x-2 py-3 sm:py-4 px-2 sm:border-b-2 border-l-4 sm:border-l-0 font-medium text-sm transition duration-200 w-full sm:w-auto ${
                      isActive
                        ? 'border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="truncate">{item.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Sub-navigation for groups */}
        {activeGroup && (() => {
          const currentGroup = getCurrentGroup();
          if (currentGroup && 'subTabs' in currentGroup && currentGroup.subTabs) {
            return (
              <div className={`bg-gray-50 border-t ${isMobileMenuOpen ? 'block' : 'hidden sm:block'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-1 sm:space-y-0 py-2 sm:py-0">
                    {currentGroup.subTabs.map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => handleTabClick(activeGroup, true, subTab.id)}
                        className={`flex items-center space-x-2 py-2 sm:py-3 px-2 sm:border-b-2 border-l-4 sm:border-l-0 font-medium text-sm transition duration-200 w-full sm:w-auto ${
                          activeSubTab === subTab.id
                            ? 'border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <subTab.icon className="h-4 w-4" />
                        <span className="truncate">{subTab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </nav>

      {/* Main Content */}
      {(() => {
        const zone = effectiveZone;
        return (
          <DisplayTimezoneContext.Provider value={zone}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {children}
        </main>
          </DisplayTimezoneContext.Provider>
        );
      })()}
    </div>
  );
};