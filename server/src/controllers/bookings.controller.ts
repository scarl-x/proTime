import { Request, Response } from 'express';
import pool from '../config/database.js';

const mapBooking = (row: any) => ({
  id: row.id,
  requesterId: row.requester_id,
  employeeId: row.employee_id,
  projectId: row.project_id,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  durationHours: parseFloat(row.duration_hours),
  taskDescription: row.task_description,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, requesterId, projectId, status } = req.query;

    let query = 'SELECT * FROM bookings WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (employeeId) {
      query += ` AND employee_id = $${paramIndex}`;
      params.push(employeeId);
      paramIndex++;
    }

    if (requesterId) {
      query += ` AND requester_id = $${paramIndex}`;
      params.push(requesterId);
      paramIndex++;
    }

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

    query += ' ORDER BY date DESC, start_time DESC';

    const result = await pool.query(query, params);
    const bookings = result.rows.map(mapBooking);

    res.json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({ error: 'Ошибка получения бронирований' });
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Бронирование не найдено' });
      return;
    }

    res.json(mapBooking(result.rows[0]));
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Ошибка получения бронирования' });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      requesterId, employeeId, projectId, date, startTime, endTime,
      durationHours, taskDescription, status, notes
    } = req.body;

    if (!requesterId || !employeeId || !projectId || !date || !startTime || !endTime || !taskDescription) {
      res.status(400).json({
        error: 'Обязательные поля: requesterId, employeeId, projectId, date, startTime, endTime, taskDescription'
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bookings (
        requester_id, employee_id, project_id, date, start_time, end_time,
        duration_hours, task_description, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        requesterId, employeeId, projectId, date, startTime, endTime,
        durationHours || 0, taskDescription, status || 'pending', notes
      ]
    );

    res.status(201).json(mapBooking(result.rows[0]));
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Ошибка создания бронирования' });
  }
};

export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      date, startTime, endTime, durationHours, taskDescription, status, notes
    } = req.body;

    const result = await pool.query(
      `UPDATE bookings 
       SET date = COALESCE($1, date),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           duration_hours = COALESCE($4, duration_hours),
           task_description = COALESCE($5, task_description),
           status = COALESCE($6, status),
           notes = COALESCE($7, notes),
           updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [date, startTime, endTime, durationHours, taskDescription, status, notes, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Бронирование не найдено' });
      return;
    }

    res.json(mapBooking(result.rows[0]));
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Ошибка обновления бронирования' });
  }
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Бронирование не найдено' });
      return;
    }

    res.json({ message: 'Бронирование удалено', id });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Ошибка удаления бронирования' });
  }
};

