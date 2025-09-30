-- Логирование изменений дедлайна задач в tasks.deadline_change_log
-- Создает функцию и триггер, которые при изменении полей дедлайна
-- добавляют запись в JSONB-массив deadline_change_log

create or replace function public.log_task_deadline_change()
returns trigger
language plpgsql
as $$
begin
  -- проверяем, изменились ли поля дедлайна
  if (coalesce(OLD.deadline, '1970-01-01'::date) is distinct from coalesce(NEW.deadline, '1970-01-01'::date))
     or (coalesce(OLD.deadline_type, '') is distinct from coalesce(NEW.deadline_type, ''))
     or (coalesce(OLD.deadline_reason, '') is distinct from coalesce(NEW.deadline_reason, '')) then

    NEW.deadline_change_log := coalesce(NEW.deadline_change_log, '[]'::jsonb) || jsonb_build_object(
      'changedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'oldDeadline', to_char(OLD.deadline, 'YYYY-MM-DD'),
      'newDeadline', to_char(NEW.deadline, 'YYYY-MM-DD'),
      'oldType', OLD.deadline_type,
      'newType', NEW.deadline_type,
      'oldReason', OLD.deadline_reason,
      'newReason', NEW.deadline_reason,
      'changedByUserId', current_setting('request.jwt.claim.sub', true)
    );
  end if;

  return NEW;
end;
$$;

drop trigger if exists tr_tasks_deadline_change on public.tasks;
create trigger tr_tasks_deadline_change
before update of deadline, deadline_type, deadline_reason on public.tasks
for each row
execute function public.log_task_deadline_change();


