import { useState } from 'react';
import { TimeSlot, User, Project } from '../types';
import { useTimeSlots } from './useTimeSlots';
import { generateStandupOccurrences, buildStandupTimeSlot, StandupScheduleParams } from '../utils/standupUtils';

export interface TeamStandupConfig {
  projectId: string; // команда = проект
  employeeIds: string[]; // участники команды (если пусто, используем teamMembers проекта)
  startDate: string;
  endDate: string;
  weekDays: number[]; // 0-6, Mon-Sun в логике приложения
  startTime: string; // HH:mm
  durationHours: number; // 0.5, 1, etc
  title?: string; // например, "Ежедневный дейлик команды"
  category?: string; // категория слота
}

export const useDailyStandups = () => {
  const { addTimeSlot, deleteTimeSlot, timeSlots } = useTimeSlots();
  const [isProcessing, setIsProcessing] = useState(false);

  const createStandupsForTeam = async (
    config: TeamStandupConfig,
    project: Project,
    employeesDirectory: User[]
  ): Promise<{ created: number }> => {
    setIsProcessing(true);
    try {
      const participants = config.employeeIds?.length > 0
        ? config.employeeIds
        : (project.teamMembers || []);

      const occurrences = generateStandupOccurrences({
        startDate: config.startDate,
        endDate: config.endDate,
        weekDays: config.weekDays,
        startTime: config.startTime,
        durationHours: config.durationHours,
      } as StandupScheduleParams);

      const taskTitle = config.title || 'Ежедневный дейлик команды';

      let created = 0;
      for (const employeeId of participants) {
        for (const occurrence of occurrences) {
          const slot = buildStandupTimeSlot({
            employeeId,
            projectId: config.projectId,
            occurrence,
            taskTitle,
            category: config.category || 'Совещание',
          });
          // фактические == плановым уже обеспечено в билдере
          await addTimeSlot(slot);
          created += 1;
        }
      }
      return { created };
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteStandupsForTeam = async (
    params: {
      projectId: string;
      startDate: string;
      endDate: string;
      titleEquals?: string; // если указан, удаляем только слоты с таким названием задачи
    }
  ): Promise<{ deleted: number }> => {
    setIsProcessing(true);
    try {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);
      end.setHours(23,59,59,999);

      const matches = timeSlots.filter(slot => {
        if (slot.projectId !== params.projectId) return false;
        const d = new Date(slot.date);
        if (d < start || d > end) return false;
        // По умолчанию ограничиваемся типичными признаками дейлика
        const looksLikeStandup = (slot.isRecurring === true) && (slot.category === 'Совещание');
        const titleOk = params.titleEquals ? (slot.task === params.titleEquals) : true;
        return looksLikeStandup && titleOk;
      });

      let deleted = 0;
      for (const m of matches) {
        await deleteTimeSlot(m.id);
        deleted += 1;
      }
      return { deleted };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    createStandupsForTeam,
    deleteStandupsForTeam,
  };
};


