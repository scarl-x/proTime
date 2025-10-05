-- Функция для обновления actual_hours в task_assignments на основе time_slots
create or replace function sync_assignment_actual_hours()
returns trigger as $$
begin
  -- Обновляем actual_hours в назначениях задач
  if (TG_OP = 'DELETE') then
    if old.task_id is not null then
      -- Обновляем для каждого назначения этой задачи
      update task_assignments ta
      set 
        actual_hours = coalesce((
          select sum(ts.actual_hours)
          from time_slots ts
          where ts.task_id = ta.task_id
            and ts.employee_id = ta.employee_id
        ), 0)
      where ta.task_id = old.task_id
        and ta.employee_id = old.employee_id;
    end if;
    return old;
  else
    if new.task_id is not null then
      -- Обновляем для соответствующего назначения
      update task_assignments ta
      set 
        actual_hours = coalesce((
          select sum(ts.actual_hours)
          from time_slots ts
          where ts.task_id = ta.task_id
            and ts.employee_id = ta.employee_id
        ), 0)
      where ta.task_id = new.task_id
        and ta.employee_id = new.employee_id;
    end if;
    return new;
  end if;
end;
$$ language plpgsql;

-- Триггер на INSERT time_slots для task_assignments
drop trigger if exists sync_assignment_hours_on_insert on time_slots;
create trigger sync_assignment_hours_on_insert
  after insert on time_slots
  for each row
  when (new.task_id is not null)
  execute function sync_assignment_actual_hours();

-- Триггер на UPDATE time_slots для task_assignments
drop trigger if exists sync_assignment_hours_on_update on time_slots;
create trigger sync_assignment_hours_on_update
  after update on time_slots
  for each row
  when (
    new.task_id is not null and (
      old.task_id is distinct from new.task_id or
      old.employee_id is distinct from new.employee_id or
      old.actual_hours is distinct from new.actual_hours
    )
  )
  execute function sync_assignment_actual_hours();

-- Триггер на DELETE time_slots для task_assignments
drop trigger if exists sync_assignment_hours_on_delete on time_slots;
create trigger sync_assignment_hours_on_delete
  after delete on time_slots
  for each row
  when (old.task_id is not null)
  execute function sync_assignment_actual_hours();

-- Одноразово пересчитаем actual_hours для всех существующих назначений
update task_assignments ta
set actual_hours = coalesce((
  select sum(ts.actual_hours)
  from time_slots ts
  where ts.task_id = ta.task_id
    and ts.employee_id = ta.employee_id
), 0)
where exists (
  select 1 
  from time_slots ts
  where ts.task_id = ta.task_id
    and ts.employee_id = ta.employee_id
);

-- Добавим составной индекс для ускорения запросов
create index if not exists idx_time_slots_task_employee 
  on time_slots(task_id, employee_id) 
  where task_id is not null;

