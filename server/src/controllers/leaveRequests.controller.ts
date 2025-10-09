import { Request, Response } from 'express';
import pool from '../config/database.js';

const mapLeaveRequest = (row: any) => ({
  id: row.id,
  employeeId: row.employee_id,
  type: row.type,
  startDate: row.start_date,
  endDate: row.end_date,
  daysCount: parseFloat(row.days_count),
  reason: row.reason,
  status: row.status,
  approvedBy: row.approved_by,
  approvedAt: row.approved_at,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getAllLeaveRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, status, type } = req.query;

    let query = 'SELECT * FROM leave_requests WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      query += ` AND employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    const leaveRequests = result.rows.map(mapLeaveRequest);

    res.json(leaveRequests);
  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({ error: 'Ошибка получения заявок на отпуск' });
  }
};

export const getLeaveRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM leave_requests WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Заявка на отпуск не найдена' });
      return;
    }

    res.json(mapLeaveRequest(result.rows[0]));
  } catch (error) {
    console.error('Get leave request error:', error);
    res.status(500).json({ error: 'Ошибка получения заявки на отпуск' });
  }
};

export const createLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employeeId, type, startDate, endDate, daysCount, reason, notes
    } = req.body;

    if (!employeeId || !type || !startDate || !endDate || !daysCount || !reason) {
      res.status(400).json({
        error: 'Обязательные поля: employeeId, type, startDate, endDate, daysCount, reason'
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (
        employee_id, type, start_date, end_date, days_count,
        reason, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *`,
      [employeeId, type, startDate, endDate, daysCount, reason, 'pending', notes]
    );

    res.status(201).json(mapLeaveRequest(result.rows[0]));
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Ошибка создания заявки на отпуск' });
  }
};

export const updateLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      type, startDate, endDate, daysCount, reason, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE leave_requests 
       SET type = COALESCE($1, type),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           days_count = COALESCE($4, days_count),
           reason = COALESCE($5, reason),
           status = COALESCE($6, status),
           notes = COALESCE($7, notes),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [type, startDate, endDate, daysCount, reason, status, notes, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Заявка на отпуск не найдена' });
      return;
    }

    res.json(mapLeaveRequest(result.rows[0]));
  } catch (error) {
    console.error('Update leave request error:', error);
    res.status(500).json({ error: 'Ошибка обновления заявки на отпуск' });
  }
};

export const deleteLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM leave_requests WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Заявка на отпуск не найдена' });
      return;
    }

    res.json({ message: 'Заявка на отпуск удалена', id });
  } catch (error) {
    console.error('Delete leave request error:', error);
    res.status(500).json({ error: 'Ошибка удаления заявки на отпуск' });
  }
};

export const approveLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const approvedBy = req.user?.userId;

    if (!approvedBy) {
      res.status(401).json({ error: 'Требуется авторизация' });
      return;
    }

    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'approved',
           approved_by = $1,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [approvedBy, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Заявка на отпуск не найдена' });
      return;
    }

    res.json(mapLeaveRequest(result.rows[0]));
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ error: 'Ошибка одобрения заявки на отпуск' });
  }
};

export const rejectLeaveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE leave_requests 
       SET status = 'rejected',
           notes = COALESCE($1, notes),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [notes, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Заявка на отпуск не найдена' });
      return;
    }

    res.json(mapLeaveRequest(result.rows[0]));
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ error: 'Ошибка отклонения заявки на отпуск' });
  }
};

