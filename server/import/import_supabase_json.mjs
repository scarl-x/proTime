import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false });

const DATA_DIR = path.resolve(process.cwd(), 'server', 'import', 'data');

async function readJson(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  const exists = await fs
    .access(file)
    .then(() => true)
    .catch(() => false);
  if (!exists) return [];
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function run() {
  console.log('Starting import from JSON to Postgres...');
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('set session_replication_role = replica');

    const users = await readJson('users');
    for (const u of users) {
      await client.query(
        `insert into users (id, name, email, role, position, has_account, password, birthday, employment_date, termination_date, created_at, department, timezone)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         on conflict (id) do update set name=excluded.name`,
        [u.id, u.name, u.email, u.role, u.position || null, u.has_account ?? false, u.password || null, u.birthday || null, u.employment_date || null, u.termination_date || null, u.created_at || new Date().toISOString(), u.department || null, u.timezone || null]
      );
    }

    const projects = await readJson('projects');
    for (const p of projects) {
      await client.query(
        `insert into projects (id, name, description, color, status, team_members, created_at, team_lead_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (id) do update set name=excluded.name`,
        [p.id, p.name, p.description || '', p.color || '#3B82F6', p.status, p.team_members || [], p.created_at || new Date().toISOString(), p.team_lead_id || null]
      );
    }

    const categories = await readJson('task_categories');
    for (const c of categories) {
      await client.query(
        `insert into task_categories (id, name, description, default_hours, default_hourly_rate, color, is_active, created_by, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (id) do update set name=excluded.name`,
        [c.id, c.name, c.description || '', Number(c.default_hours || 0), Number(c.default_hourly_rate || 0), c.color || '#3B82F6', c.is_active ?? true, c.created_by || null, c.created_at || new Date().toISOString()]
      );
    }

    const tasks = await readJson('tasks');
    for (const t of tasks) {
      await client.query(
        `insert into tasks (id, project_id, name, description, planned_hours, actual_hours, hourly_rate, status, created_by, created_at, updated_at, category_id, deadline, deadline_type, is_assigned_by_admin, deadline_reason, priority, completed_at, deadline_change_log)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
         on conflict (id) do update set name=excluded.name`,
        [t.id, t.project_id, t.name, t.description || '', Number(t.planned_hours || 0), Number(t.actual_hours || 0), Number(t.hourly_rate || 0), t.status, t.created_by, t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString(), t.category_id || null, t.deadline || null, t.deadline_type || null, t.is_assigned_by_admin ?? false, t.deadline_reason || null, t.priority || null, t.completed_at || null, t.deadline_change_log || null]
      );
    }

    const assignments = await readJson('task_assignments');
    for (const a of assignments) {
      await client.query(
        `insert into task_assignments (id, task_id, employee_id, allocated_hours, actual_hours, created_at, deadline, deadline_type, deadline_reason, priority, completed_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         on conflict (id) do update set allocated_hours=excluded.allocated_hours`,
        [a.id, a.task_id, a.employee_id, Number(a.allocated_hours || 0), Number(a.actual_hours || 0), a.created_at || new Date().toISOString(), a.deadline || null, a.deadline_type || null, a.deadline_reason || null, a.priority || null, a.completed_at || null]
      );
    }

    const timeSlots = await readJson('time_slots');
    for (const s of timeSlots) {
      await client.query(
        `insert into time_slots (id, employee_id, project_id, date, start_time, end_time, task, planned_hours, actual_hours, status, category, created_at, parent_task_id, task_sequence, total_task_hours, is_paused, paused_at, resumed_at, is_recurring, recurrence_type, recurrence_interval, recurrence_end_date, recurrence_days, parent_recurring_id, recurrence_count, task_id, deadline, deadline_type, is_assigned_by_admin, deadline_reason, completed_at, start_at_utc, end_at_utc)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33)
         on conflict (id) do update set task=excluded.task`,
        [s.id, s.employee_id, s.project_id, s.date, s.start_time, s.end_time, s.task, Number(s.planned_hours || 0), Number(s.actual_hours || 0), s.status, s.category || 'Development', s.created_at || new Date().toISOString(), s.parent_task_id || null, s.task_sequence || null, s.total_task_hours ? Number(s.total_task_hours) : null, s.is_paused ?? false, s.paused_at || null, s.resumed_at || null, s.is_recurring ?? false, s.recurrence_type || null, s.recurrence_interval || 1, s.recurrence_end_date || null, s.recurrence_days || null, s.parent_recurring_id || null, s.recurrence_count || null, s.task_id || null, s.deadline || null, s.deadline_type || null, s.is_assigned_by_admin ?? false, s.deadline_reason || null, s.completed_at || null, s.start_at_utc || null, s.end_at_utc || null]
      );
    }

    const bookings = await readJson('bookings');
    for (const b of bookings) {
      await client.query(
        `insert into bookings (id, requester_id, employee_id, project_id, date, start_time, end_time, duration_hours, task_description, status, notes, created_at, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         on conflict (id) do update set status=excluded.status`,
        [b.id, b.requester_id, b.employee_id, b.project_id, b.date, b.start_time, b.end_time, Number(b.duration_hours || 0), b.task_description, b.status, b.notes || null, b.created_at || new Date().toISOString(), b.updated_at || new Date().toISOString()]
      );
    }

    const leave = await readJson('leave_requests');
    for (const l of leave) {
      await client.query(
        `insert into leave_requests (id, employee_id, type, start_date, end_date, days_count, reason, status, approved_by, approved_at, notes, created_at, updated_at, worked)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         on conflict (id) do update set status=excluded.status`,
        [l.id, l.employee_id, l.type, l.start_date, l.end_date, Number(l.days_count || 0), l.reason || '', l.status, l.approved_by || null, l.approved_at || null, l.notes || null, l.created_at || new Date().toISOString(), l.updated_at || new Date().toISOString(), l.worked ?? null]
      );
    }

    await client.query('set session_replication_role = default');
    await client.query('commit');
    console.log('Import completed successfully');
  } catch (e) {
    await client.query('rollback');
    console.error('Import failed', e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();


