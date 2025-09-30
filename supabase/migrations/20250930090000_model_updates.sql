-- Миграция: обновление модели дедлайнов и метаданных
-- Дата: 2025-09-30

-- time_slots: фиксация фактического завершения
alter table if exists public.time_slots
  add column if not exists completed_at timestamp with time zone;

-- tasks: дедлайны на уровне задачи, факт завершения и лог изменений
alter table if exists public.tasks
  add column if not exists deadline date,
  add column if not exists deadline_type text check (deadline_type in ('soft','hard')),
  add column if not exists deadline_reason text,
  add column if not exists completed_at timestamp with time zone,
  add column if not exists deadline_change_log jsonb;

-- task_assignments: фиксация фактического завершения назначения (если таблица используется)
alter table if exists public.task_assignments
  add column if not exists completed_at timestamp with time zone;

-- users: отдел/команда для отчетов по отделам
alter table if exists public.users
  add column if not exists department text;


