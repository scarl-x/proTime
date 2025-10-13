import React, { useState } from 'react';
import { CalendarView, TimeSlot } from './types';
import { useAuth } from './hooks/useAuth';
import { useTimeSlots } from './hooks/useTimeSlots';
import { useProjects } from './hooks/useProjects';
import { useBookings } from './hooks/useBookings';
import { useLeaveRequests } from './hooks/useLeaveRequests';
import { useTasks } from './hooks/useTasks';
import { useTaskCategories } from './hooks/useTaskCategories';
import { DeadlineNotifications } from './components/DeadlineNotifications';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { DisplayTimezoneContext } from './utils/timezoneContext';
import { EmployeeManagement } from './components/EmployeeManagement';
import { ProjectManagement } from './components/ProjectManagement';
import { TaskList } from './components/TaskManagement/TaskList';
import { TaskModal } from './components/TaskManagement/TaskModal';
import { TaskCategoryManagement } from './components/TaskManagement/TaskCategoryManagement';
import { TaskDetailView } from './components/TaskManagement/TaskDetailView';
import { ProjectSelector } from './components/ProjectSelector';
import { BookingModal } from './components/BookingSystem/BookingModal';
import { BookingList } from './components/BookingSystem/BookingList';
import { EmployeeAvailabilityView } from './components/BookingSystem/EmployeeAvailabilityView';
import { LeaveRequestModal } from './components/LeaveManagement/LeaveRequestModal';
import { LeaveRequestsList } from './components/LeaveManagement/LeaveRequestsList';
import { LeaveBalance } from './components/LeaveManagement/LeaveBalance';
import { LeaveCalendar } from './components/LeaveManagement/LeaveCalendar';
import { CalendarHeader } from './components/Calendar/CalendarHeader';
import { DayView } from './components/Calendar/DayView';
import { WeekView } from './components/Calendar/WeekView';
import { MonthView } from './components/Calendar/MonthView';
import { TimeSlotModal } from './components/TimeSlotModal';
import { WeeklyReport } from './components/Reports/WeeklyReport';
import { OverdueDeadlinesReport } from './components/Reports/OverdueDeadlinesReport';
import { DailyStandupSettings } from './components/Settings/DailyStandupSettings';
import { ProjectAnalytics } from './components/Reports/ProjectAnalytics';
import { PerformanceAnalytics } from './components/Reports/PerformanceAnalytics';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeDaySchedule } from './components/EmployeeSchedule/EmployeeDaySchedule';
import { OverdueTasksList } from './components/EmployeeSchedule/OverdueTasksList';
import { EmployeeBirthdayCards } from './components/EmployeeBirthdayCards';
import { BacklogView } from './components/BacklogView';
import { getWeekStart, getMonthName, formatDate } from './utils/dateUtils';
import { AccountModal } from './components/AccountModal';

function App() {
  const { 
    user, 
    isLoading, 
    login, 
    logout, 
    switchUser, 
    allUsers,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    createEmployeeAccount,
    removeEmployeeAccount,
    updateTimezone,
  } = useAuth();
  const {
    timeSlots,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getSlotsByEmployee,
    getSlotsByDate,
    getWeeklyReport,
    getSlotsByProject,
    getProjectWeeklyReport,
    getAllTimeSlots,
  } = useTimeSlots();
  const {
    projects,
    currentProject,
    setCurrentProject,
    addProject,
    updateProject,
    deleteProject,
    addTeamMember,
    removeTeamMember,
  } = useProjects();
  const {
    bookings,
    createBooking,
    updateBooking,
    deleteBooking,
    checkAvailability,
  } = useBookings();
  const {
    leaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    deleteLeaveRequest,
    calculateLeaveBalance,
    isEmployeeOnLeave,
  } = useLeaveRequests();

  const {
    tasks,
    taskAssignments,
    createTask,
    updateTask,
    deleteTask,
    assignTaskToEmployee,
    updateTaskAssignment,
    removeTaskAssignment,
    getTasksByProject,
    getTaskAssignments,
    calculateTaskOverrun,
    calculateEmployeeOverrun,
  } = useTasks();

  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    getActiveCategories,
  } = useTaskCategories(user?.id);

  // Удалено: логика дейликов

  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarView, setCalendarView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  // Режимы отображения для админа: мои все проекты, мои по проекту, команда по проектам
  const [adminCalendarMode, setAdminCalendarMode] = useState<'my-all' | 'my-project' | 'team-projects'>('my-all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedEmployeeForBooking, setSelectedEmployeeForBooking] = useState<any>(null);
  const [selectedDateForBooking, setSelectedDateForBooking] = useState<string>('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [editingLeaveRequest, setEditingLeaveRequest] = useState<any>(null);
  const [selectedProjectForTasks, setSelectedProjectForTasks] = useState<any>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);
  const [viewingEmployeeSchedule, setViewingEmployeeSchedule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showAccount, setShowAccount] = useState(false);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Обработчик событий от NotificationCenter
  React.useEffect(() => {
    const handleSlotClickEvent = (event: CustomEvent) => {
      setEditingSlot(event.detail);
      setShowTimeSlotModal(true);
    };
    
    const handleTaskClickEvent = (event: CustomEvent) => {
      const task = event.detail;
      const taskProject = projects.find(p => p.id === task.projectId);
      setSelectedProjectForTasks(taskProject);
      setSelectedTaskForDetail(task);
    };
    
    window.addEventListener('slotClick', handleSlotClickEvent as EventListener);
    window.addEventListener('taskClick', handleTaskClickEvent as EventListener);
    
    return () => {
      window.removeEventListener('slotClick', handleSlotClickEvent as EventListener);
      window.removeEventListener('taskClick', handleTaskClickEvent as EventListener);
      window.removeEventListener('openAccountMenu', () => setShowAccount(true));
    };
  }, [projects]);

  React.useEffect(() => {
    const openAccount = () => setShowAccount(true);
    window.addEventListener('openAccountMenu', openAccount as EventListener);
    return () => window.removeEventListener('openAccountMenu', openAccount as EventListener);
  }, []);

  // Экран настроек дейликов находится в отдельном компоненте

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  // Filter time slots based on user role, mode and selected employee
  const getFilteredTimeSlots = () => {
    // Include approved bookings as time slots
    const allTimeSlots = getAllTimeSlots(bookings);
    let filteredSlots = allTimeSlots;
    
    if (user.role === 'admin') {
      if (adminCalendarMode === 'my-all') {
        // Все задачи текущего админа по всем проектам
        filteredSlots = filteredSlots.filter(slot => slot.employeeId === user.id);
      } else if (adminCalendarMode === 'my-project') {
        // Задачи админа по выбранному проекту
        if (currentProject) {
          filteredSlots = getSlotsByProject(currentProject.id);
        }
        filteredSlots = filteredSlots.filter(slot => slot.employeeId === user.id);
      } else {
        // team-projects: Задачи по проектам всей команды (с опциональным выбором сотрудника)
        if (currentProject) {
          filteredSlots = getSlotsByProject(currentProject.id);
        }
        if (selectedEmployee) {
          filteredSlots = filteredSlots.filter(slot => slot.employeeId === selectedEmployee);
        }
      }
    } else {
      // employee
      if (currentProject) {
        filteredSlots = getSlotsByProject(currentProject.id);
      }
      filteredSlots = filteredSlots.filter(slot => slot.employeeId === user.id);
    }
    
    return filteredSlots;
  };

  const getCalendarTitle = () => {
    switch (calendarView) {
      case 'day':
        return formatDate(currentDate);
      case 'week':
        const weekStart = getWeekStart(currentDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(new Date(weekStart).getDate() + 6);
        return `${formatDate(weekStart)} - ${formatDate(weekEnd.toISOString().split('T')[0])}`;
      case 'month':
        return getMonthName(currentDate);
      case 'year':
        return currentDate.getFullYear().toString();
      default:
        return '';
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    setEditingSlot(slot);
    setShowTimeSlotModal(true);
  };

  const handleSaveSlot = async (slotData: Omit<TimeSlot, 'id'> | TimeSlot) => {
    if (editingSlot) {
      updateTimeSlot(editingSlot.id, slotData);
    } else {
      // Создаем временной слот
      addTimeSlot(slotData);
      
      // Если это новый слот (не редактирование) и указан проект, создаем задачу
      if (slotData.projectId && (slotData as any).task && !(slotData as any).taskId) {
        try {
          // Создаем задачу в проекте
          const slotStatus = (slotData as any).status as ('planned'|'in-progress'|'completed') | undefined;
          const taskStatus = slotStatus === 'in-progress' ? 'in-progress'
                            : slotStatus === 'completed' ? 'closed'
                            : 'planned';
          const newTask = await createTask({
            projectId: slotData.projectId,
            name: (slotData as any).task,
            description: ((slotData as any).calendarDescription ? `${(slotData as any).calendarDescription}\n` : '') + `Создано из календаря` ,
            plannedHours: slotData.plannedHours,
            actualHours: 0,
            hourlyRate: 0, // Стандартная ставка
            status: taskStatus,
            createdBy: user.id,
          });
          
          // Назначаем задачу на текущего пользователя
          await assignTaskToEmployee(newTask.id, user.id, slotData.plannedHours);
          
          // Обновляем временной слот с taskId
          const updatedSlot = { ...slotData, taskId: newTask.id };
          // Обновляем слот с taskId для связи с задачей
          if ('id' in slotData) {
            updateTimeSlot(slotData.id, updatedSlot);
          }
          
        } catch (error) {
          console.error('Error creating task from time slot:', error);
          // Не показываем ошибку пользователю, так как временной слот уже создан
        }
      }
    }
    setEditingSlot(null);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setActiveTab('calendar');
  };

  const handleViewEmployeeDaySchedule = (employeeId: string) => {
    setViewingEmployeeSchedule(employeeId);
    setActiveTab('employee-schedule');
  };

  const handleBookEmployee = (employee: any, date: string) => {
    setSelectedEmployeeForBooking(employee);
    setSelectedDateForBooking(date);
    setShowBookingModal(true);
  };

  const createTaskForBooking = async (bookingData: any) => {
    try {
      const bookingStatus: string | undefined = bookingData.status;
      const taskStatus = bookingStatus === 'in-progress' ? 'in-progress'
        : bookingStatus === 'completed' ? 'closed'
        : 'planned';
      const task = await createTask({
        projectId: bookingData.projectId,
        name: `[БРОНИРОВАНИЕ] ${bookingData.taskDescription}`,
        description: `Бронирование времени: ${bookingData.taskDescription}\nЗапросил: ${allUsers.find(u => u.id === bookingData.requesterId)?.name || 'Неизвестный'}\nСотрудник: ${allUsers.find(u => u.id === bookingData.employeeId)?.name || 'Неизвестный'}`,
        plannedHours: bookingData.durationHours,
        actualHours: 0,
        hourlyRate: 3500, // Стандартная ставка
        status: taskStatus,
        createdBy: bookingData.requesterId,
      });
      
      // Назначаем задачу на сотрудника, чье время забронировано
      await assignTaskToEmployee(task.id, bookingData.employeeId, bookingData.durationHours);
    } catch (taskError) {
      console.error('Error creating task for booking:', taskError);
      // Не показываем ошибку пользователю, так как бронирование уже создано
    }
  };

  const handleSaveBooking = async (bookingData: any) => {
    try {
      // Создаем бронирование
      const newBooking = await createBooking(bookingData);
      
      // Если бронирование одобрено, создаем задачу в проекте
      if (bookingData.status === 'approved') {
        await createTaskForBooking(bookingData);
      }
      
      setShowBookingModal(false);
      setSelectedEmployeeForBooking(null);
      setSelectedDateForBooking('');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка при создании бронирования');
    }
  };

  const renderSettingsTab = () => {
    return (
      <div className="p-4 sm:p-6">
        <DailyStandupSettings 
          projects={projects} 
          employees={allUsers}
          onNotify={(type, message) => showNotification(type, message)}
        />
      </div>
    );
  };

  const handleUpdateBooking = async (id: string, updates: any) => {
    try {
      // Получаем текущее бронирование
      const currentBooking = bookings.find(b => b.id === id);
      if (!currentBooking) return;

      // Обновляем бронирование
      await updateBooking(id, updates);

      // Если статус изменился на "approved", создаем задачу
      if (updates.status === 'approved' && currentBooking.status !== 'approved') {
        await createTaskForBooking(currentBooking);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Ошибка при обновлении бронирования');
    }
  };

  const handleSaveLeaveRequest = async (requestData: any) => {
    try {
      if (editingLeaveRequest) {
        await updateLeaveRequest(editingLeaveRequest.id, requestData);
      } else {
        await createLeaveRequest(requestData);
      }
      setShowLeaveModal(false);
      setEditingLeaveRequest(null);
    } catch (error) {
      console.error('Error saving leave request:', error);
      alert('Ошибка при сохранении заявки');
    }
  };

  const handleEditLeaveRequest = (request: any) => {
    setEditingLeaveRequest(request);
    setShowLeaveModal(true);
  };

  const handleViewProjectTasks = (project: any) => {
    setSelectedProjectForTasks(project);
    setActiveTab('project-tasks');
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSaveTask = async (taskData: any) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Ошибка при сохранении задачи');
    }
  };

  const handleDistributeToEmployee = (assignment: any) => {
    // This function is no longer needed as distribution is handled in TaskDetailView
  };

  // Generate reports for admin
  const generateReports = () => {
    // Администраторы тоже сотрудники: включаем всех пользователей
    const employeeUsers = allUsers;
    const currentWeekStart = getWeekStart(new Date());
    
    return employeeUsers.map(emp => 
      getWeeklyReport(emp.id, currentWeekStart)
    );
  };

  const renderCalendarView = () => {
    const filteredSlots = getFilteredTimeSlots();

    switch (calendarView) {
      case 'day':
        return (
          <DayView
            date={currentDate.toISOString().split('T')[0]}
            timeSlots={filteredSlots}
            onSlotClick={handleSlotClick}
            currentUser={user}
            projects={projects}
          />
        );
      case 'week':
        return (
          <WeekView
            weekStart={getWeekStart(currentDate)}
            timeSlots={filteredSlots}
            onSlotClick={handleSlotClick}
            currentUser={user}
            projects={projects}
          />
        );
      case 'month':
        return (
          <MonthView
            currentDate={currentDate}
            timeSlots={filteredSlots}
            onDateClick={(date) => {
              setCurrentDate(new Date(date));
              setCalendarView('day');
            }}
            projects={projects}
          />
        );
      default:
        return <div>Вид "Год" в разработке</div>;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div>
            {/* Project Selector */}
            {/* Переключатели режимов календаря для админа */}
            {user.role === 'admin' && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => { setAdminCalendarMode('my-all'); setSelectedEmployee(null); }}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition ${adminCalendarMode === 'my-all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Мои (все проекты)
                  </button>
                  <button
                    onClick={() => { setAdminCalendarMode('my-project'); setSelectedEmployee(null); }}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition ${adminCalendarMode === 'my-project' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Мои (по проекту)
                  </button>
                  <button
                    onClick={() => setAdminCalendarMode('team-projects')}
                    className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition ${adminCalendarMode === 'team-projects' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Команда (проекты)
                  </button>
                </div>
                {/* Селектор сотрудника для режима команды */}
                {adminCalendarMode === 'team-projects' && (
                  <div className="ml-0 sm:ml-2">
                    <label className="sr-only">Сотрудник</label>
                    <select
                      value={selectedEmployee || ''}
                      onChange={(e) => setSelectedEmployee(e.target.value || null)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Все сотрудники</option>
                      {allUsers.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Селектор проектов показываем, когда нужен проектный фильтр */}
            {(user.role === 'admin' ? (adminCalendarMode !== 'my-all') : true) && (
              <div className="mb-6">
                <ProjectSelector
                  projects={projects}
                  currentProject={currentProject}
                  onProjectChange={(project) => setCurrentProject(project)}
                  onAddProject={user.role === 'admin' ? () => setActiveTab('projects') : undefined}
                />
              </div>
            )}

            {user.role === 'admin' && selectedEmployee && (
              <div className="mb-4">
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Все сотрудники
                </button>
                <div className="mt-2">
                  <span className="text-lg font-semibold">
                    Календарь: {allUsers.find(u => u.id === selectedEmployee)?.name}
                  </span>
                </div>
              </div>
            )}
            
            <CalendarHeader
              view={calendarView}
              currentDate={currentDate}
              onViewChange={setCalendarView}
              onDateChange={setCurrentDate}
              onAddSlot={() => setShowTimeSlotModal(true)}
              title={getCalendarTitle()}
            />
            
            {renderCalendarView()}
          </div>
        );

      case 'employees':
        return (
          viewingEmployeeSchedule ? (
            <EmployeeDaySchedule
              employee={allUsers.find(emp => emp.id === viewingEmployeeSchedule)!}
              date={scheduleDate}
              timeSlots={getAllTimeSlots(bookings)}
              projects={projects}
              onBack={() => {
                setViewingEmployeeSchedule(null);
                setActiveTab('employees');
              }}
              onSlotClick={handleSlotClick}
              onDateChange={setScheduleDate}
            />
          ) : (
          <EmployeeList
            employees={allUsers}
            timeSlots={getAllTimeSlots(bookings)}
            onEmployeeSelect={handleEmployeeSelect}
            onViewDaySchedule={handleViewEmployeeDaySchedule}
          />
          )
        );

      case 'birthdays':
        return (
          <EmployeeBirthdayCards employees={allUsers} />
        );

      case 'manage-employees':
        return (
          <EmployeeManagement
            employees={allUsers}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
            onDeleteEmployee={deleteEmployee}
            onCreateAccount={createEmployeeAccount}
            onRemoveAccount={removeEmployeeAccount}
          />
        );

      case 'projects':
        return (
          <ProjectManagement
            projects={projects}
            employees={allUsers}
            tasks={tasks}
            timeSlots={getAllTimeSlots(bookings)}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onAddTeamMember={addTeamMember}
            onRemoveTeamMember={removeTeamMember}
            onViewProjectTasks={handleViewProjectTasks}
          />
        );

      case 'lead-projects': {
        const myLeadProjects = projects.filter(p => (p as any).teamLeadId === user.id);
        return (
          <ProjectManagement
            projects={myLeadProjects}
            employees={allUsers}
            onAddProject={addProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onAddTeamMember={addTeamMember}
            onRemoveTeamMember={removeTeamMember}
            onViewProjectTasks={handleViewProjectTasks}
          />
        );
      }

      case 'project-tasks':
        if (!selectedProjectForTasks) {
          setActiveTab('projects');
          return null;
        }
        return (
          <div>
            <div className="mb-4">
              <button
                onClick={() => {
                  setSelectedProjectForTasks(null);
                  setActiveTab('projects');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                ← Назад к проектам
              </button>
            </div>
            <TaskList
              project={selectedProjectForTasks}
              tasks={getTasksByProject(selectedProjectForTasks.id)}
              employees={allUsers}
              currentUser={user}
              onCreateTask={handleCreateTask}
              onViewTask={setSelectedTaskForDetail}
              onEditTask={handleEditTask}
              onDeleteTask={deleteTask}
              calculateTaskOverrun={calculateTaskOverrun}
              onUpdateTask={updateTask}
              taskAssignments={taskAssignments}
            />
          </div>
        );

      case 'task-categories':
        return (
          <TaskCategoryManagement
            categories={categories}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={deleteCategory}
            currentUserId={user.id}
            currentUserRole={user.role}
          />
        );

      case 'daily-standups':
        return renderSettingsTab();

      case 'reports':
        return (
          <WeeklyReport
            reports={generateReports()}
            employees={allUsers}
          />
        );

      case 'analytics':
        return (
          user.role === 'admin' ? (
            <ProjectAnalytics
              projects={projects}
              timeSlots={getAllTimeSlots(bookings)}
              employees={allUsers}
            />
          ) : null
        );

      case 'overdue-report':
        return (
          user.role === 'admin' ? (
            <OverdueDeadlinesReport
              timeSlots={getAllTimeSlots(bookings)}
              employees={allUsers}
            />
          ) : null
        );

      case 'performance':
        return (
          user.role === 'admin' ? (
            <PerformanceAnalytics
              timeSlots={getAllTimeSlots(bookings)}
              employees={allUsers}
              projects={projects}
            />
          ) : null
        );

      case 'bookings':
        return (
          <EmployeeAvailabilityView
            employees={allUsers}
            timeSlots={getAllTimeSlots(bookings)}
            bookings={bookings}
            onBookEmployee={handleBookEmployee}
            currentUser={user}
          />
        );

      case 'my-bookings':
        return (
          <BookingList
            bookings={bookings}
            employees={allUsers}
            projects={projects}
            currentUser={user}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={deleteBooking}
            defaultFilter="my-bookings"
          />
        );

      case 'my-requests':
        return (
          <BookingList
            bookings={bookings}
            employees={allUsers}
            projects={projects}
            currentUser={user}
            onUpdateBooking={handleUpdateBooking}
            onDeleteBooking={deleteBooking}
            defaultFilter="my-requests"
          />
        );

      case 'timesheet':
        return (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Мой табель</h3>
            <WeeklyReport
              reports={[getWeeklyReport(user.id, getWeekStart(new Date()))]}
              employees={[user]}
            />
          </div>
        );

      case 'my-schedule':
        return (
          <EmployeeDaySchedule
            employee={user}
            date={scheduleDate}
            timeSlots={timeSlots.filter(slot => slot.employeeId === user.id)}
            projects={projects}
            onBack={() => setActiveTab('calendar')}
            onSlotClick={handleSlotClick}
            onDateChange={setScheduleDate}
          />
        );

      case 'my-overdue':
        return (
          <OverdueTasksList
            employee={user}
            timeSlots={getAllTimeSlots(bookings)}
            projects={projects}
            onSlotClick={handleSlotClick}
            onComplete={(slot) => {
              updateTimeSlot(slot.id, { ...slot, status: 'completed' as any });
            }}
            onPostpone={(slot, days) => {
              const d = new Date(slot.deadline!);
              d.setDate(d.getDate() + days);
              updateTimeSlot(slot.id, { ...slot, deadline: d.toISOString().split('T')[0] });
            }}
          />
        );

      case 'backlog':
        return (
          <BacklogView
            currentUser={user}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setShowTaskModal(true);
            }}
            onScheduleTask={(task) => {
              setSelectedTask(task);
              setShowTimeSlotModal(true);
            }}
          />
        );

      case 'leave-requests':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Отпуска и больничные</h2>
                <p className="text-gray-600 mt-1">
                  Управление заявками на отпуска, больничные и отгулы
                </p>
              </div>
              <button
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <span>Подать заявку</span>
              </button>
            </div>
            <LeaveRequestsList
              leaveRequests={leaveRequests}
              employees={allUsers}
              currentUser={user}
              onUpdateRequest={updateLeaveRequest}
              onDeleteRequest={deleteLeaveRequest}
              onEditRequest={handleEditLeaveRequest}
            />
          </div>
        );

      case 'leave-balance':
        return (
          <LeaveBalance
            balances={allUsers.map(emp => calculateLeaveBalance(emp.id))}
            employees={allUsers}
            currentUser={user}
            leaveRequests={leaveRequests}
          />
        );

      case 'leave-calendar':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Календарь отпусков</h2>
                <p className="text-gray-600 mt-1">
                  {user.role === 'admin' 
                    ? 'Визуальный обзор всех отпусков и больничных' 
                    : 'Визуальный обзор ваших отпусков и больничных'}
                </p>
              </div>
            </div>
            <LeaveCalendar
              currentDate={currentDate}
              leaveRequests={leaveRequests}
              employees={allUsers}
              currentUser={user}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DisplayTimezoneContext.Provider value={user.timezone ?? null}>
    <Layout
      user={user}
      onLogout={logout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      timeSlots={getAllTimeSlots(bookings)}
      employees={allUsers}
      projects={projects}
      tasks={tasks}
      taskAssignments={taskAssignments}
      updateTimezone={updateTimezone}
    >
      {renderContent()}

      <TimeSlotModal
        isOpen={showTimeSlotModal}
        onClose={() => {
          setShowTimeSlotModal(false);
          setEditingSlot(null);
          setSelectedTask(null);
        }}
        onSave={handleSaveSlot}
        onDelete={async (id: string) => {
          const deletedSlot = await deleteTimeSlot(id);
          // Если у слота есть связанная задача, удаляем её тоже
          if (deletedSlot && (deletedSlot as any).taskId) {
            try {
              await deleteTask((deletedSlot as any).taskId);
            } catch (error) {
              console.error('Error deleting associated task:', error);
              // Не показываем ошибку пользователю, так как слот уже удален
            }
          }
        }}
        slot={editingSlot ?? undefined}
        employees={allUsers}
        currentUser={user}
        projects={projects}
        timeSlots={getAllTimeSlots(bookings)}
        preselectedTask={selectedTask}
        categories={categories}
      />

      <BookingModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedEmployeeForBooking(null);
          setSelectedDateForBooking('');
        }}
        onSave={handleSaveBooking}
        employees={allUsers}
        projects={projects}
        currentUser={user}
        timeSlots={getAllTimeSlots(bookings)}
        checkAvailability={(employeeId, date, startTime, endTime) => 
          checkAvailability(employeeId, date, startTime, endTime, getAllTimeSlots(bookings))
        }
        selectedEmployee={selectedEmployeeForBooking}
        selectedDate={selectedDateForBooking}
        categories={categories}
      />

      <LeaveRequestModal
        isOpen={showLeaveModal}
        onClose={() => {
          setShowLeaveModal(false);
          setEditingLeaveRequest(null);
        }}
        onSave={handleSaveLeaveRequest}
        employees={allUsers}
        currentUser={user}
        editingRequest={editingLeaveRequest}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        task={editingTask}
        projectId={selectedProjectForTasks?.id || ''}
        currentUserId={user.id}
        categories={getActiveCategories()}
        currentUserRole={user.role}
      />

      <AccountModal
        isOpen={showAccount}
        onClose={() => setShowAccount(false)}
        user={user}
        onSave={async (updates) => {
          try {
            await updateEmployee(user.id, updates as any);
            showNotification('success', 'Профиль обновлён');
          } catch (e) {
            showNotification('error', 'Не удалось сохранить профиль');
          }
        }}
      />

      {selectedTaskForDetail && (
        <TaskDetailView
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          task={selectedTaskForDetail}
          project={selectedProjectForTasks}
          timeSlots={getAllTimeSlots(bookings)}
          onCreateTimeSlot={addTimeSlot}
          assignments={getTaskAssignments(selectedTaskForDetail.id)}
          employees={allUsers}
          currentUser={user}
          onAssignEmployee={assignTaskToEmployee}
          onUpdateAssignment={updateTaskAssignment}
          onRemoveAssignment={removeTaskAssignment}
          calculateTaskOverrun={calculateTaskOverrun}
          calculateEmployeeOverrun={calculateEmployeeOverrun}
        />
      )}

      {/* Demo switcher for testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
          <div className="text-xs font-medium text-gray-600 mb-2">Demo Mode:</div>
          <div className="space-y-1">
            {allUsers.map(u => (
              <button
                key={u.id}
                onClick={() => switchUser(u.id)}
                className={`block w-full text-left text-xs px-2 py-1 rounded ${
                  user.id === u.id 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {u.name} ({u.role})
              </button>
            ))}
          </div>
        </div>
      )}


      {/* Уведомления */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          notification.type === 'success' ? 'bg-green-100 border border-green-400 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 border border-red-400 text-red-800' :
          'bg-blue-100 border border-blue-400 text-blue-800'
        }`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`} />
            <span className="text-sm font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Layout>
    </DisplayTimezoneContext.Provider>
  );
}

export default App;