import { useState, useEffect } from 'react';
import { Task, TaskAssignment } from '../types';
import { tasksAPI } from '../lib/api';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<TaskAssignment[]>([]);

  useEffect(() => {
    loadTasks();
    loadAllTaskAssignments();
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
    try {
      const loadedTasks = await tasksAPI.getAll();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      loadDemoTasks();
    }
  };

  const loadAllTaskAssignments = async () => {
    try {
      // Загружаем назначения для всех задач
      const allAssignments: TaskAssignment[] = [];
      for (const task of tasks) {
        const assignments = await tasksAPI.getAssignments(task.id);
        allAssignments.push(...assignments);
      }
      setTaskAssignments(allAssignments);
    } catch (error) {
      console.error('Error loading task assignments:', error);
    }
  };

  const loadTaskAssignments = async (taskId: string) => {
    try {
      const assignments = await tasksAPI.getAssignments(taskId);
      // Обновляем только назначения для этой задачи
      setTaskAssignments(prev => [
        ...prev.filter(a => a.taskId !== taskId),
        ...assignments
      ]);
    } catch (error) {
      console.error('Error loading task assignments:', error);
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'actualHours' | 'totalCost' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask = await tasksAPI.create(task);
      await loadTasks();
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await tasksAPI.update(id, updates);
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.delete(id);
      await loadTasks();
      // Также удаляем назначения из локального состояния
      setTaskAssignments(prev => prev.filter(assignment => assignment.taskId !== id));
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
    try {
      const newAssignment = await tasksAPI.createAssignment(taskId, {
        employeeId,
        allocatedHours,
        actualHours: 0,
        deadline,
        deadlineType,
        deadlineReason,
        priority,
      });
      await loadTaskAssignments(taskId);
      return newAssignment;
    } catch (error) {
      console.error('Error assigning task:', error);
      throw error;
    }
  };

  const updateTaskAssignment = async (id: string, updates: Partial<TaskAssignment>) => {
    try {
      await tasksAPI.updateAssignment(id, updates);
      // Найдем taskId для перезагрузки назначений
      const assignment = taskAssignments.find(a => a.id === id);
      if (assignment) {
        await loadTaskAssignments(assignment.taskId);
      }
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw error;
    }
  };

  const removeTaskAssignment = async (id: string) => {
    try {
      await tasksAPI.deleteAssignment(id);
      // Удаляем из локального состояния
      setTaskAssignments(prev => prev.filter(assignment => assignment.id !== id));
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
