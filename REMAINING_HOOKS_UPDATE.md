# Обновление оставшихся хуков

Эти хуки нужно обновить для работы с новым API. Ниже приведены шаблоны замен.

## useTimeSlots.ts

### Заменить импорт:
```typescript
// Было:
import { supabase, hasSupabaseCredentials } from '../lib/supabase';

// Стало:
import { timeSlotsAPI } from '../lib/api';
```

### Заменить методы:

```typescript
// Было:
const { data, error } = await supabase
  .from('time_slots')
  .select('*')
  .order('date', { ascending: false });

// Стало:
const slots = await timeSlotsAPI.getAll();
```

```typescript
// Было:
const { data, error } = await supabase
  .from('time_slots')
  .insert([slotData])
  .select()
  .single();

// Стало:
const newSlot = await timeSlotsAPI.create(slotData);
```

```typescript
// Было:
const { error } = await supabase
  .from('time_slots')
  .update(updates)
  .eq('id', id);

// Стало:
await timeSlotsAPI.update(id, updates);
```

```typescript
// Было:
const { error } = await supabase
  .from('time_slots')
  .delete()
  .eq('id', id);

// Стало:
await timeSlotsAPI.delete(id);
```

## useTasks.ts

### Заменить импорт:
```typescript
import { tasksAPI } from '../lib/api';
```

### Методы API:
- `tasksAPI.getAll(params?)` - получить все задачи
- `tasksAPI.getById(id)` - получить задачу по ID
- `tasksAPI.create(taskData)` - создать задачу
- `tasksAPI.update(id, updates)` - обновить задачу
- `tasksAPI.delete(id)` - удалить задачу
- `tasksAPI.getAssignments(taskId)` - получить назначения задачи
- `tasksAPI.createAssignment(taskId, data)` - создать назначение
- `tasksAPI.updateAssignment(assignmentId, updates)` - обновить назначение
- `tasksAPI.deleteAssignment(assignmentId)` - удалить назначение

## useTaskCategories.ts

### Заменить импорт:
```typescript
import { taskCategoriesAPI } from '../lib/api';
```

### Методы API:
- `taskCategoriesAPI.getAll(isActive?)` - получить все категории
- `taskCategoriesAPI.getById(id)` - получить категорию по ID
- `taskCategoriesAPI.create(categoryData)` - создать категорию
- `taskCategoriesAPI.update(id, updates)` - обновить категорию
- `taskCategoriesAPI.delete(id)` - удалить категорию

## useLeaveRequests.ts

### Заменить импорт:
```typescript
import { leaveRequestsAPI } from '../lib/api';
```

### Методы API:
- `leaveRequestsAPI.getAll(params?)` - получить все заявки
- `leaveRequestsAPI.getById(id)` - получить заявку по ID
- `leaveRequestsAPI.create(requestData)` - создать заявку
- `leaveRequestsAPI.update(id, updates)` - обновить заявку
- `leaveRequestsAPI.delete(id)` - удалить заявку
- `leaveRequestsAPI.approve(id)` - одобрить заявку (admin)
- `leaveRequestsAPI.reject(id, notes?)` - отклонить заявку (admin)

## useBookings.ts

### Заменить импорт:
```typescript
import { bookingsAPI } from '../lib/api';
```

### Методы API:
- `bookingsAPI.getAll(params?)` - получить все бронирования
- `bookingsAPI.getById(id)` - получить бронирование по ID
- `bookingsAPI.create(bookingData)` - создать бронирование
- `bookingsAPI.update(id, updates)` - обновить бронирование
- `bookingsAPI.delete(id)` - удалить бронирование

## useDailyStandups.ts

Этот хук, вероятно, использует time_slots или другие данные.  
Проверьте его код и обновите соответствующие вызовы API.

## Общий паттерн обновления

1. **Удалите проверки Supabase**:
   ```typescript
   // Удалите:
   if (!supabase) return;
   if (hasSupabaseCredentials && supabase) { ... }
   ```

2. **Оберните вызовы API в try-catch**:
   ```typescript
   try {
     const result = await someAPI.method();
     // обработка результата
   } catch (error) {
     console.error('Error:', error);
     // fallback на демо данные или throw error
   }
   ```

3. **Убе рите маппинг данных**:
   ```typescript
   // Было (Supabase возвращал snake_case):
   const formatted = data.map(item => ({
     employeeId: item.employee_id,
     projectId: item.project_id,
     // ...
   }));

   // Стало (API уже возвращает camelCase):
   const result = await api.getAll(); // уже в нужном формате
   ```

4. **Обработка ошибок**:
   ```typescript
   // Было (Supabase):
   const { data, error } = await supabase.from('table').select();
   if (error) throw error;

   // Стало (API):
   try {
     const data = await api.getAll();
   } catch (error) {
     // error - это Error объект с сообщением
     console.error('Error:', error.message);
   }
   ```

## Проверка после обновления

После обновления каждого хука:

1. Проверьте, что нет импортов из `../lib/supabase`
2. Проверьте, что нет вызовов `supabase.from()`
3. Запустите приложение и протестируйте функционал
4. Проверьте консоль браузера на ошибки
5. Проверьте Network tab в DevTools для проверки API запросов

## Пример полного обновления (useTimeSlots.ts)

```typescript
import { useState, useEffect } from 'react';
import { TimeSlot } from '../types';
import { timeSlotsAPI } from '../lib/api';

export const useTimeSlots = () => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTimeSlots = async (params?: {
    employeeId?: string;
    projectId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    setIsLoading(true);
    try {
      const slots = await timeSlotsAPI.getAll(params);
      setTimeSlots(slots);
    } catch (error) {
      console.error('Error loading time slots:', error);
      // Можно загрузить демо данные или показать ошибку
    } finally {
      setIsLoading(false);
    }
  };

  const createTimeSlot = async (slotData: Omit<TimeSlot, 'id' | 'createdAt'>) => {
    try {
      const newSlot = await timeSlotsAPI.create(slotData);
      await loadTimeSlots(); // Перезагружаем данные
      return newSlot;
    } catch (error) {
      console.error('Error creating time slot:', error);
      throw error;
    }
  };

  const updateTimeSlot = async (id: string, updates: Partial<TimeSlot>) => {
    try {
      await timeSlotsAPI.update(id, updates);
      await loadTimeSlots(); // Перезагружаем данные
    } catch (error) {
      console.error('Error updating time slot:', error);
      throw error;
    }
  };

  const deleteTimeSlot = async (id: string) => {
    try {
      await timeSlotsAPI.delete(id);
      await loadTimeSlots(); // Перезагружаем данные
    } catch (error) {
      console.error('Error deleting time slot:', error);
      throw error;
    }
  };

  return {
    timeSlots,
    isLoading,
    loadTimeSlots,
    createTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
  };
};
```

## Тестирование

После обновления всех хуков:

1. Запустите бэкенд: `cd server && npm run dev`
2. Запустите фронтенд: `npm run dev`
3. Попробуйте:
   - Войти в систему (admin@company.com / password)
   - Создать проект
   - Добавить временной слот
   - Создать задачу
   - Отправить заявку на отпуск

Все должно работать через ваш собственный API!

