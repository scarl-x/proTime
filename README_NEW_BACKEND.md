# 🚀 ProTime - Система управления проектным временем

## ✅ Миграция завершена!

Проект успешно переведен с Supabase на собственный бэкенд **Node.js + Express + PostgreSQL**.

## 🎯 Быстрый старт

### 1️⃣ Создайте базу данных PostgreSQL

```bash
psql -U postgres -c "CREATE DATABASE protime_db"
psql -U postgres -d protime_db -f server/src/database/schema.sql
```

### 2️⃣ Настройте бэкенд

```bash
cd server
npm install
```

Создайте `server/.env`:
```env
PORT=3001
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=ваш_пароль
JWT_SECRET=случайная_строка_минимум_32_символа
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3️⃣ Запустите бэкенд

```bash
npm run dev
```

### 4️⃣ Настройте фронтенд

В корне проекта создайте `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

```bash
npm install
npm run dev
```

### 5️⃣ Войдите в систему

Откройте http://localhost:5173

**Тестовый аккаунт:**
- Email: `admin@company.com`
- Пароль: `password`

---

## 📚 Документация

### Для быстрого старта:
- **[QUICK_START_PG18.md](./QUICK_START_PG18.md)** - ⚡ Быстрый старт для PostgreSQL 18
- **[QUICK_COMMANDS_WINDOWS.md](./QUICK_COMMANDS_WINDOWS.md)** - 🪟 Шпаргалка команд для Windows
- **[SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md)** - 🔧 Настройка PATH в Windows

### Полная документация:
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - 📖 Полная инструкция по установке и запуску
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - 🔄 Руководство по миграции с Supabase
- **[server/README.md](./server/README.md)** - 🔌 Документация API
- **[REMAINING_HOOKS_UPDATE.md](./REMAINING_HOOKS_UPDATE.md)** - ⚙️ Примеры обновления хуков (уже выполнено)

## ✨ Что было сделано

### Backend (Сервер)

✅ **Полноценный REST API** на Node.js + Express + PostgreSQL  
✅ **JWT аутентификация** с bcrypt хешированием  
✅ **8 основных endpoints**: users, projects, tasks, time-slots, task-categories, leave-requests, bookings, auth  
✅ **SQL схема базы данных** с демо-данными  
✅ **Middleware**: CORS, Helmet, Compression, Error Handling  
✅ **TypeScript** для типобезопасности  

### Frontend (Клиент)

✅ **API клиент** (`src/lib/api.ts`) - замена Supabase  
✅ **8 обновленных хуков**:
   - `useAuth.ts` - аутентификация
   - `useProjects.ts` - проекты  
   - `useTimeSlots.ts` - временные слоты
   - `useTasks.ts` - задачи и назначения
   - `useTaskCategories.ts` - категории задач
   - `useLeaveRequests.ts` - заявки на отпуск
   - `useBookings.ts` - бронирования
   - `useDailyStandups.ts` - ежедневные стендапы

✅ **Управление токенами** (localStorage)  
✅ **Обработка ошибок**  
✅ **Fallback на демо-данные** при отсутствии API  

## 🎨 Особенности

- 🔐 **Безопасность**: JWT токены, bcrypt, Helmet
- 🌍 **CORS**: Настраиваемый для production
- 📊 **PostgreSQL**: Полноценная реляционная БД
- 🚀 **TypeScript**: На фронтенде и бэкенде
- 🎯 **REST API**: Стандартизированные endpoints
- 💾 **Миграции**: SQL схема с версионированием
- 🧪 **Демо-данные**: Готовые тестовые пользователи и проекты

## 🏗️ Архитектура

```
proTime/
├── server/                 # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/        # Конфигурация (DB, JWT)
│   │   ├── controllers/   # Контроллеры API
│   │   ├── middleware/    # Middleware (auth, errors)
│   │   ├── routes/        # Маршруты API
│   │   ├── database/      # SQL схема
│   │   └── index.ts       # Точка входа
│   ├── package.json
│   └── .env               # Настройки (не в git)
│
├── src/                    # Frontend (React + TypeScript)
│   ├── lib/
│   │   └── api.ts         # ✨ Новый API клиент
│   ├── hooks/             # ✨ Обновленные хуки
│   ├── components/        # React компоненты
│   └── types/             # TypeScript типы
│
├── .env                    # Frontend настройки (не в git)
├── SETUP_INSTRUCTIONS.md   # 📖 Инструкция по установке
├── MIGRATION_GUIDE.md      # 🔄 Руководство по миграции
└── README_NEW_BACKEND.md   # 👈 Вы здесь
```

## 🔒 Безопасность

⚠️ **Важно для production:**

1. Смените пароли демо-пользователей
2. Сгенерируйте сильный JWT_SECRET
3. Используйте HTTPS (SSL/TLS)
4. Ограничьте CORS на конкретные домены
5. Настройте rate limiting
6. Используйте переменные окружения вместо .env файлов
7. Регулярно обновляйте зависимости

## 🛠️ Доступные команды

### Backend
```bash
cd server
npm run dev      # Запуск в development режиме
npm run build    # Сборка для production
npm start        # Запуск production сборки
```

### Frontend
```bash
npm run dev      # Запуск в development режиме
npm run build    # Сборка для production
npm run preview  # Предпросмотр production сборки
npm run lint     # Проверка кода
```

## 🐛 Решение проблем

### База данных не подключается
```bash
# Проверьте статус PostgreSQL
# Windows: services.msc
# Mac: brew services list
# Linux: systemctl status postgresql

# Проверьте настройки в server/.env
```

### Фронтенд не видит API
```bash
# 1. Убедитесь, что бэкенд запущен (порт 3001)
# 2. Проверьте файл .env в корне проекта
# 3. Перезапустите фронтенд после изменения .env
```

### JWT ошибки
```bash
# Убедитесь, что JWT_SECRET установлен в server/.env
# Минимум 32 символа, случайная строка
```

## 📊 Статистика проекта

- **Backend**: ~2000 строк TypeScript кода
- **API endpoints**: 50+ маршрутов
- **База данных**: 9 таблиц с индексами
- **Frontend хуки**: 8 полностью обновленных хуков
- **Документация**: 4 подробных руководства

## 🎉 Преимущества нового бэкенда

✅ **Независимость** - нет зависимости от Supabase  
✅ **Контроль** - полный контроль над данными и логикой  
✅ **Гибкость** - легко добавлять новые функции  
✅ **Безопасность** - данные в корпоративной сети  
✅ **Масштабируемость** - горизонтальное и вертикальное масштабирование  
✅ **Стоимость** - нет ограничений бесплатных планов  
✅ **Производительность** - оптимизированные запросы к БД  

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
2. Посмотрите логи бэкенда и браузера (Console, Network)
3. Убедитесь, что PostgreSQL запущен
4. Проверьте настройки .env файлов

---

## 📝 Лицензия

ISC

---

**Готово к работе!** 🚀 Следуйте инструкциям в [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) для запуска.

