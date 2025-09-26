import React, { useState } from 'react';
import { CalendarView, TimeSlot } from './types';
import { useAuth } from './hooks/useAuth';
import { useTimeSlots } from './hooks/useTimeSlots';
import { useProjects } from './hooks/useProjects';
import { useBookings } from './hooks/useBookings';
import { useLeaveRequests } from './hooks/useLeaveRequests';
import { useTasks } from './hooks/useTasks';
import { useTaskCategories } from './hooks/useTaskCategories';
import { useDailyStandups } from './hooks/useDailyStandups';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { EmployeeManagement } from './components/EmployeeManagement';
import { ProjectManagement } from './components/ProjectManagement';
import { TaskList } from './components/TaskManagement/TaskList';
import { TaskModal } from './components/TaskManagement/TaskModal';
import { TaskCategoryManagement } from './components/TaskManagement/TaskCategoryManagement';
import { DailyStandupSettings } from './components/Settings/DailyStandupSettings';
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
import { ProjectAnalytics } from './components/Reports/ProjectAnalytics';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeDaySchedule } from './components/EmployeeSchedule/EmployeeDaySchedule';
import { EmployeeBirthdayCards } from './components/EmployeeBirthdayCards';
import { getWeekStart, getMonthName, formatDate } from './utils/dateUtils';

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
  } = useTaskCategories();

  const {
    configs: standupConfigs,
    getProjectConfig,
    updateConfig: updateStandupConfig,
    initializeDailyStandups,
    getStandupStats,
  } = useDailyStandups(allUsers, projects, timeSlots, addTimeSlot);

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
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<any>(null);
  const [viewingEmployeeSchedule, setViewingEmployeeSchedule] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);

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
    let filteredSlots = timeSlots;
    
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

  const handleSaveSlot = (slotData: Omit<TimeSlot, 'id'> | TimeSlot) => {
    if (editingSlot) {
      updateTimeSlot(editingSlot.id, slotData);
    } else {
      addTimeSlot(slotData);
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

  const handleSaveBooking = async (bookingData: any) => {
    try {
      await createBooking(bookingData);
      setShowBookingModal(false);
      setSelectedEmployeeForBooking(null);
      setSelectedDateForBooking('');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Ошибка при создании бронирования');
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
          />
        );
      case 'week':
        return (
          <WeekView
            weekStart={getWeekStart(currentDate)}
            timeSlots={filteredSlots}
            onSlotClick={handleSlotClick}
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
              timeSlots={timeSlots}
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
            timeSlots={timeSlots}
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
          />
        );

      case 'daily-standups':
        return (
          <DailyStandupSettings
            configs={standupConfigs}
            projects={projects}
            getProjectConfig={getProjectConfig}
            onUpdateConfig={updateStandupConfig}
            onInitializeStandups={initializeDailyStandups}
            standupStats={getStandupStats()}
          />
        );

      case 'reports':
        return (
          <WeeklyReport
            reports={generateReports()}
            employees={allUsers}
          />
        );

      case 'analytics':
        return (
          <ProjectAnalytics
            projects={projects}
            timeSlots={timeSlots}
            employees={allUsers}
          />
        );

      case 'bookings':
        return (
          <EmployeeAvailabilityView
            employees={allUsers}
            timeSlots={timeSlots}
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
            onUpdateBooking={updateBooking}
            onDeleteBooking={deleteBooking}
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
                  Визуальный обзор всех отпусков и больничных
                </p>
              </div>
            </div>
            <LeaveCalendar
              currentDate={currentDate}
              leaveRequests={leaveRequests}
              employees={allUsers}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout
      user={user}
      onLogout={logout}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      timeSlots={timeSlots}
      employees={allUsers}
      projects={projects}
    >
      {renderContent()}

      <TimeSlotModal
        isOpen={showTimeSlotModal}
        onClose={() => {
          setShowTimeSlotModal(false);
          setEditingSlot(null);
        }}
        onSave={handleSaveSlot}
        onDelete={deleteTimeSlot}
        slot={editingSlot ?? undefined}
        employees={allUsers}
        currentUser={user}
        projects={projects}
        timeSlots={timeSlots}
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
        timeSlots={timeSlots}
        checkAvailability={(employeeId, date, startTime, endTime) => 
          checkAvailability(employeeId, date, startTime, endTime, timeSlots)
        }
        selectedEmployee={selectedEmployeeForBooking}
        selectedDate={selectedDateForBooking}
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
      />

      {selectedTaskForDetail && (
        <TaskDetailView
          isOpen={!!selectedTaskForDetail}
          onClose={() => setSelectedTaskForDetail(null)}
          task={selectedTaskForDetail}
          project={selectedProjectForTasks}
          timeSlots={timeSlots}
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
    </Layout>
  );
}

export default App;