import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY created_at ASC'
    );

    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      hasAccount: user.has_account,
      birthday: user.birthday,
      employmentDate: user.employment_date,
      terminationDate: user.termination_date,
      timezone: user.timezone,
    }));

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      hasAccount: user.has_account,
      birthday: user.birthday,
      employmentDate: user.employment_date,
      terminationDate: user.termination_date,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role, position, birthday, employmentDate, terminationDate } = req.body;

    if (!name || !email) {
      res.status(400).json({ error: 'Имя и email обязательны' });
      return;
    }

    // Проверяем, существует ли пользователь
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, role, position, has_account, birthday, employment_date, termination_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [name, email, role || 'employee', position, false, birthday, employmentDate, terminationDate]
    );

    const user = result.rows[0];

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      hasAccount: user.has_account,
      birthday: user.birthday,
      employmentDate: user.employment_date,
      terminationDate: user.termination_date,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Ошибка создания пользователя' });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, position, birthday, employmentDate, terminationDate, timezone } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = COALESCE($3, role),
           position = COALESCE($4, position),
           birthday = COALESCE($5, birthday),
           employment_date = COALESCE($6, employment_date),
           termination_date = COALESCE($7, termination_date),
           timezone = COALESCE($8, timezone)
       WHERE id = $9
       RETURNING *`,
      [name, email, role, position, birthday, employmentDate, terminationDate, timezone, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      hasAccount: user.has_account,
      birthday: user.birthday,
      employmentDate: user.employment_date,
      terminationDate: user.termination_date,
      timezone: user.timezone,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ message: 'Пользователь удален', id });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
};

export const createAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      res.status(400).json({ error: 'Пароль обязателен' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `UPDATE users 
       SET has_account = true, password = $1
       WHERE id = $2
       RETURNING *`,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ message: 'Аккаунт создан' });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ error: 'Ошибка создания аккаунта' });
  }
};

export const removeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET has_account = false, password = NULL
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    res.json({ message: 'Аккаунт удален' });
  } catch (error) {
    console.error('Remove account error:', error);
    res.status(500).json({ error: 'Ошибка удаления аккаунта' });
  }
};

