-- Добавляем признак отработанного отгула
alter table if exists public.leave_requests
  add column if not exists worked boolean;


