-- ProTime Database Schema
-- PostgreSQL Database Schema for ProTime Project Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  position TEXT,
  has_account BOOLEAN DEFAULT false,
  password TEXT,
  birthday DATE,
  employment_date DATE,
  termination_date DATE,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'on-hold')) DEFAULT 'active',
  team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_members UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_team_lead ON projects(team_lead_id);

-- Tasks table (MOVED BEFORE time_slots to fix dependency)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  planned_hours NUMERIC(10,2) DEFAULT 0,
  actual_hours NUMERIC(10,2) DEFAULT 0,
  hourly_rate NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('new', 'planned', 'in-progress', 'code-review', 'testing-internal', 'testing-client', 'closed')) DEFAULT 'new',
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);

-- Time slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  start_at_utc TIMESTAMPTZ,
  end_at_utc TIMESTAMPTZ,
  task TEXT NOT NULL,
  description TEXT,
  planned_hours NUMERIC(10,2) DEFAULT 0,
  actual_hours NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('planned', 'in-progress', 'completed')) DEFAULT 'planned',
  category TEXT DEFAULT 'general',
  completed_at TIMESTAMPTZ,
  parent_task_id UUID,
  task_sequence INTEGER,
  total_task_hours NUMERIC(10,2),
  is_paused BOOLEAN DEFAULT false,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  recurrence_interval INTEGER,
  recurrence_end_date DATE,
  recurrence_days TEXT[],
  parent_recurring_id UUID,
  recurrence_count INTEGER,
  deadline TIMESTAMPTZ,
  deadline_type TEXT CHECK (deadline_type IN ('soft', 'hard')),
  is_assigned_by_admin BOOLEAN DEFAULT false,
  deadline_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_time_slots_employee ON time_slots(employee_id);
CREATE INDEX idx_time_slots_project ON time_slots(project_id);
CREATE INDEX idx_time_slots_date ON time_slots(date);
CREATE INDEX idx_time_slots_status ON time_slots(status);
CREATE INDEX idx_time_slots_task_id ON time_slots(task_id);

-- Task assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocated_hours NUMERIC(10,2) DEFAULT 0,
  actual_hours NUMERIC(10,2) DEFAULT 0,
  deadline TIMESTAMPTZ,
  deadline_type TEXT CHECK (deadline_type IN ('soft', 'hard')),
  deadline_reason TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX idx_task_assignments_employee ON task_assignments(employee_id);

-- Task categories table
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  default_hours NUMERIC(10,2) DEFAULT 8,
  default_hourly_rate NUMERIC(10,2) DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_categories_active ON task_categories(is_active);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'sick_leave', 'personal_leave', 'compensatory_leave')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours NUMERIC(10,2) DEFAULT 0,
  task_description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_employee ON bookings(employee_id);
CREATE INDEX idx_bookings_requester ON bookings(requester_id);
CREATE INDEX idx_bookings_project ON bookings(project_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Deadline log table
CREATE TABLE IF NOT EXISTS deadline_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'time_slot', 'task_assignment')),
  entity_id UUID NOT NULL,
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('soft', 'hard')),
  previous_deadline TIMESTAMPTZ,
  new_deadline TIMESTAMPTZ NOT NULL,
  reason TEXT,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deadline_log_entity ON deadline_log(entity_type, entity_id);
CREATE INDEX idx_deadline_log_changed_by ON deadline_log(changed_by);
CREATE INDEX idx_deadline_log_created_at ON deadline_log(created_at);

-- Insert demo users with hashed passwords (bcrypt hash of 'password')
-- Note: In production, passwords should be properly hashed on the backend
-- Password for all demo users: 'password'
INSERT INTO users (name, email, role, has_account, password, employment_date, timezone) VALUES
  ('Admin Sistema', 'admin@company.com', 'admin', true, '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '2024-01-15', 'Europe/Moscow'),
  ('Ivan Petrov', 'ivan@company.com', 'employee', true, '$2a$10$e0MYzXyjpJS7Pd0RVvHwHe.Dgw9UWLPgKHJI0R9TfZnCNWcbQk7fO', '2024-03-01', 'Europe/Samara'),
  ('Maria Sidorova', 'maria@company.com', 'employee', true, '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2024-06-01', 'Asia/Yekaterinburg')
ON CONFLICT (email) DO NOTHING;

-- Insert demo projects
INSERT INTO projects (name, description, color, status, team_members) VALUES
  ('Web Application CRM', 'Customer management system development', '#3B82F6', 'active', '{}'),
  ('Mobile Application', 'iOS and Android app for clients', '#10B981', 'active', '{}'),
  ('Analytics System', 'Internal data analysis system', '#F59E0B', 'on-hold', '{}')
ON CONFLICT DO NOTHING;
