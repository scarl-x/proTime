/*
  # Update task statuses with new workflow

  1. Changes
    - Update task status enum to include new workflow statuses
    - Add index for status filtering

  2. New Statuses
    - new: Новая задача
    - planned: Запланировано
    - in-progress: В работе
    - code-review: Код ревью
    - testing-internal: Тестирование Проявление
    - testing-client: Тестирование ФЗ
    - closed: Закрыто

  3. Migration
    - Update existing tasks to use new status values
    - Add constraint for new status values
*/

-- Drop existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Add new constraint with expanded statuses
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('new', 'planned', 'in-progress', 'code-review', 'testing-internal', 'testing-client', 'closed'));

-- Update existing tasks to map old statuses to new ones
UPDATE tasks SET status = 'new' WHERE status = 'planning';
UPDATE tasks SET status = 'closed' WHERE status = 'completed';
UPDATE tasks SET status = 'planned' WHERE status = 'on-hold';

-- Add index for status filtering
CREATE INDEX IF NOT EXISTS idx_tasks_status_filtering ON tasks(status, project_id);

-- Add comments
COMMENT ON COLUMN tasks.status IS 'Статус задачи: new, planned, in-progress, code-review, testing-internal, testing-client, closed';