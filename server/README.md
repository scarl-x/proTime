# ProTime Backend API

Бэкенд для системы управления проектным временем на Node.js + Express + PostgreSQL.

## Требования

- Node.js 18+ 
- PostgreSQL 16+ (протестировано на PostgreSQL 18)
- npm или yarn

## Установка

1. Установите зависимости:
```bash
cd server
npm install
```

2. Создайте базу данных PostgreSQL:
```bash
createdb protime_db
```

3. Создайте файл `.env` на основе примера:
```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

4. Примените миграции базы данных:
```bash
psql -U postgres -d protime_db -f src/database/schema.sql
```

## Запуск

### Development режим
```bash
npm run dev
```

### Production режим
```bash
npm run build
npm start
```

## Генерация паролей

Для генерации новых bcrypt хешей паролей:

```bash
# Генерировать хеши для пароля "password"
node scripts/generate-password-hashes.js

# Генерировать хеши для своего пароля
node scripts/generate-password-hashes.js mySecretPassword123
```

Скопируйте сгенерированные хеши в `src/database/schema.sql`.

## API Endpoints

### Аутентификация
- `POST /api/auth/login` - Вход в систему
- `POST /api/auth/register` - Регистрация

### Пользователи
- `GET /api/users` - Получить всех пользователей
- `GET /api/users/:id` - Получить пользователя по ID
- `POST /api/users` - Создать пользователя (admin)
- `PUT /api/users/:id` - Обновить пользователя (admin)
- `DELETE /api/users/:id` - Удалить пользователя (admin)
- `POST /api/users/:id/account` - Создать аккаунт (admin)
- `DELETE /api/users/:id/account` - Удалить аккаунт (admin)

### Проекты
- `GET /api/projects` - Получить все проекты
- `GET /api/projects/:id` - Получить проект по ID
- `POST /api/projects` - Создать проект
- `PUT /api/projects/:id` - Обновить проект
- `DELETE /api/projects/:id` - Удалить проект

### Временные слоты
- `GET /api/time-slots` - Получить временные слоты (с фильтрами)
  - Query params: `employeeId`, `projectId`, `dateFrom`, `dateTo`
- `GET /api/time-slots/:id` - Получить слот по ID
- `POST /api/time-slots` - Создать слот
- `PUT /api/time-slots/:id` - Обновить слот
- `DELETE /api/time-slots/:id` - Удалить слот

### Задачи
- `GET /api/tasks` - Получить все задачи
  - Query params: `projectId`, `status`
- `GET /api/tasks/:id` - Получить задачу по ID
- `POST /api/tasks` - Создать задачу
- `PUT /api/tasks/:id` - Обновить задачу
- `DELETE /api/tasks/:id` - Удалить задачу
- `GET /api/tasks/:id/assignments` - Получить назначения задачи
- `POST /api/tasks/:id/assignments` - Создать назначение
- `PUT /api/tasks/assignments/:assignmentId` - Обновить назначение
- `DELETE /api/tasks/assignments/:assignmentId` - Удалить назначение

### Категории задач
- `GET /api/task-categories` - Получить все категории
  - Query params: `isActive`
- `GET /api/task-categories/:id` - Получить категорию по ID
- `POST /api/task-categories` - Создать категорию
- `PUT /api/task-categories/:id` - Обновить категорию
- `DELETE /api/task-categories/:id` - Удалить категорию

### Заявки на отпуск
- `GET /api/leave-requests` - Получить все заявки
  - Query params: `employeeId`, `status`, `type`
- `GET /api/leave-requests/:id` - Получить заявку по ID
- `POST /api/leave-requests` - Создать заявку
- `PUT /api/leave-requests/:id` - Обновить заявку
- `DELETE /api/leave-requests/:id` - Удалить заявку
- `POST /api/leave-requests/:id/approve` - Одобрить заявку (admin)
- `POST /api/leave-requests/:id/reject` - Отклонить заявку (admin)

### Бронирования
- `GET /api/bookings` - Получить все бронирования
  - Query params: `employeeId`, `requesterId`, `projectId`, `status`
- `GET /api/bookings/:id` - Получить бронирование по ID
- `POST /api/bookings` - Создать бронирование
- `PUT /api/bookings/:id` - Обновить бронирование
- `DELETE /api/bookings/:id` - Удалить бронирование

## Аутентификация

Все защищенные маршруты требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

Токен получается при входе через `/api/auth/login`.

## Демо-данные

После применения схемы БД создаются тестовые пользователи:

**Администратор:**
- Email: `admin@company.com`
- Пароль: `password`

**Сотрудники:**
- Email: `ivan@company.com` / Пароль: `password`
- Email: `maria@company.com` / Пароль: `password`

⚠️ **Важно:** В production смените пароли!

## Структура проекта

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts      # Подключение к БД
│   │   └── jwt.ts           # JWT конфигурация
│   ├── controllers/         # Контроллеры API
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── projects.controller.ts
│   │   ├── timeSlots.controller.ts
│   │   ├── tasks.controller.ts
│   │   ├── taskCategories.controller.ts
│   │   ├── leaveRequests.controller.ts
│   │   └── bookings.controller.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT аутентификация
│   │   └── errorHandler.ts # Обработка ошибок
│   ├── routes/              # Маршруты API
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── timeSlots.routes.ts
│   │   ├── tasks.routes.ts
│   │   ├── taskCategories.routes.ts
│   │   ├── leaveRequests.routes.ts
│   │   └── bookings.routes.ts
│   ├── database/
│   │   └── schema.sql       # SQL схема БД
│   └── index.ts             # Точка входа
├── scripts/
│   └── generate-password-hashes.js  # Генератор паролей
├── package.json
├── tsconfig.json
└── README.md
```

## Разработка

- TypeScript используется для типобезопасности
- PostgreSQL в качестве СУБД
- bcryptjs для хеширования паролей
- JWT для аутентификации
- Helmet для безопасности заголовков HTTP
- CORS для cross-origin запросов

## Безопасность

- Пароли хешируются с помощью bcrypt (salt rounds: 10)
- JWT токены для аутентификации
- CORS настроен для конкретного origin
- Helmet для безопасности заголовков HTTP
- Валидация входных данных

## Production деплой

Перед деплоем в production:

1. Измените `NODE_ENV=production`
2. Сгенерируйте сильный `JWT_SECRET` (минимум 32 символа)
3. Смените пароли демо-пользователей
4. Настройте HTTPS/SSL
5. Настройте правильный `CORS_ORIGIN`
6. Включите rate limiting
7. Настройте мониторинг и логирование
8. Настройте автоматические backup базы данных

## Troubleshooting

### Ошибка подключения к БД

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

Проверьте:
- PostgreSQL запущен: `pg_isready` (Linux/Mac) или проверьте службу (Windows)
- Правильные credentials в `.env`
- База данных создана: `psql -U postgres -l | grep protime_db`

### JWT ошибки

Убедитесь, что `JWT_SECRET` установлен в `.env` и имеет минимум 32 символа.

### Порт занят

Измените `PORT` в `.env` на другой (например, 3002).

## Лицензия

ISC
