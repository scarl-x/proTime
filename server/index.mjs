import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool } from './pg.mjs';

const app = express();
const port = process.env.API_PORT || 4000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('select 1 as ok');
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'db_unavailable' });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, name, email, role, position, has_account, password, birthday, employment_date, termination_date, created_at, department, timezone from users order by created_at asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_users' });
  }
});

// Projects
app.get('/api/projects', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, name, description, color, status, team_members, created_at, team_lead_id from projects order by created_at asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  const { name, description = '', color = '#3B82F6', status = 'active', team_members = [], team_lead_id = null } = req.body || {};
  try {
    const { rows } = await pool.query(
      'insert into projects (name, description, color, status, team_members, team_lead_id) values ($1,$2,$3,$4,$5,$6) returning *',
      [name, description, color, status, team_members, team_lead_id]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_project' });
  }
});

app.patch('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, color, status, team_members, team_lead_id } = req.body || {};
  try {
    const { rows } = await pool.query(
      `update projects set
        name = coalesce($2, name),
        description = coalesce($3, description),
        color = coalesce($4, color),
        status = coalesce($5, status),
        team_members = coalesce($6, team_members),
        team_lead_id = coalesce($7, team_lead_id)
      where id = $1 returning *`,
      [id, name, description, color, status, team_members, team_lead_id]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from projects where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_project' });
  }
});

// Time slots (subset)
app.get('/api/time-slots', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from time_slots order by date desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_time_slots' });
  }
});

app.post('/api/time-slots', async (req, res) => {
  const body = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into time_slots (
        employee_id, project_id, task_id, date, start_time, end_time,
        start_at_utc, end_at_utc, task, planned_hours, actual_hours, status,
        category, parent_task_id, task_sequence, total_task_hours,
        is_paused, paused_at, resumed_at, is_recurring, recurrence_type,
        recurrence_interval, recurrence_end_date, recurrence_days,
        parent_recurring_id, recurrence_count, deadline, deadline_type,
        is_assigned_by_admin, deadline_reason
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      ) returning *`,
      [
        body.employeeId, body.projectId, body.taskId, body.date, body.startTime, body.endTime,
        body.start_at_utc, body.end_at_utc, body.task, body.plannedHours, body.actualHours, body.status,
        body.category, body.parentTaskId, body.taskSequence, body.totalTaskHours,
        body.isPaused, body.pausedAt, body.resumedAt, body.isRecurring, body.recurrenceType,
        body.recurrenceInterval, body.recurrenceEndDate, body.recurrenceDays,
        body.parentRecurringId, body.recurrenceCount, body.deadline, body.deadlineType,
        body.isAssignedByAdmin, body.deadlineReason
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_time_slot' });
  }
});

app.patch('/api/time-slots/:id', async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const { rows } = await pool.query(
      `update time_slots set
        employee_id = coalesce($2, employee_id),
        project_id = coalesce($3, project_id),
        task_id = coalesce($4, task_id),
        date = coalesce($5, date),
        start_time = coalesce($6, start_time),
        end_time = coalesce($7, end_time),
        start_at_utc = coalesce($8, start_at_utc),
        end_at_utc = coalesce($9, end_at_utc),
        task = coalesce($10, task),
        planned_hours = coalesce($11, planned_hours),
        actual_hours = coalesce($12, actual_hours),
        status = coalesce($13, status),
        category = coalesce($14, category),
        parent_task_id = coalesce($15, parent_task_id),
        task_sequence = coalesce($16, task_sequence),
        total_task_hours = coalesce($17, total_task_hours),
        is_paused = coalesce($18, is_paused),
        paused_at = coalesce($19, paused_at),
        resumed_at = coalesce($20, resumed_at),
        is_recurring = coalesce($21, is_recurring),
        recurrence_type = coalesce($22, recurrence_type),
        recurrence_interval = coalesce($23, recurrence_interval),
        recurrence_end_date = coalesce($24, recurrence_end_date),
        recurrence_days = coalesce($25, recurrence_days),
        parent_recurring_id = coalesce($26, parent_recurring_id),
        recurrence_count = coalesce($27, recurrence_count),
        deadline = coalesce($28, deadline),
        deadline_type = coalesce($29, deadline_type),
        is_assigned_by_admin = coalesce($30, is_assigned_by_admin),
        deadline_reason = coalesce($31, deadline_reason)
      where id = $1 returning *`,
      [
        id,
        body.employeeId, body.projectId, body.taskId, body.date, body.startTime, body.endTime,
        body.start_at_utc, body.end_at_utc, body.task, body.plannedHours, body.actualHours, body.status,
        body.category, body.parentTaskId, body.taskSequence, body.totalTaskHours,
        body.isPaused, body.pausedAt, body.resumedAt, body.isRecurring, body.recurrenceType,
        body.recurrenceInterval, body.recurrenceEndDate, body.recurrenceDays,
        body.parentRecurringId, body.recurrenceCount, body.deadline, body.deadlineType,
        body.isAssignedByAdmin, body.deadlineReason
      ]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_time_slot' });
  }
});

app.delete('/api/time-slots/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from time_slots where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_time_slot' });
  }
});

// Start server
// Tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from tasks order by created_at desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into tasks (
        project_id, category_id, name, description, planned_hours, hourly_rate,
        status, created_by, deadline, deadline_type, deadline_reason, completed_at
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
      [
        b.projectId, b.categoryId || null, b.name, b.description || '', b.plannedHours, b.hourlyRate,
        b.status || 'new', b.createdBy, b.deadline || null, b.deadlineType || null, b.deadlineReason || null, b.completedAt || null,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_task' });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `update tasks set
        category_id = coalesce($2, category_id),
        name = coalesce($3, name),
        description = coalesce($4, description),
        planned_hours = coalesce($5, planned_hours),
        hourly_rate = coalesce($6, hourly_rate),
        status = coalesce($7, status),
        deadline = coalesce($8, deadline),
        deadline_type = coalesce($9, deadline_type),
        deadline_reason = coalesce($10, deadline_reason),
        completed_at = coalesce($11, completed_at),
        updated_at = now()
      where id = $1 returning *`,
      [
        id,
        b.categoryId, b.name, b.description, b.plannedHours, b.hourlyRate,
        b.status, b.deadline, b.deadlineType, b.deadlineReason, b.completedAt,
      ]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_task' });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from tasks where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_task' });
  }
});

// Task assignments
app.get('/api/task-assignments', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from task_assignments order by created_at desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_task_assignments' });
  }
});

app.post('/api/task-assignments', async (req, res) => {
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into task_assignments (
        task_id, employee_id, allocated_hours, deadline, deadline_type, deadline_reason, priority
      ) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [b.taskId, b.employeeId, b.allocatedHours, b.deadline || null, b.deadlineType || null, b.deadlineReason || null, b.priority || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_task_assignment' });
  }
});

app.patch('/api/task-assignments/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `update task_assignments set
        allocated_hours = coalesce($2, allocated_hours),
        actual_hours = coalesce($3, actual_hours),
        deadline = coalesce($4, deadline),
        deadline_type = coalesce($5, deadline_type),
        deadline_reason = coalesce($6, deadline_reason),
        priority = coalesce($7, priority)
      where id = $1 returning *`,
      [id, b.allocatedHours, b.actualHours, b.deadline, b.deadlineType, b.deadlineReason, b.priority]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_task_assignment' });
  }
});

app.delete('/api/task-assignments/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from task_assignments where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_task_assignment' });
  }
});

// Bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from bookings order by created_at desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_bookings' });
  }
});

// Task categories
app.get('/api/task-categories', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from task_categories where is_active = true order by name asc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_task_categories' });
  }
});

app.post('/api/task-categories', async (req, res) => {
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into task_categories (name, description, default_hours, default_hourly_rate, color, is_active, created_by)
       values ($1,$2,$3,$4,$5,coalesce($6,true),$7) returning *`,
      [b.name, b.description || '', b.defaultHours || 0, b.defaultHourlyRate || 0, b.color || '#3B82F6', b.isActive, b.createdBy]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_task_category' });
  }
});

app.patch('/api/task-categories/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `update task_categories set
        name = coalesce($2, name),
        description = coalesce($3, description),
        default_hours = coalesce($4, default_hours),
        default_hourly_rate = coalesce($5, default_hourly_rate),
        color = coalesce($6, color),
        is_active = coalesce($7, is_active)
      where id = $1 returning *`,
      [id, b.name, b.description, b.defaultHours, b.defaultHourlyRate, b.color, b.isActive]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_task_category' });
  }
});

app.delete('/api/task-categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('update task_categories set is_active = false where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_task_category' });
  }
});

// Leave requests
app.get('/api/leave-requests', async (req, res) => {
  try {
    const { rows } = await pool.query('select * from leave_requests order by created_at desc');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_list_leave_requests' });
  }
});

app.post('/api/leave-requests', async (req, res) => {
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into leave_requests (
        employee_id, type, start_date, end_date, days_count, reason, status, approved_by, approved_at, notes, worked
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *`,
      [b.employeeId, b.type, b.startDate, b.endDate, b.daysCount, b.reason, b.status || 'pending', b.approvedBy || null, b.approvedAt || null, b.notes || null, b.worked || false]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_leave_request' });
  }
});

app.patch('/api/leave-requests/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `update leave_requests set
        employee_id = coalesce($2, employee_id),
        type = coalesce($3, type),
        start_date = coalesce($4, start_date),
        end_date = coalesce($5, end_date),
        days_count = coalesce($6, days_count),
        reason = coalesce($7, reason),
        status = coalesce($8, status),
        approved_by = coalesce($9, approved_by),
        approved_at = coalesce($10, approved_at),
        notes = coalesce($11, notes),
        worked = coalesce($12, worked)
      where id = $1 returning *`,
      [id, b.employeeId, b.type, b.startDate, b.endDate, b.daysCount, b.reason, b.status, b.approvedBy, b.approvedAt, b.notes, b.worked]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_leave_request' });
  }
});

app.delete('/api/leave-requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from leave_requests where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_leave_request' });
  }
});

app.post('/api/bookings', async (req, res) => {
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `insert into bookings (
        requester_id, employee_id, project_id, date, start_time, end_time, duration_hours, task_description, status, notes
      ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [b.requesterId, b.employeeId, b.projectId, b.date, b.startTime, b.endTime, b.durationHours, b.taskDescription, b.status || 'pending', b.notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_create_booking' });
  }
});

app.patch('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  const b = req.body || {};
  try {
    const { rows } = await pool.query(
      `update bookings set
        requester_id = coalesce($2, requester_id),
        employee_id = coalesce($3, employee_id),
        project_id = coalesce($4, project_id),
        date = coalesce($5, date),
        start_time = coalesce($6, start_time),
        end_time = coalesce($7, end_time),
        duration_hours = coalesce($8, duration_hours),
        task_description = coalesce($9, task_description),
        status = coalesce($10, status),
        notes = coalesce($11, notes),
        updated_at = now()
      where id = $1 returning *`,
      [id, b.requesterId, b.employeeId, b.projectId, b.date, b.startTime, b.endTime, b.durationHours, b.taskDescription, b.status, b.notes]
    );
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'failed_to_update_booking' });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('delete from bookings where id = $1', [id]);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed_to_delete_booking' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});


