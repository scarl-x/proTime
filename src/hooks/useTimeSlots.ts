import { useState } from 'react';
import { TimeSlot, WeeklyReport, Booking } from '../types';
import { supabase, hasSupabaseCredentials } from '../lib/supabase';
import { useEffect } from 'react';
import { generateRecurringTasks, RecurringTaskConfig } from '../utils/recurringUtils';
import { STANDUP_TASK_NAME, normalizeStatus } from '../utils/constants';

export const useTimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    if (hasSupabaseCredentials && supabase) {
      loadTimeSlots();
    } else {
      loadDemoTimeSlots();
    }
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
        taskId: '2', // ID задачи "Интеграция с внешними сервисами"
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
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedSlots: TimeSlot[] = data.map(dbSlot => ({
        id: dbSlot.id,
        employeeId: dbSlot.employee_id,
        projectId: dbSlot.project_id,
        taskId: dbSlot.task_id,
        date: dbSlot.date,
        startTime: dbSlot.start_time,
        endTime: dbSlot.end_time,
        start_at_utc: dbSlot.start_at_utc,
        end_at_utc: dbSlot.end_at_utc,
        task: dbSlot.task,
        plannedHours: dbSlot.planned_hours,
        actualHours: dbSlot.actual_hours,
        status: normalizeStatus(dbSlot.status) as 'planned' | 'in-progress' | 'completed',
        category: dbSlot.category || 'Development',
        parentTaskId: dbSlot.parent_task_id,
        taskSequence: dbSlot.task_sequence,
        totalTaskHours: dbSlot.total_task_hours,
        isPaused: dbSlot.is_paused || false,
        pausedAt: dbSlot.paused_at,
        resumedAt: dbSlot.resumed_at,
        completedAt: dbSlot.completed_at,
        isRecurring: dbSlot.is_recurring || false,
        recurrenceType: dbSlot.recurrence_type,
        recurrenceInterval: dbSlot.recurrence_interval,
        recurrenceEndDate: dbSlot.recurrence_end_date,
        recurrenceDays: dbSlot.recurrence_days,
        parentRecurringId: dbSlot.parent_recurring_id,
        recurrenceCount: dbSlot.recurrence_count,
        // Поля для дедлайнов
        deadline: dbSlot.deadline,
        deadlineType: dbSlot.deadline_type,
        isAssignedByAdmin: dbSlot.is_assigned_by_admin,
        deadlineReason: dbSlot.deadline_reason,
      }));

      setTimeSlots(formattedSlots);
    } catch (error) {
      loadDemoTimeSlots();
    }
  };

  const addTimeSlot = async (slot: Omit<TimeSlot, 'id'>) => {
    if (!supabase) {
      // Demo mode - add to local state
      const newSlot: TimeSlot = {
        ...slot,
        id: Date.now().toString(),
      };
      setTimeSlots(prev => [...prev, newSlot]);
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .insert({
          employee_id: slot.employeeId,
          project_id: slot.projectId,
          task_id: slot.taskId,
          date: slot.date,
          start_time: slot.startTime,
          end_time: slot.endTime,
          start_at_utc: slot.start_at_utc,
          end_at_utc: slot.end_at_utc,
          task: slot.task,
          planned_hours: slot.plannedHours,
          actual_hours: slot.actualHours,
          status: slot.status,
          category: slot.category,
          parent_task_id: slot.parentTaskId,
          task_sequence: slot.taskSequence,
          total_task_hours: slot.totalTaskHours,
          is_paused: slot.isPaused,
          paused_at: slot.pausedAt,
          resumed_at: slot.resumedAt,
          is_recurring: slot.isRecurring,
          recurrence_type: slot.recurrenceType,
          recurrence_interval: slot.recurrenceInterval,
          recurrence_end_date: slot.recurrenceEndDate,
          recurrence_days: slot.recurrenceDays,
          parent_recurring_id: slot.parentRecurringId,
          recurrence_count: slot.recurrenceCount,
          // Поля для дедлайнов
          deadline: slot.deadline,
          deadline_type: slot.deadlineType,
          is_assigned_by_admin: slot.isAssignedByAdmin,
          deadline_reason: slot.deadlineReason,
        });

      if (error) throw error;

      await loadTimeSlots();
    } catch (error) {
      throw error;
    }
  };

  const updateTimeSlot = async (id: string, updates: Partial<TimeSlot>) => {
    if (!supabase) {
      // Demo mode - update local state
      setTimeSlots(prev => prev.map(slot => 
        slot.id === id ? { ...slot, ...updates } : slot
      ));
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .update({
          employee_id: updates.employeeId,
          project_id: updates.projectId,
          task_id: updates.taskId,
          date: updates.date,
          start_time: updates.startTime,
          end_time: updates.endTime,
          start_at_utc: updates.start_at_utc,
          end_at_utc: updates.end_at_utc,
          task: updates.task,
          planned_hours: updates.plannedHours,
          actual_hours: updates.actualHours,
          status: updates.status,
          category: updates.category,
          parent_task_id: updates.parentTaskId,
          task_sequence: updates.taskSequence,
          total_task_hours: updates.totalTaskHours,
          is_paused: updates.isPaused,
          paused_at: updates.pausedAt,
          resumed_at: updates.resumedAt,
          is_recurring: updates.isRecurring,
          recurrence_type: updates.recurrenceType,
          recurrence_interval: updates.recurrenceInterval,
          recurrence_end_date: updates.recurrenceEndDate,
          recurrence_days: updates.recurrenceDays,
          parent_recurring_id: updates.parentRecurringId,
          recurrence_count: updates.recurrenceCount,
          // Поля для дедлайнов
          deadline: updates.deadline,
          deadline_type: updates.deadlineType,
          is_assigned_by_admin: updates.isAssignedByAdmin,
          deadline_reason: updates.deadlineReason,
        })
        .eq('id', id);

      if (error) throw error;

      await loadTimeSlots();
    } catch (error) {
      throw error;
    }
  };

  const deleteTimeSlot = async (id: string) => {
    if (!supabase) {
      // Demo mode - remove from local state
      setTimeSlots(prev => prev.filter(slot => slot.id !== id));
      return;
    }

    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadTimeSlots();
    } catch (error) {
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