-- Basic schema compatible with existing Supabase tables used in frontend
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin','employee')),
  position text,
  has_account boolean not null default false,
  password text,
  birthday date,
  employment_date date,
  termination_date date,
  department text,
  timezone text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  color text not null default '#3B82F6',
  status text not null default 'active' check (status in ('active','completed','on-hold')),
  team_members text[] default '{}',
  team_lead_id uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category_id uuid,
  name text not null,
  description text default '',
  planned_hours numeric(6,2) not null default 0,
  actual_hours numeric(6,2) not null default 0,
  hourly_rate numeric(8,2) not null default 3500,
  total_cost numeric(10,2) generated always as (planned_hours * hourly_rate) stored,
  status text not null default 'new',
  created_by uuid not null references users(id),
  deadline date,
  deadline_type text check (deadline_type in ('soft','hard')),
  deadline_reason text,
  is_assigned_by_admin boolean default false,
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  completed_at timestamptz,
  deadline_change_log jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  employee_id uuid not null references users(id) on delete cascade,
  allocated_hours numeric(6,2) not null default 0,
  actual_hours numeric(6,2) not null default 0,
  deadline date,
  deadline_type text check (deadline_type in ('soft','hard')),
  deadline_reason text,
  priority text check (priority in ('low','medium','high','urgent')),
  created_at timestamptz default now(),
  completed_at timestamptz,
  unique(task_id, employee_id)
);

-- Task categories
create table if not exists task_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  default_hours numeric(10,2) default 8,
  default_hourly_rate numeric(10,2) default 3500,
  color text default '#3B82F6',
  is_active boolean default true,
  created_by uuid references users(id),
  created_at timestamptz default now()
);

create table if not exists time_slots (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  task_id uuid,
  date date not null,
  start_time time not null,
  end_time time not null,
  start_at_utc timestamptz,
  end_at_utc timestamptz,
  task text not null,
  planned_hours numeric(4,2) not null default 0,
  actual_hours numeric(4,2) not null default 0,
  status text not null default 'planned' check (status in ('planned','in-progress','completed')),
  category text not null default 'Development',
  parent_task_id uuid,
  task_sequence int,
  total_task_hours numeric(6,2),
  is_paused boolean default false,
  paused_at timestamptz,
  resumed_at timestamptz,
  completed_at timestamptz,
  is_recurring boolean default false,
  recurrence_type text check (recurrence_type in ('daily','weekly','monthly')),
  recurrence_interval int,
  recurrence_end_date date,
  recurrence_days text[],
  parent_recurring_id uuid,
  recurrence_count int,
  deadline date,
  deadline_type text check (deadline_type in ('soft','hard')),
  is_assigned_by_admin boolean,
  deadline_reason text,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references users(id) on delete cascade,
  employee_id uuid not null references users(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  duration_hours numeric(4,2) not null,
  task_description text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed','cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Leave requests
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references users(id),
  type text not null check (type in ('vacation','sick_leave','personal_leave','compensatory_leave')),
  start_date date not null,
  end_date date not null,
  days_count int not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  approved_by uuid references users(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  worked boolean
);

create index if not exists idx_time_slots_date on time_slots(date);
create index if not exists idx_time_slots_employee on time_slots(employee_id);
create index if not exists idx_bookings_employee_date on bookings(employee_id, date);


