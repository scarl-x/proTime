import { useState, useEffect } from 'react';
import { TimeSlot, WeeklyReport, Booking } from '../types';
import { timeSlotsAPI } from '../lib/api';
import { generateRecurringTasks, RecurringTaskConfig } from '../utils/recurringUtils';
import { STANDUP_TASK_NAME, normalizeStatus } from '../utils/constants';

export const useTimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    loadTimeSlots();
  }, []);

  const loadDemoTimeSlots = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const demoSlots: TimeSlot[] = [
      {
        id: '1',
        employeeId: '2',
        projectId: '1',
        taskId: 'task-1',
        date: today.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        task: 'Разработка API для CRM системы',
        plannedHours: 8,
        actualHours: 7.5,
        status: 'completed',
        category: 'Development',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
      },
      {
        id: '2',
        employeeId: '3',
        projectId: '1',
        taskId: 'task-2',
        date: yesterday.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '18:00',
        task: 'Дизайн интерфейса пользователя',
        plannedHours: 8,
        actualHours: 8,
        status: 'completed',
        category: 'Design',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
      },
      {
        id: '3',
        employeeId: '1',
        projectId: '1',
        taskId: '2',
        date: today.toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        task: 'Интеграция с внешними сервисами (из задачи проекта)',
        plannedHours: 8,
        actualHours: 0,
        status: 'planned',
        category: 'Development',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
      },
    ];
    setTimeSlots(demoSlots);
  };

  const loadTimeSlots = async () => {
    try {
      const slots = await timeSlotsAPI.getAll();
      
      // Нормализуем статусы, если нужно
      const normalizedSlots = slots.map(slot => ({
        ...slot,
        status: normalizeStatus(slot.status) as 'planned' | 'in-progress' | 'completed',
        category: slot.category || 'Development',
        isPaused: slot.isPaused || false,
        isRecurring: slot.isRecurring || false,
      }));

      setTimeSlots(normalizedSlots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      loadDemoTimeSlots();
    }
  };

  const addTimeSlot = async (slot: Omit<TimeSlot, 'id'>) => {
    try {
      await timeSlotsAPI.create(slot);
      await loadTimeSlots();
    } catch (error) {
      console.error('Error adding time slot:', error);
      throw error;
    }
  };

  const updateTimeSlot = async (id: string, updates: Partial<TimeSlot>) => {
    try {
      await timeSlotsAPI.update(id, updates);
      await loadTimeSlots();
    } catch (error) {
      console.error('Error updating time slot:', error);
      throw error;
    }
  };

  const deleteTimeSlot = async (id: string) => {
    // Находим слот перед удалением, чтобы вернуть информацию о связанной задаче
    const slotToDelete = timeSlots.find(slot => slot.id === id);
    
    try {
      await timeSlotsAPI.delete(id);
      await loadTimeSlots();
      return slotToDelete; // Возвращаем информацию о слоте для удаления связанной задачи
    } catch (error) {
      console.error('Error deleting time slot:', error);
      throw error;
    }
  };

  const addRecurringTimeSlot = async (slot: Omit<TimeSlot, 'id'>, config: RecurringTaskConfig) => {
    const recurringTasks = generateRecurringTasks(slot, config);
    
    for (const task of recurringTasks) {
      await addTimeSlot(task);
    }
  };

  const getSlotsByEmployee = (employeeId: string) => {
    return timeSlots.filter(slot => slot.employeeId === employeeId);
  };

  const getSlotsByDate = (date: string, employeeId?: string) => {
    return timeSlots.filter(
      slot =>
        slot.date === date && (employeeId ? slot.employeeId === employeeId : true)
    );
  };

  const getSlotsByProject = (projectId: string, employeeId?: string) => {
    return timeSlots.filter(
      slot =>
        slot.projectId === projectId && (employeeId ? slot.employeeId === employeeId : true)
    );
  };

  const getWeeklyReport = (employeeId: string, weekStart: string): WeeklyReport => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekSlots = timeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return (
        slot.employeeId === employeeId &&
        slotDate >= new Date(weekStart) &&
        slotDate <= weekEnd &&
        slot.task !== STANDUP_TASK_NAME // Исключаем дейлики из отчетов
      );
    });

    const totalPlannedHours = weekSlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActualHours = weekSlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    // Отклонение считаем только по слотам, у которых дедлайн прошёл
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const variance = weekSlots.reduce((sum, slot) => {
      if (!slot.deadline) return sum;
      const deadline = new Date(slot.deadline);
      if (deadline < startOfToday) {
        return sum + (slot.actualHours - slot.plannedHours);
      }
      return sum;
    }, 0);

    return {
      employeeId,
      projectId: undefined,
      weekStart,
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalPlannedHours,
      totalActualHours,
      variance,
      slots: weekSlots,
    };
  };

  const getProjectWeeklyReport = (projectId: string, employeeId: string, weekStart: string): WeeklyReport => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekSlots = timeSlots.filter(slot => {
      const slotDate = new Date(slot.date);
      return (
        slot.employeeId === employeeId &&
        slot.projectId === projectId &&
        slotDate >= new Date(weekStart) &&
        slotDate <= weekEnd &&
        slot.task !== STANDUP_TASK_NAME // Исключаем дейлики из отчетов
      );
    });

    const totalPlannedHours = weekSlots.reduce((sum, slot) => sum + slot.plannedHours, 0);
    const totalActualHours = weekSlots.reduce((sum, slot) => sum + slot.actualHours, 0);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const variance = weekSlots.reduce((sum, slot) => {
      if (!slot.deadline) return sum;
      const deadline = new Date(slot.deadline);
      if (deadline < startOfToday) {
        return sum + (slot.actualHours - slot.plannedHours);
      }
      return sum;
    }, 0);

    return {
      employeeId,
      projectId,
      weekStart,
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalPlannedHours,
      totalActualHours,
      variance,
      slots: weekSlots,
    };
  };

  // Convert approved bookings to time slots
  const convertBookingsToTimeSlots = (bookings: Booking[]): TimeSlot[] => {
    return bookings
      .filter(booking => booking.status === 'approved')
      .map(booking => ({
        id: `booking-${booking.id}`,
        employeeId: booking.employeeId,
        projectId: booking.projectId,
        taskId: undefined, // Бронирования не связаны с задачами напрямую
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        task: `[БРОНИРОВАНИЕ] ${booking.taskDescription}`,
        plannedHours: booking.durationHours,
        actualHours: 0,
        status: 'planned' as const,
        category: 'Бронирование',
        parentTaskId: undefined,
        taskSequence: undefined,
        totalTaskHours: undefined,
        isPaused: false,
        pausedAt: undefined,
        resumedAt: undefined,
        isRecurring: false,
        recurrenceType: undefined,
        recurrenceInterval: undefined,
        recurrenceEndDate: undefined,
        recurrenceDays: undefined,
        parentRecurringId: undefined,
        recurrenceCount: undefined,
      }));
  };

  // Get all time slots including converted bookings
  const getAllTimeSlots = (bookings: Booking[]): TimeSlot[] => {
    const bookingTimeSlots = convertBookingsToTimeSlots(bookings);
    return [...timeSlots, ...bookingTimeSlots];
  };

  return {
    timeSlots,
    addTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
    getSlotsByEmployee,
    getSlotsByDate,
    getWeeklyReport,
    getSlotsByProject,
    getProjectWeeklyReport,
    addRecurringTimeSlot,
    convertBookingsToTimeSlots,
    getAllTimeSlots,
  };
};
