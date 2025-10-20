import { Request, Response } from 'express';
import pool from '../config/database.js';

const mapTimeSlot = (row: any) => ({
  id: row.id,
  employeeId: row.employee_id,
  projectId: row.project_id,
  taskId: row.task_id,
  assignmentId: row.assignment_id,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  startAtUtc: row.start_at_utc,
  endAtUtc: row.end_at_utc,
  task: row.task,
  description: row.description,
  plannedHours: parseFloat(row.planned_hours),
  actualHours: parseFloat(row.actual_hours),
  status: row.status,
  category: row.category,
  completedAt: row.completed_at,
  parentTaskId: row.parent_task_id,
  taskSequence: row.task_sequence,
  totalTaskHours: row.total_task_hours ? parseFloat(row.total_task_hours) : null,
  isPaused: row.is_paused,
  pausedAt: row.paused_at,
  resumedAt: row.resumed_at,
  isRecurring: row.is_recurring,
  recurrenceType: row.recurrence_type,
  recurrenceInterval: row.recurrence_interval,
  recurrenceEndDate: row.recurrence_end_date,
  recurrenceDays: row.recurrence_days,
  parentRecurringId: row.parent_recurring_id,
  recurrenceCount: row.recurrence_count,
  deadline: row.deadline,
  deadlineType: row.deadline_type,
  isAssignedByAdmin: row.is_assigned_by_admin,
  deadlineReason: row.deadline_reason,
  createdAt: row.created_at,
});

export const getAllTimeSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, projectId, dateFrom, dateTo } = req.query;

    let query = 'SELECT * FROM time_slots WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      query += ` AND employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (projectId) {
      query += ` AND project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    if (dateFrom) {
      query += ` AND date >= $${paramIndex}`;
      params.push(dateFrom);
      paramIndex++;
    }

    if (dateTo) {
      query += ` AND date <= $${paramIndex}`;
      params.push(dateTo);
      paramIndex++;
    }

    query += ' ORDER BY date DESC, start_time DESC';

    const result = await pool.query(query, params);
    const timeSlots = result.rows.map(mapTimeSlot);

    res.json(timeSlots);
  } catch (error) {
    console.error('Get all time slots error:', error);
    res.status(500).json({ error: 'Ошибка получения временных слотов' });
  }
};

export const getTimeSlotById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM time_slots WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Временной слот не найден' });
      return;
    }

    res.json(mapTimeSlot(result.rows[0]));
  } catch (error) {
    console.error('Get time slot error:', error);
    res.status(500).json({ error: 'Ошибка получения временного слота' });
  }
};

export const createTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employeeId, projectId, taskId, date, startTime, endTime, startAtUtc, endAtUtc,
      assignmentId,
      task, description, plannedHours, actualHours, status, category, completedAt,
      parentTaskId, taskSequence, totalTaskHours, isPaused, pausedAt, resumedAt,
      isRecurring, recurrenceType, recurrenceInterval, recurrenceEndDate,
      recurrenceDays, parentRecurringId, recurrenceCount,
      deadline, deadlineType, isAssignedByAdmin, deadlineReason
    } = req.body;

    if (!employeeId || !projectId || !date || !task) {
      res.status(400).json({ error: 'Обязательные поля: employeeId, projectId, date, task' });
      return;
    }


    // Фронтенд уже отправляет данные в UTC, просто используем их
    // Если UTC поля не переданы, используем date + time (уже должны быть в UTC от фронтенда)
    const finalStartAtUtc = startAtUtc || (startTime ? `${date}T${startTime}Z` : null);
    const finalEndAtUtc = endAtUtc || (endTime ? `${date}T${endTime}Z` : null);
    
    console.log('💾 Saving to DB:', {
      finalStartAtUtc,
      finalEndAtUtc,
    });

    // Проверяем валидность assignmentId, чтобы не нарушить FK
    let assignmentIdToUse = assignmentId || null;
    if (assignmentId) {
      try {
        const check = await pool.query('SELECT id FROM task_assignments WHERE id = $1', [assignmentId]);
        if (check.rows.length === 0) {
          console.warn('Assignment not found for provided assignmentId, saving slot without assignment link:', assignmentId);
          assignmentIdToUse = null;
        }
      } catch (e) {
        console.warn('Assignment check failed, fallback to null assignmentId');
        assignmentIdToUse = null;
      }
    }

    const result = await pool.query(
      `INSERT INTO time_slots (
        employee_id, project_id, task_id, assignment_id, date, start_time, end_time, start_at_utc, end_at_utc,
        task, description, planned_hours, actual_hours, status, category, completed_at,
        parent_task_id, task_sequence, total_task_hours, is_paused, paused_at, resumed_at,
        is_recurring, recurrence_type, recurrence_interval, recurrence_end_date,
        recurrence_days, parent_recurring_id, recurrence_count,
        deadline, deadline_type, is_assigned_by_admin, deadline_reason, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, NOW()
      ) RETURNING *`,
      [
        employeeId, projectId, taskId, assignmentIdToUse, date, startTime, endTime, finalStartAtUtc, finalEndAtUtc,
        task, description, plannedHours || 0, actualHours || 0, status || 'planned', category || 'general', completedAt,
        parentTaskId, taskSequence, totalTaskHours, isPaused || false, pausedAt, resumedAt,
        isRecurring || false, recurrenceType, recurrenceInterval, recurrenceEndDate,
        recurrenceDays, parentRecurringId, recurrenceCount,
        deadline, deadlineType, isAssignedByAdmin || false, deadlineReason
      ]
    );

    res.status(201).json(mapTimeSlot(result.rows[0]));
  } catch (error) {
    console.error('Create time slot error:', error);
    res.status(500).json({ error: 'Ошибка создания временного слота' });
  }
};

export const updateTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Строим динамический запрос обновления
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMapping: Record<string, string> = {
      employeeId: 'employee_id',
      projectId: 'project_id',
      taskId: 'task_id',
      assignmentId: 'assignment_id',
      date: 'date',
      startTime: 'start_time',
      endTime: 'end_time',
      startAtUtc: 'start_at_utc',
      endAtUtc: 'end_at_utc',
      task: 'task',
      description: 'description',
      plannedHours: 'planned_hours',
      actualHours: 'actual_hours',
      status: 'status',
      category: 'category',
      completedAt: 'completed_at',
      parentTaskId: 'parent_task_id',
      taskSequence: 'task_sequence',
      totalTaskHours: 'total_task_hours',
      isPaused: 'is_paused',
      pausedAt: 'paused_at',
      resumedAt: 'resumed_at',
      isRecurring: 'is_recurring',
      recurrenceType: 'recurrence_type',
      recurrenceInterval: 'recurrence_interval',
      recurrenceEndDate: 'recurrence_end_date',
      recurrenceDays: 'recurrence_days',
      parentRecurringId: 'parent_recurring_id',
      recurrenceCount: 'recurrence_count',
      deadline: 'deadline',
      deadlineType: 'deadline_type',
      isAssignedByAdmin: 'is_assigned_by_admin',
      deadlineReason: 'deadline_reason',
    };

    for (const [jsKey, dbKey] of Object.entries(fieldMapping)) {
      if (updates[jsKey] !== undefined) {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[jsKey]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ error: 'Нет данных для обновления' });
      return;
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE time_slots SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Временной слот не найден' });
      return;
    }

    const updated = mapTimeSlot(result.rows[0]);

    // Двусторонняя синхронизация: обновим статус задачи на основе слотов
    if (updated.taskId && updates.status !== undefined) {
      const slotsRes = await pool.query(
        'SELECT status FROM time_slots WHERE task_id = $1',
        [updated.taskId]
      );
      const statuses: string[] = slotsRes.rows.map((r: any) => r.status);
      let newTaskStatus: 'planned' | 'in-progress' | 'closed' = 'planned';
      if (statuses.every(s => s === 'completed')) newTaskStatus = 'closed';
      else if (statuses.some(s => s === 'in-progress')) newTaskStatus = 'in-progress';
      else newTaskStatus = 'planned';

      await pool.query('UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2', [newTaskStatus, updated.taskId]);
    }

    res.json(updated);
  } catch (error) {
    console.error('Update time slot error:', error);
    res.status(500).json({ error: 'Ошибка обновления временного слота' });
  }
};

export const deleteTimeSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query('BEGIN');

    // Получаем слот, чтобы определить task_id и employee_id
    const slotRes = await pool.query('SELECT id, task_id, employee_id FROM time_slots WHERE id = $1', [id]);
    if (slotRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: 'Временной слот не найден' });
      return;
    }

    const { task_id: taskId, employee_id: employeeId } = slotRes.rows[0];

    // Удаляем сам слот
    const result = await pool.query('DELETE FROM time_slots WHERE id = $1 RETURNING id, task_id', [id]);

    // Если слот был привязан к задаче, проверяем, остались ли ещё слоты по этому назначению
    if (taskId && employeeId) {
      const remainRes = await pool.query(
        'SELECT 1 FROM time_slots WHERE task_id = $1 AND employee_id = $2 LIMIT 1',
        [taskId, employeeId]
      );
      // Если слотов больше нет — удаляем назначение
      if (remainRes.rows.length === 0) {
        await pool.query(
          'DELETE FROM task_assignments WHERE task_id = $1 AND employee_id = $2',
          [taskId, employeeId]
        );
      }
    }

    await pool.query('COMMIT');

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Временной слот не найден' });
      return;
    }

    res.json({ message: 'Временной слот удален', id });
  } catch (error) {
    console.error('Delete time slot error:', error);
    try { await pool.query('ROLLBACK'); } catch {}
    res.status(500).json({ error: 'Ошибка удаления временного слота' });
  }
};

