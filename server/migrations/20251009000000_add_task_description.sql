-- Миграция: Добавление поля description для задач в календаре
-- Дата: 2025-10-09

-- Добавляем поле description в таблицу time_slots
ALTER TABLE time_slots ADD COLUMN IF NOT EXISTS description TEXT;

-- Комментарий к полю
COMMENT ON COLUMN time_slots.description IS 'Описание задачи с поддержкой Markdown форматирования';


