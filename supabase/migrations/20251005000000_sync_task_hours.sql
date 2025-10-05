-- Функция для обновления actual_hours в tasks на основе time_slots
create or replace function sync_task_actual_hours()
returns trigger as $$
begin
  -- Обновляем actual_hours в задаче, если time_slot связан с задачей
  if (TG_OP = 'DELETE') then
    if old.task_id is not null then
      update tasks
      set 
        actual_hours = coalesce((
          select sum(actual_hours)
          from time_slots
          where task_id = old.task_id
        ), 0),
        updated_at = now()
      where id = old.task_id;
    end if;
    return old;
  else
    if new.task_id is not null then
      update tasks
      set 
        actual_hours = coalesce((
          select sum(actual_hours)
          from time_slots
          where task_id = new.task_id
        ), 0),
        updated_at = now()
      where id = new.task_id;
    end if;
    return new;
  end if;
end;
$$ language plpgsql;

-- Триггер на INSERT time_slots
drop trigger if exists sync_task_hours_on_insert on time_slots;
create trigger sync_task_hours_on_insert
  after insert on time_slots
  for each row
  execute function sync_task_actual_hours();

-- Триггер на UPDATE time_slots
drop trigger if exists sync_task_hours_on_update on time_slots;
create trigger sync_task_hours_on_update
  after update on time_slots
  for each row
  when (
    old.task_id is distinct from new.task_id or
    old.actual_hours is distinct from new.actual_hours
  )
  execute function sync_task_actual_hours();

-- Триггер на DELETE time_slots
drop trigger if exists sync_task_hours_on_delete on time_slots;
create trigger sync_task_hours_on_delete
  after delete on time_slots
  for each row
  execute function sync_task_actual_hours();

-- Одноразово пересчитаем actual_hours для всех существующих задач
update tasks t
set 
  actual_hours = coalesce((
    select sum(ts.actual_hours)
    from time_slots ts
    where ts.task_id = t.id
  ), 0),
  updated_at = now()
where exists (
  select 1 from time_slots where task_id = t.id
);

-- Также добавим индекс для ускорения запросов
create index if not exists idx_time_slots_task_id on time_slots(task_id) where task_id is not null;

