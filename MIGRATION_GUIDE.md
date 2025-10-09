# Руководство по миграции с Supabase на собственный бэкенд

## Обзор

Проект ProTime был успешно переведён с Supabase на собственный бэкенд на Node.js + Express + PostgreSQL.

## Что было сделано

### Backend (сервер)

1. **Создана структура бэкенда**:
   ```
   server/
   ├── src/
   │   ├── config/         # Конфигурация БД и JWT
   │   ├── controllers/    # Контроллеры API
   │   ├── middleware/     # Middleware (auth, errors)
   │   ├── routes/         # Маршруты API
   │   ├── database/       # SQL схема
   │   └── index.ts        # Точка входа
   ├── package.json
   ├── tsconfig.json
   └── README.md
   ```

2. **Реализованы REST API endpoints**:
   - `/api/auth/*` - Аутентификация
   - `/api/users/*` - Управление пользователями
   - `/api/projects/*` - Управление проектами
   - `/api/time-slots/*` - Временные слоты
   - `/api/tasks/*` - Задачи и назначения
   - `/api/task-categories/*` - Категории задач
   - `/api/leave-requests/*` - Заявки на отпуск
   - `/api/bookings/*` - Бронирования

3. **Безопасность**:
   - JWT токены для аутентификации
   - bcrypt для хеширования паролей
   - Helmet для защиты заголовков
   - CORS настроен для фронтенда

### Frontend (клиент)

1. **Создан API клиент** (`src/lib/api.ts`):
   - Заменяет Supabase клиент
   - Управление токенами
   - Обработка ошибок

2. **Обновлены хуки**:
   - `useAuth` - полностью переработан
   - `useProjects` - использует новый API
   - Остальные хуки требуют обновления по аналогии

## Шаги для запуска

### 1. Установка и настройка базы данных

```bash
# Создайте базу данных PostgreSQL
createdb protime_db

# Примените схему
psql -U postgres -d protime_db -f server/src/database/schema.sql
```

### 2. Настройка бэкенда

```bash
cd server
npm install

# Создайте .env файл
cp .env.example .env

# Отредактируйте .env с вашими настройками
```

Пример `.env`:
```env
PORT=3001
NODE_ENV=development

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5173
```

### 3. Запуск бэкенда

```bash
# Development режим
npm run dev

# Production режим
npm run build
npm start
```

### 4. Настройка фронтенда

Добавьте в `.env` файл в корне проекта:

```env
VITE_API_URL=http://localhost:3001/api
```

### 5. Запуск фронтенда

```bash
npm run dev
```

## Что нужно доделать

### Критичные задачи

1. **Обновить оставшиеся хуки**:
   - `src/hooks/useTimeSlots.ts`
   - `src/hooks/useTasks.ts`
   - `src/hooks/useLeaveRequests.ts`
   - `src/hooks/useBookings.ts`
   - `src/hooks/useTaskCategories.ts`
   - `src/hooks/useDailyStandups.ts`

   Для каждого хука:
   - Заменить импорт `supabase` на соответствующий API (`timeSlotsAPI`, `tasksAPI`, и т.д.)
   - Заменить вызовы `supabase.from()` на вызовы API методов
   - Убрать проверки `hasSupabaseCredentials`

2. **Обновить пароли демо-пользователей**:
   В `server/src/database/schema.sql` замените хеши паролей на правильные bcrypt хеши:
   
   ```bash
   # Сгенерируйте хеш для пароля 'password'
   node -e "console.log(require('bcryptjs').hashSync('password', 10))"
   ```

3. **Тестирование**:
   - Проверьте вход в систему
   - Проверьте создание/редактирование проектов
   - Проверьте работу временных слотов
   - Проверьте права доступа (admin vs employee)

### Дополнительные улучшения

1. **Валидация**:
   - Добавить валидацию входных данных с express-validator
   - Добавить схемы валидации для всех endpoints

2. **Тестирование**:
   - Unit тесты для контроллеров
   - Integration тесты для API
   - E2E тесты для фронтенда

3. **Мониторинг и логирование**:
   - Winston для структурированного логирования
   - Prometheus метрики
   - Sentry для отслеживания ошибок

4. **Деплой**:
   - Docker контейнеризация
   - CI/CD pipeline
   - Nginx reverse proxy
   - SSL сертификаты

## Различия с Supabase

### Аутентификация

**Было** (Supabase):
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

**Стало** (собственный API):
```typescript
const response = await authAPI.login(email, password);
```

### Запросы к БД

**Было** (Supabase):
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

**Стало** (собственный API):
```typescript
const user = await usersAPI.getById(userId);
```

### Работа с токенами

**Было**:
- Supabase управлял сессией автоматически

**Стало**:
- Токен хранится в localStorage как `protime_token`
- Автоматически добавляется в заголовок `Authorization: Bearer <token>`
- Управляется через функции `setToken()`, `getToken()`, `removeToken()`

## Поддержка

При возникновении проблем:

1. Проверьте логи бэкенда
2. Проверьте логи браузера (Console, Network)
3. Убедитесь, что PostgreSQL запущен и доступен
4. Убедитесь, что .env файлы настроены правильно
5. Проверьте, что порты не заняты другими приложениями

## Преимущества перехода

✅ **Полный контроль** над бэкендом и данными  
✅ **Нет зависимости** от внешних сервисов  
✅ **Гибкость** в реализации бизнес-логики  
✅ **Безопасность** данных внутри корпоративной сети  
✅ **Масштабируемость** по вашим требованиям  
✅ **Отсутствие ограничений** бесплатных планов  

## Недостатки

❌ **Требуется поддержка** собственной инфраструктуры  
❌ **Ответственность** за backup и восстановление  
❌ **Необходимость настройки** мониторинга и безопасности  
❌ **Дополнительные затраты** на сервера  

## Следующие шаги

1. Завершить обновление всех хуков
2. Провести полное тестирование
3. Настроить CI/CD для автоматического деплоя
4. Настроить мониторинг и алерты
5. Создать документацию для команды разработки

