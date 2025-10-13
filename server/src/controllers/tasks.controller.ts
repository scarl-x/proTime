import { Request, Response } from 'express';
import pool from '../config/database.js';

const mapTask = (row: any) => ({
  id: row.id,
  projectId: row.project_id,
  name: row.name,
  description: row.description,
  plannedHours: parseFloat(row.planned_hours),
  actualHours: parseFloat(row.actual_hours),
  hourlyRate: parseFloat(row.hourly_rate),
  contractHours: row.contract_hours != null ? parseFloat(row.contract_hours) : undefined,
  totalCost: parseFloat(row.total_cost),
  status: row.status,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTaskAssignment = (row: any) => ({
  id: row.id,
  taskId: row.task_id,
  employeeId: row.employee_id,
  allocatedHours: parseFloat(row.allocated_hours),
  actualHours: parseFloat(row.actual_hours),
  deadline: row.deadline,
  deadlineType: row.deadline_type,
  deadlineReason: row.deadline_reason,
  priority: row.priority,
  createdAt: row.created_at,
});

export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { projectId, status } = req.query;

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (projectId) {
      query += ` AND project_id = $${paramIndex}`;
      params.push(projectId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const tasks = result.rows.map(mapTask);

    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
};

export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    res.json(mapTask(result.rows[0]));
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Ошибка получения задачи' });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      projectId, name, description, plannedHours, actualHours,
      hourlyRate, status, createdBy, contractHours
    } = req.body;

    if (!projectId || !name || !createdBy) {
      res.status(400).json({ error: 'Обязательные поля: projectId, name, createdBy' });
      return;
    }

    // total_cost это generated column, не нужно передавать его в INSERT
    const result = await pool.query(
      `INSERT INTO tasks (
        project_id, name, description, planned_hours, actual_hours,
        hourly_rate, contract_hours, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        projectId, name, description || '', plannedHours || 0, actualHours || 0,
        hourlyRate || 0, contractHours, status || 'new', createdBy
      ]
    );

    res.status(201).json(mapTask(result.rows[0]));
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, description, plannedHours, actualHours, hourlyRate, status, contractHours
    } = req.body;

    // total_cost это generated column, он обновится автоматически
    const result = await pool.query(
      `UPDATE tasks 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           planned_hours = COALESCE($3, planned_hours),
           actual_hours = COALESCE($4, actual_hours),
           hourly_rate = COALESCE($5, hourly_rate),
           contract_hours = COALESCE($6, contract_hours),
           status = COALESCE($7, status),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [name, description, plannedHours, actualHours, hourlyRate, contractHours, status, id]
    );

    res.json(mapTask(result.rows[0]));
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Каскадная чистка: сначала удаляем слоты и назначения, затем задачу (в рамках транзакции)
    await pool.query('BEGIN');

    // Удаляем все временные слоты, связанные с задачей
    await pool.query('DELETE FROM time_slots WHERE task_id = $1', [id]);

    // Удаляем все назначения по задаче
    await pool.query('DELETE FROM task_assignments WHERE task_id = $1', [id]);

    // Удаляем задачу
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);

    await pool.query('COMMIT');

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Задача не найдена' });
      return;
    }

    res.json({ message: 'Задача удалена', id });
  } catch (error) {
    console.error('Delete task error:', error);
    try { await pool.query('ROLLBACK'); } catch {}
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
};

export const getTaskAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const assignments = result.rows.map(mapTaskAssignment);
    res.json(assignments);
  } catch (error) {
    console.error('Get task assignments error:', error);
    res.status(500).json({ error: 'Ошибка получения назначений задачи' });
  }
};

export const createTaskAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: taskId } = req.params;
    const {
      employeeId, allocatedHours, actualHours, deadline,
      deadlineType, deadlineReason, priority
    } = req.body;

    if (!employeeId || !allocatedHours) {
      res.status(400).json({ error: 'Обязательные поля: employeeId, allocatedHours' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO task_assignments (
        task_id, employee_id, allocated_hours, actual_hours,
        deadline, deadline_type, deadline_reason, priority, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *`,
      [
        taskId, employeeId, allocatedHours, actualHours || 0,
        deadline, deadlineType, deadlineReason, priority || 'medium'
      ]
    );

    res.status(201).json(mapTaskAssignment(result.rows[0]));
  } catch (error) {
    console.error('Create task assignment error:', error);
    res.status(500).json({ error: 'Ошибка создания назначения задачи' });
  }
};

export const updateTaskAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;
    const {
      allocatedHours, actualHours, deadline, deadlineType,
      deadlineReason, priority
    } = req.body;

    const result = await pool.query(
      `UPDATE task_assignments 
       SET allocated_hours = COALESCE($1, allocated_hours),
           actual_hours = COALESCE($2, actual_hours),
           deadline = COALESCE($3, deadline),
           deadline_type = COALESCE($4, deadline_type),
           deadline_reason = COALESCE($5, deadline_reason),
           priority = COALESCE($6, priority)
       WHERE id = $7
       RETURNING *`,
      [allocatedHours, actualHours, deadline, deadlineType, deadlineReason, priority, assignmentId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Назначение задачи не найдено' });
      return;
    }

    res.json(mapTaskAssignment(result.rows[0]));
  } catch (error) {
    console.error('Update task assignment error:', error);
    res.status(500).json({ error: 'Ошибка обновления назначения задачи' });
  }
};

export const deleteTaskAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignmentId } = req.params;

    await pool.query('BEGIN');

    // Получаем данные назначения, чтобы знать task_id и employee_id
    const assignmentRes = await pool.query(
      'SELECT id, task_id, employee_id FROM task_assignments WHERE id = $1',
      [assignmentId]
    );
    if (assignmentRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      res.status(404).json({ error: 'Назначение задачи не найдено' });
      return;
    }
    const { task_id: taskId, employee_id: employeeId } = assignmentRes.rows[0];

    // Удаляем слоты календаря для этого сотрудника по этой задаче
    await pool.query(
      'DELETE FROM time_slots WHERE task_id = $1 AND employee_id = $2',
      [taskId, employeeId]
    );

    // Удаляем само назначение
    const result = await pool.query(
      'DELETE FROM task_assignments WHERE id = $1 RETURNING id',
      [assignmentId]
    );

    await pool.query('COMMIT');

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Назначение задачи не найдено' });
      return;
    }

    res.json({ message: 'Назначение задачи удалено', id: assignmentId });
  } catch (error) {
    console.error('Delete task assignment error:', error);
    try { await pool.query('ROLLBACK'); } catch {}
    res.status(500).json({ error: 'Ошибка удаления назначения задачи' });
  }
};

