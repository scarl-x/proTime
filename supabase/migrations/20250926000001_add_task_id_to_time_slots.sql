-- Добавляем поле task_id в таблицу time_slots для связи с задачами
ALTER TABLE time_slots 
ADD COLUMN task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;

-- Создаем индекс для быстрого поиска по task_id
CREATE INDEX IF NOT EXISTS idx_time_slots_task_id ON time_slots(task_id);

-- Добавляем комментарий к полю
COMMENT ON COLUMN time_slots.task_id IS 'ID задачи из системы задач';
