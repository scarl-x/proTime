import { Request, Response } from 'express';
import pool from '../config/database.js';

export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      'SELECT * FROM projects ORDER BY created_at ASC'
    );

    const projects = result.rows.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      teamLeadId: project.team_lead_id,
      teamMembers: project.team_members || [],
      createdAt: project.created_at,
    }));

    res.json(projects);
  } catch (error) {
    console.error('Get all projects error:', error);
    res.status(500).json({ error: 'Ошибка получения проектов' });
  }
};

export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Проект не найден' });
      return;
    }

    const project = result.rows[0];

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      teamLeadId: project.team_lead_id,
      teamMembers: project.team_members || [],
      createdAt: project.created_at,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Ошибка получения проекта' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color, status, teamLeadId, teamMembers } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Название проекта обязательно' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO projects (name, description, color, status, team_lead_id, team_members, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [name, description || '', color || '#3B82F6', status || 'active', teamLeadId, teamMembers || []]
    );

    const project = result.rows[0];

    res.status(201).json({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      teamLeadId: project.team_lead_id,
      teamMembers: project.team_members || [],
      createdAt: project.created_at,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Ошибка создания проекта' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, color, status, teamLeadId, teamMembers } = req.body;

    const result = await pool.query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           color = COALESCE($3, color),
           status = COALESCE($4, status),
           team_lead_id = COALESCE($5, team_lead_id),
           team_members = COALESCE($6, team_members)
       WHERE id = $7
       RETURNING *`,
      [name, description, color, status, teamLeadId, teamMembers, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Проект не найден' });
      return;
    }

    const project = result.rows[0];

    res.json({
      id: project.id,
      name: project.name,
      description: project.description,
      color: project.color,
      status: project.status,
      teamLeadId: project.team_lead_id,
      teamMembers: project.team_members || [],
      createdAt: project.created_at,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Ошибка обновления проекта' });
  }
};

export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Проект не найден' });
      return;
    }

    res.json({ message: 'Проект удален', id });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Ошибка удаления проекта' });
  }
};

