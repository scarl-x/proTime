import { Request, Response } from 'express';
import pool from '../config/database.js';

const mapTaskCategory = (row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  defaultHours: parseFloat(row.default_hours),
  defaultHourlyRate: parseFloat(row.default_hourly_rate),
  color: row.color,
  isActive: row.is_active,
  createdBy: row.created_by,
  createdAt: row.created_at,
});

export const getAllTaskCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { isActive } = req.query;

    let query = 'SELECT * FROM task_categories WHERE 1=1';
    const params: any[] = [];

    if (isActive !== undefined) {
      query += ' AND is_active = $1';
      params.push(isActive === 'true');
    }

    query += ' ORDER BY created_at ASC';

    const result = await pool.query(query, params);
    const categories = result.rows.map(mapTaskCategory);

    res.json(categories);
  } catch (error) {
    console.error('Get all task categories error:', error);
    res.status(500).json({ error: 'Ошибка получения категорий задач' });
  }
};

export const getTaskCategoryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM task_categories WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Категория задачи не найдена' });
      return;
    }

    res.json(mapTaskCategory(result.rows[0]));
  } catch (error) {
    console.error('Get task category error:', error);
    res.status(500).json({ error: 'Ошибка получения категории задачи' });
  }
};

export const createTaskCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, description, defaultHours, defaultHourlyRate, color, isActive, createdBy
    } = req.body;

    if (!name || !createdBy) {
      res.status(400).json({ error: 'Обязательные поля: name, createdBy' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO task_categories (
        name, description, default_hours, default_hourly_rate,
        color, is_active, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        name, description || '', defaultHours || 8, defaultHourlyRate || 0,
        color || '#3B82F6', isActive !== false, createdBy
      ]
    );

    res.status(201).json(mapTaskCategory(result.rows[0]));
  } catch (error) {
    console.error('Create task category error:', error);
    res.status(500).json({ error: 'Ошибка создания категории задачи' });
  }
};

export const updateTaskCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name, description, defaultHours, defaultHourlyRate, color, isActive
    } = req.body;

    const result = await pool.query(
      `UPDATE task_categories 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           default_hours = COALESCE($3, default_hours),
           default_hourly_rate = COALESCE($4, default_hourly_rate),
           color = COALESCE($5, color),
           is_active = COALESCE($6, is_active)
       WHERE id = $7
       RETURNING *`,
      [name, description, defaultHours, defaultHourlyRate, color, isActive, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Категория задачи не найдена' });
      return;
    }

    res.json(mapTaskCategory(result.rows[0]));
  } catch (error) {
    console.error('Update task category error:', error);
    res.status(500).json({ error: 'Ошибка обновления категории задачи' });
  }
};

export const deleteTaskCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM task_categories WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Категория задачи не найдена' });
      return;
    }

    res.json({ message: 'Категория задачи удалена', id });
  } catch (error) {
    console.error('Delete task category error:', error);
    res.status(500).json({ error: 'Ошибка удаления категории задачи' });
  }
};

