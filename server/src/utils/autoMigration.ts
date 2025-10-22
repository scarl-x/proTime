// Автоматическая миграция данных при первом запуске сервера
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация базы данных
const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'protime',
  password: process.env.DATABASE_PASSWORD || 'password',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
});

// Функция для чтения CSV файла
function readCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    const parser = fs
      .createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
      }));

    parser.on('data', (record) => {
      records.push(record);
    });

    parser.on('end', () => {
      resolve(records);
    });

    parser.on('error', (error) => {
      reject(error);
    });
  });
}

// Функция для очистки строки от кавычек
function cleanString(str: string): string {
  if (typeof str !== 'string') return str;
  return str.replace(/^"(.*)"$/, '$1').trim();
}

// Функция для валидации UUID
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Функция для обработки UUID массивов
function parseUUIDArray(str: string): string[] {
  if (!str || str === 'null' || str === '') return [];
  try {
    let cleaned = str.replace(/^"(.*)"$/, '$1');
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      return JSON.parse(cleaned);
    }
    return cleaned.split(',').map(item => item.trim().replace(/"/g, ''));
  } catch (e) {
    return [];
  }
}

// Функция для обработки массивов дней недели
function parseWorkDays(str: string): string[] {
  if (!str || str === 'null' || str === '') return [];
  try {
    const parsed = JSON.parse(str.replace(/'/g, '"'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Проверка, была ли уже выполнена миграция
async function checkMigrationStatus(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE email = 'admin@company.com' AND password LIKE '$2a$%'
    `);
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    return false;
  }
}

// Проверка режима работы
function isProductionMode(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Проверка принудительного запуска миграции
function shouldForceMigration(): boolean {
  return process.env.FORCE_MIGRATION === 'true';
}

// Основная функция миграции
async function migrateData(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Начинаем автоматическую миграцию данных...');
    
    // 1. Миграция пользователей
    console.log('📝 Мигрируем пользователей...');
    const users = await readCSV(path.join(__dirname, '../../../old_db/users_rows.csv'));
    
    for (const user of users) {
      try {
        if (!isValidUUID(user.id)) continue;
        
        await client.query(
          `INSERT INTO users (id, name, email, role, position, has_account, password, birthday, employment_date, termination_date, timezone, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             email = EXCLUDED.email,
             role = EXCLUDED.role,
             position = EXCLUDED.position,
             has_account = EXCLUDED.has_account,
             password = EXCLUDED.password,
             birthday = EXCLUDED.birthday,
             employment_date = EXCLUDED.employment_date,
             termination_date = EXCLUDED.termination_date,
             timezone = EXCLUDED.timezone,
             created_at = EXCLUDED.created_at;`,
          [
            user.id,
            cleanString(user.name),
            cleanString(user.email),
            cleanString(user.role),
            cleanString(user.position) || null,
            user.has_account === 'true',
            user.password || null,
            user.birthday || null,
            user.employment_date || null,
            user.termination_date || null,
            user.timezone || null,
            user.created_at,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции пользователя ${user.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${users.length} пользователей`);
    
    // 2. Миграция проектов
    console.log('📝 Мигрируем проекты...');
    const projects = await readCSV(path.join(__dirname, '../../../old_db/projects_rows.csv'));
    
    for (const project of projects) {
      try {
        if (!isValidUUID(project.id)) continue;
        
        let teamMembers: string[] = [];
        if (project.team_members) {
          teamMembers = parseUUIDArray(project.team_members);
        }
        
        await client.query(
          `INSERT INTO projects (id, name, description, color, status, team_lead_id, team_members, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             color = EXCLUDED.color,
             status = EXCLUDED.status,
             team_lead_id = EXCLUDED.team_lead_id,
             team_members = EXCLUDED.team_members,
             created_at = EXCLUDED.created_at;`,
          [
            project.id,
            cleanString(project.name),
            cleanString(project.description) || '',
            project.color || '#3B82F6',
            cleanString(project.status) || 'active',
            project.team_lead_id || null,
            teamMembers,
            project.created_at,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции проекта ${project.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${projects.length} проектов`);
    
    // 3. Миграция категорий задач
    console.log('📝 Мигрируем категории задач...');
    const taskCategories = await readCSV(path.join(__dirname, '../../../old_db/task_categories_rows.csv'));
    
    for (const category of taskCategories) {
      try {
        if (!isValidUUID(category.id)) continue;
        
        await client.query(
          `INSERT INTO task_categories (id, name, description, default_hours, default_hourly_rate, color, is_active, created_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             default_hours = EXCLUDED.default_hours,
             default_hourly_rate = EXCLUDED.default_hourly_rate,
             color = EXCLUDED.color,
             is_active = EXCLUDED.is_active,
             created_by = EXCLUDED.created_by,
             created_at = EXCLUDED.created_at;`,
          [
            category.id,
            cleanString(category.name),
            cleanString(category.description) || '',
            parseFloat(category.default_hours) || 8,
            parseFloat(category.default_hourly_rate) || 0,
            category.color || '#3B82F6',
            category.is_active === 'true',
            category.created_by,
            category.created_at,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции категории ${category.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${taskCategories.length} категорий задач`);
    
    // 4. Миграция задач
    console.log('📝 Мигрируем задачи...');
    const tasks = await readCSV(path.join(__dirname, '../../../old_db/tasks_rows.csv'));
    
    // Получаем первого пользователя для случаев, когда created_by = null
    const firstUser = await client.query('SELECT id FROM users LIMIT 1');
    const defaultCreatedBy = firstUser.rows[0]?.id;
    
    for (const task of tasks) {
      try {
        if (!isValidUUID(task.id)) continue;
        if (!isValidUUID(task.project_id)) continue;
        
        const createdBy = task.created_by && isValidUUID(task.created_by) ? task.created_by : defaultCreatedBy;
        
        await client.query(
          `INSERT INTO tasks (id, project_id, name, description, planned_hours, actual_hours, hourly_rate, status, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             project_id = EXCLUDED.project_id,
             name = EXCLUDED.name,
             description = EXCLUDED.description,
             planned_hours = EXCLUDED.planned_hours,
             actual_hours = EXCLUDED.actual_hours,
             hourly_rate = EXCLUDED.hourly_rate,
             status = EXCLUDED.status,
             created_by = EXCLUDED.created_by,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at;`,
          [
            task.id,
            task.project_id,
            cleanString(task.name),
            cleanString(task.description) || '',
            parseFloat(task.planned_hours) || 0,
            parseFloat(task.actual_hours) || 0,
            parseFloat(task.hourly_rate) || 0,
            cleanString(task.status) || 'new',
            createdBy,
            task.created_at,
            task.updated_at,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции задачи ${task.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${tasks.length} задач`);
    
    // 5. Миграция временных слотов
    console.log('📝 Мигрируем временные слоты...');
    const timeSlots = await readCSV(path.join(__dirname, '../../../old_db/time_slots_rows.csv'));
    
    for (const slot of timeSlots) {
      try {
        if (!isValidUUID(slot.id)) continue;
        if (!isValidUUID(slot.employee_id)) continue;
        if (!isValidUUID(slot.project_id)) continue;
        
        await client.query(
          `INSERT INTO time_slots (
            id, employee_id, project_id, task_id, assignment_id, date, start_time, end_time,
            start_at_utc, end_at_utc, task, description, planned_hours, actual_hours,
            status, category, completed_at, parent_task_id, task_sequence, total_task_hours,
            is_paused, paused_at, resumed_at, is_recurring, recurrence_type, recurrence_interval,
            recurrence_end_date, recurrence_days, parent_recurring_id, recurrence_count,
            deadline, deadline_type, is_assigned_by_admin, deadline_reason, created_at
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
          )
          ON CONFLICT (id) DO UPDATE SET
            employee_id = EXCLUDED.employee_id,
            project_id = EXCLUDED.project_id,
            task_id = EXCLUDED.task_id,
            assignment_id = EXCLUDED.assignment_id,
            date = EXCLUDED.date,
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            start_at_utc = EXCLUDED.start_at_utc,
            end_at_utc = EXCLUDED.end_at_utc,
            task = EXCLUDED.task,
            description = EXCLUDED.description,
            planned_hours = EXCLUDED.planned_hours,
            actual_hours = EXCLUDED.actual_hours,
            status = EXCLUDED.status,
            category = EXCLUDED.category,
            completed_at = EXCLUDED.completed_at,
            parent_task_id = EXCLUDED.parent_task_id,
            task_sequence = EXCLUDED.task_sequence,
            total_task_hours = EXCLUDED.total_task_hours,
            is_paused = EXCLUDED.is_paused,
            paused_at = EXCLUDED.paused_at,
            resumed_at = EXCLUDED.resumed_at,
            is_recurring = EXCLUDED.is_recurring,
            recurrence_type = EXCLUDED.recurrence_type,
            recurrence_interval = EXCLUDED.recurrence_interval,
            recurrence_end_date = EXCLUDED.recurrence_end_date,
            recurrence_days = EXCLUDED.recurrence_days,
            parent_recurring_id = EXCLUDED.parent_recurring_id,
            recurrence_count = EXCLUDED.recurrence_count,
            deadline = EXCLUDED.deadline,
            deadline_type = EXCLUDED.deadline_type,
            is_assigned_by_admin = EXCLUDED.is_assigned_by_admin,
            deadline_reason = EXCLUDED.deadline_reason,
            created_at = EXCLUDED.created_at;`,
          [
            slot.id,
            slot.employee_id,
            slot.project_id,
            slot.task_id || null,
            slot.assignment_id || null,
            slot.date,
            slot.start_time,
            slot.end_time,
            slot.start_at_utc,
            slot.end_at_utc,
            cleanString(slot.task),
            cleanString(slot.description) || null,
            parseFloat(slot.planned_hours) || 0,
            parseFloat(slot.actual_hours) || 0,
            cleanString(slot.status) || 'planned',
            cleanString(slot.category) || 'general',
            slot.completed_at || null,
            slot.parent_task_id || null,
            slot.task_sequence || null,
            slot.total_task_hours || null,
            slot.is_paused || false,
            slot.paused_at || null,
            slot.resumed_at || null,
            slot.is_recurring || false,
            cleanString(slot.recurrence_type) || null,
            slot.recurrence_interval || null,
            slot.recurrence_end_date || null,
            parseWorkDays(slot.recurrence_days),
            slot.parent_recurring_id || null,
            slot.recurrence_count || null,
            slot.deadline || null,
            cleanString(slot.deadline_type) || null,
            slot.is_assigned_by_admin || false,
            cleanString(slot.deadline_reason) || null,
            slot.created_at
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции временного слота ${slot.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${timeSlots.length} временных слотов`);
    
    // 6. Миграция назначений задач
    console.log('📝 Мигрируем назначения задач...');
    const taskAssignments = await readCSV(path.join(__dirname, '../../../old_db/task_assignments_rows.csv'));
    
    for (const assignment of taskAssignments) {
      try {
        if (!isValidUUID(assignment.id)) continue;
        if (!isValidUUID(assignment.task_id)) continue;
        if (!isValidUUID(assignment.employee_id)) continue;
        
        await client.query(
          `INSERT INTO task_assignments (id, task_id, employee_id, allocated_hours, actual_hours, created_at, deadline, deadline_type, deadline_reason, priority, completed_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET
             task_id = EXCLUDED.task_id,
             employee_id = EXCLUDED.employee_id,
             allocated_hours = EXCLUDED.allocated_hours,
             actual_hours = EXCLUDED.actual_hours,
             created_at = EXCLUDED.created_at,
             deadline = EXCLUDED.deadline,
             deadline_type = EXCLUDED.deadline_type,
             deadline_reason = EXCLUDED.deadline_reason,
             priority = EXCLUDED.priority,
             completed_at = EXCLUDED.completed_at;`,
          [
            assignment.id,
            assignment.task_id,
            assignment.employee_id,
            parseFloat(assignment.allocated_hours) || 0,
            parseFloat(assignment.actual_hours) || 0,
            assignment.created_at,
            assignment.deadline || null,
            assignment.deadline_type || null,
            assignment.deadline_reason || null,
            assignment.priority || 'medium',
            assignment.completed_at || null,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции назначения ${assignment.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${taskAssignments.length} назначений задач`);
    
    // 7. Миграция заявок на отпуск
    console.log('📝 Мигрируем заявки на отпуск...');
    const leaveRequests = await readCSV(path.join(__dirname, '../../../old_db/leave_requests_rows.csv'));
    
    for (const request of leaveRequests) {
      try {
        if (!isValidUUID(request.id)) continue;
        if (!isValidUUID(request.employee_id)) continue;
        
        await client.query(
          `INSERT INTO leave_requests (id, employee_id, type, start_date, end_date, days_count, reason, status, approved_by, approved_at, notes, created_at, updated_at, worked)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET
             employee_id = EXCLUDED.employee_id,
             type = EXCLUDED.type,
             start_date = EXCLUDED.start_date,
             end_date = EXCLUDED.end_date,
             days_count = EXCLUDED.days_count,
             reason = EXCLUDED.reason,
             status = EXCLUDED.status,
             approved_by = EXCLUDED.approved_by,
             approved_at = EXCLUDED.approved_at,
             notes = EXCLUDED.notes,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at,
             worked = EXCLUDED.worked;`,
          [
            request.id,
            request.employee_id,
            cleanString(request.type),
            request.start_date,
            request.end_date,
            parseFloat(request.days_count),
            cleanString(request.reason),
            cleanString(request.status) || 'pending',
            request.approved_by || null,
            request.approved_at || null,
            cleanString(request.notes) || null,
            request.created_at,
            request.updated_at,
            request.worked === 'true',
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции заявки ${request.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${leaveRequests.length} заявок на отпуск`);
    
    // 8. Миграция бронирований
    console.log('📝 Мигрируем бронирования...');
    const bookings = await readCSV(path.join(__dirname, '../../../old_db/bookings_rows.csv'));
    
    for (const booking of bookings) {
      try {
        if (!isValidUUID(booking.id)) continue;
        if (!isValidUUID(booking.requester_id)) continue;
        if (!isValidUUID(booking.employee_id)) continue;
        if (!isValidUUID(booking.project_id)) continue;
        
        await client.query(
          `INSERT INTO bookings (id, requester_id, employee_id, project_id, date, start_time, end_time, duration_hours, task_description, status, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             requester_id = EXCLUDED.requester_id,
             employee_id = EXCLUDED.employee_id,
             project_id = EXCLUDED.project_id,
             date = EXCLUDED.date,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             duration_hours = EXCLUDED.duration_hours,
             task_description = EXCLUDED.task_description,
             status = EXCLUDED.status,
             notes = EXCLUDED.notes,
             created_at = EXCLUDED.created_at,
             updated_at = EXCLUDED.updated_at;`,
          [
            booking.id,
            booking.requester_id,
            booking.employee_id,
            booking.project_id,
            booking.date,
            booking.start_time,
            booking.end_time,
            parseFloat(booking.duration_hours) || 0,
            cleanString(booking.task_description),
            cleanString(booking.status) || 'pending',
            cleanString(booking.notes) || null,
            booking.created_at,
            booking.updated_at,
          ]
        );
      } catch (error) {
        console.warn(`⚠️ Ошибка при миграции бронирования ${booking.id}:`, error instanceof Error ? error.message : String(error));
      }
    }
    
    console.log(`✅ Мигрировано ${bookings.length} бронирований`);
    
    console.log('🎉 Автоматическая миграция данных завершена успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка при автоматической миграции:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Главная функция автоматической миграции
export async function runAutoMigration(): Promise<void> {
  try {
    // Принудительный запуск миграции (переменная FORCE_MIGRATION=true)
    if (shouldForceMigration()) {
      console.log('🔧 Принудительный запуск миграции (FORCE_MIGRATION=true)...');
      await migrateData();
      return;
    }
    
    // В продакшене всегда запускаем миграцию
    if (isProductionMode()) {
      console.log('🏭 Режим продакшена: запускаем автоматическую миграцию...');
      await migrateData();
      return;
    }
    
    // В режиме разработки проверяем, была ли уже выполнена миграция
    const isMigrated = await checkMigrationStatus();
    
    if (isMigrated) {
      console.log('✅ Данные уже мигрированы, пропускаем автоматическую миграцию');
      return;
    }
    
    // Проверяем наличие папки old_db
    const oldDbPath = path.join(__dirname, '../../../old_db');
    if (!fs.existsSync(oldDbPath)) {
      console.log('📁 Папка old_db не найдена, пропускаем автоматическую миграцию');
      return;
    }
    
    console.log('🔄 Обнаружена папка old_db, запускаем автоматическую миграцию...');
    await migrateData();
    
  } catch (error) {
    console.error('❌ Ошибка при автоматической миграции:', error);
    // Не прерываем запуск сервера из-за ошибки миграции
  }
}
