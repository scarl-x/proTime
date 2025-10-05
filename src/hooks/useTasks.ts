import { useState, useEffect } from 'react';
import { Task, TaskAssignment } from '../types';
import { API_URL,  hasApiConnection  } from '../lib/api';


export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    if (hasApiConnection) {
      loadTasks();
      loadTaskAssignments();
    } else {
      loadDemoTasks();
    }
  }, []);

  const loadDemoTasks = () => {
    const demoTasks: Task[] = [
      {
        id: '1',
        projectId: '1',
        name: 'Разработка API авторизации',
        description: 'Создание системы авторизации пользователей с JWT токенами',
        plannedHours: 40,
        actualHours: 35,
        hourlyRate: 3500,
        totalCost: 140000,
        status: 'closed',
        createdBy: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        projectId: '1',
        name: 'Интеграция с внешними сервисами',
        description: 'Подключение к API внешних сервисов для обмена данными',
        plannedHours: 60,
        actualHours: 45,
        hourlyRate: 3500,
        totalCost: 210000,
        status: 'in-progress',
        createdBy: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        projectId: '1',
        name: 'Тестовая задача для backlog',
        description: 'Задача для тестирования функциональности нераспределенных задач',
        plannedHours: 8,
        actualHours: 0,
        hourlyRate: 3500,
        totalCost: 28000,
        status: 'new',
        createdBy: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    setTasks(demoTasks);

    const demoAssignments: TaskAssignment[] = [
      {
        id: '1',
        taskId: '1',
        employeeId: '2',
        allocatedHours: 25,
        actualHours: 22,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        taskId: '1',
        employeeId: '3',
        allocatedHours: 15,
        actualHours: 13,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        taskId: '2',
        employeeId: '2',
        allocatedHours: 35,
        actualHours: 28,
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        taskId: '3',
        employeeId: '1',
        allocatedHours: 8,
        actualHours: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        taskId: '2',
        employeeId: '1',
        allocatedHours: 30,
        actualHours: 0,
        createdAt: new Date().toISOString(),
      },
    ];
    setTaskAssignments(demoAssignments);
  };

  const loadTasks = async () => {
    if (!hasApiConnection) {
      loadDemoTasks();
      return;
    }
    
    // REST API режим
    try {
      const res = await fetch(`${API_URL}/api/tasks`);
      if (!res.ok) throw new Error('Failed to load tasks');
      const data = await res.json();
      const formattedTasks: Task[] = data.map((dbTask: any) => ({
        id: dbTask.id,
        projectId: dbTask.project_id,
        categoryId: dbTask.category_id,
        name: dbTask.name,
        description: dbTask.description,
        plannedHours: dbTask.planned_hours,
        actualHours: dbTask.actual_hours,
        hourlyRate: dbTask.hourly_rate,
        totalCost: dbTask.total_cost,
        status: dbTask.status,
        createdBy: dbTask.created_by,
        // Дедлайн-поля и завершение
        deadline: dbTask.deadline,
        deadlineType: dbTask.deadline_type,
        deadlineReason: dbTask.deadline_reason,
        completedAt: dbTask.completed_at,
        deadlineChangeLog: dbTask.deadline_change_log || [],
        createdAt: dbTask.created_at,
        updatedAt: dbTask.updated_at,
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error loading tasks from REST API:', error);
      loadDemoTasks();
    }
  };

  const loadTaskAssignments = async () => {
    if (!hasApiConnection) return;
    
    try {
      const res = await fetch(`${API_URL}/api/task-assignments`);
      if (!res.ok) throw new Error('Failed to load task assignments');
      const data = await res.json();

      const formattedAssignments: TaskAssignment[] = data.map((dbAssignment: any) => ({
        id: dbAssignment.id,
        taskId: dbAssignment.task_id,
        employeeId: dbAssignment.employee_id,
        allocatedHours: dbAssignment.allocated_hours,
        actualHours: dbAssignment.actual_hours,
        createdAt: dbAssignment.created_at,
        // Поля для дедлайнов
        deadline: dbAssignment.deadline,
        deadlineType: dbAssignment.deadline_type,
        deadlineReason: dbAssignment.deadline_reason,
        priority: dbAssignment.priority,
      }));

      setTaskAssignments(formattedAssignments);
    } catch (error) {
      console.error('Error loading task assignments from REST API:', error);
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'actualHours' | 'totalCost' | 'createdAt' | 'updatedAt'>) => {
    if (!hasApiConnection) {
      // Demo mode
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        actualHours: 0,
        totalCost: task.plannedHours * task.hourlyRate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks(prev => [...prev, newTask]);
      return newTask;
    }

    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: task.projectId,
          categoryId: task.categoryId || null,
          name: task.name,
          description: task.description,
          plannedHours: task.plannedHours,
          hourlyRate: task.hourlyRate,
          status: task.status,
          createdBy: task.createdBy,
          deadline: task.deadline || null,
          deadlineType: task.deadlineType || null,
          deadlineReason: task.deadlineReason || null,
          completedAt: task.completedAt || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      const data = await res.json();
      await loadTasks();
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!hasApiConnection) {
      // Demo mode
      setTasks(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates, updatedAt: new Date().toISOString() } : task
      ));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: updates.categoryId,
          name: updates.name,
          description: updates.description,
          plannedHours: updates.plannedHours,
          hourlyRate: updates.hourlyRate,
          status: updates.status,
          deadline: updates.deadline,
          deadlineType: updates.deadlineType,
          deadlineReason: updates.deadlineReason,
          completedAt: updates.completedAt,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode
      setTasks(prev => prev.filter(task => task.id !== id));
      setTaskAssignments(prev => prev.filter(assignment => assignment.taskId !== id));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      await loadTasks();
      await loadTaskAssignments();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const assignTaskToEmployee = async (
    taskId: string, 
    employeeId: string, 
    allocatedHours: number,
    deadline?: string,
    deadlineType: 'soft' | 'hard' = 'soft',
    deadlineReason?: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ) => {
    if (!hasApiConnection) {
      // Demo mode
      const newAssignment: TaskAssignment = {
        id: Date.now().toString(),
        taskId,
        employeeId,
        allocatedHours,
        actualHours: 0,
        createdAt: new Date().toISOString(),
        deadline,
        deadlineType,
        deadlineReason,
        priority,
      };
      setTaskAssignments(prev => [...prev, newAssignment]);
      return newAssignment;
    }

    try {
      const res = await fetch(`${API_URL}/api/task-assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          employeeId,
          allocatedHours,
          deadline,
          deadlineType,
          deadlineReason,
          priority,
        }),
      });
      if (!res.ok) throw new Error('Failed to assign task');
      const data = await res.json();
      await loadTaskAssignments();
      return data;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const updateTaskAssignment = async (id: string, updates: Partial<TaskAssignment>) => {
    if (!hasApiConnection) {
      // Demo mode
      setTaskAssignments(prev => prev.map(assignment => 
        assignment.id === id ? { ...assignment, ...updates } : assignment
      ));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/task-assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocatedHours: updates.allocatedHours,
          actualHours: updates.actualHours,
          deadline: updates.deadline,
          deadlineType: updates.deadlineType,
          deadlineReason: updates.deadlineReason,
          priority: updates.priority,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task assignment');
      await loadTaskAssignments();
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  };

  const removeTaskAssignment = async (id: string) => {
    if (!hasApiConnection) {
      // Demo mode
      setTaskAssignments(prev => prev.filter(assignment => assignment.id !== id));
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/task-assignments/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove task assignment');
      await loadTaskAssignments();
    } catch (error) {
      console.error('Error removing task assignment:', error);
      throw error;
    }
  };

  const getTasksByProject = (projectId: string) => {
    return tasks.filter(task => task.projectId === projectId);
  };

  const getTaskAssignments = (taskId: string) => {
    return taskAssignments.filter(assignment => assignment.taskId === taskId);
  };

  const getEmployeeTaskAssignments = (employeeId: string) => {
    return taskAssignments.filter(assignment => assignment.employeeId === employeeId);
  };

  const calculateTaskOverrun = (task: Task) => {
    return Math.max(0, task.actualHours - task.plannedHours);
  };

  const calculateEmployeeOverrun = (taskId: string, employeeId: string) => {
    const assignment = taskAssignments.find(
      a => a.taskId === taskId && a.employeeId === employeeId
    );
    if (!assignment) return 0;
    return Math.max(0, assignment.actualHours - assignment.allocatedHours);
  };

  return {
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
    getEmployeeTaskAssignments,
    calculateTaskOverrun,
    calculateEmployeeOverrun,
  };
};
