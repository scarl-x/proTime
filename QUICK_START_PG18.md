# 🚀 Быстрый старт для PostgreSQL 18

Специальная инструкция для вашей версии PostgreSQL 18.

## ✅ Пошаговая установка

### 0. Настройка PATH (ВАЖНО для Windows!)

Если команда `psql --version` не работает, у вас две опции:

**Вариант А: Добавить PostgreSQL 18 в PATH (рекомендуется)**
```powershell
# Добавьте в системные переменные Path:
# C:\Program Files\PostgreSQL\18\bin
# Подробная инструкция в файле SETUP_WINDOWS_PATH.md
```

**Вариант Б: Использовать полные пути**
```powershell
# Используйте полный путь к psql:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

**Для упрощения создайте временную функцию в PowerShell:**
```powershell
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }

# Теперь можете использовать обычные команды:
psql --version
```

### 1. Убедитесь что PostgreSQL 18 установлен

```powershell
# Проверьте версию (после настройки PATH или используя функцию выше)
psql --version
# Должно быть: psql (PostgreSQL) 18.0 или 18.x

# Или с полным путем:
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

### 2. Создайте базу данных

**⚠️ ВАЖНО: PostgreSQL 18 обычно использует порт 5433 (не стандартный 5432)!**

**Если PATH настроен:**
```powershell
# Через команду (добавляем -p 5433)
psql -U postgres -p 5433 -c "CREATE DATABASE protime_db;"

# Или через консоль
psql -U postgres -p 5433
CREATE DATABASE protime_db;
\q
```

**Если PATH НЕ настроен (используйте полные пути):**
```powershell
# Создание базы (с портом 5433)
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5433 -c "CREATE DATABASE protime_db;"

# Или через консоль
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5433
CREATE DATABASE protime_db;
\q
```

### 3. Примените схему базы данных

**Вариант 1: PATH настроен**
```powershell
# Находясь в корне проекта (добавляем -p 5433)
psql -U postgres -p 5433 -d protime_db -f server/src/database/schema.sql
```

**Вариант 2: PATH НЕ настроен (полный путь)**
```powershell
# Замените путь к проекту на свой!
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -p 5433 -d protime_db -f "C:\Users\marga\proTime_vers_with_adaptive\project\server\src\database\schema.sql"
```

**Вариант 3: С использованием функции**
```powershell
# Сначала создайте функцию (в начале сессии):
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }

# Теперь используйте как обычно (с портом 5433):
psql -U postgres -p 5433 -d protime_db -f server/src/database/schema.sql
```

### 4. Проверьте создание таблиц

```powershell
psql -U postgres -p 5433 -d protime_db -c "\dt"
```

Вы должны увидеть таблицы:
- users
- projects
- time_slots
- tasks
- task_assignments
- task_categories
- leave_requests
- bookings

### 5. Настройте бэкенд

Создайте файл `server/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=ваш_пароль_postgres

# JWT Configuration
JWT_SECRET=измените_на_случайную_строку_минимум_32_символа
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**Важно:** Замените `ваш_пароль_postgres` на реальный пароль!

### 6. Установите зависимости и запустите бэкенд

```bash
cd server
npm install
npm run dev
```

Вы должны увидеть:
```
🚀 Сервер запущен на порту 3001
📍 API доступен по адресу: http://localhost:3001
🌍 Окружение: development
✓ Подключено к базе данных PostgreSQL
```

### 7. Запустите фронтенд

В **новом** терминале:

```bash
# Вернитесь в корень проекта
cd ..

# Создайте .env для фронтенда
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Запустите фронтенд
npm install
npm run dev
```

### 8. Откройте браузер

Перейдите на http://localhost:5173

**Логин:**
- Email: `admin@company.com`
- Пароль: `password`

---

## 🔧 Полезные команды PostgreSQL 18

### Проверить статус PostgreSQL

**Windows:**
```bash
# Откройте services.msc
# Найдите "postgresql-x64-18"
```

**Mac:**
```bash
brew services list
```

**Linux:**
```bash
sudo systemctl status postgresql
```

### Подключиться к базе данных

```bash
psql -U postgres -d protime_db
```

### Список всех баз данных

```bash
psql -U postgres -c "\l"
```

### Список таблиц в базе

```bash
psql -U postgres -d protime_db -c "\dt"
```

### Посмотреть данные в таблице

```bash
psql -U postgres -d protime_db -c "SELECT * FROM users;"
```

### Удалить базу данных (если нужно начать заново)

```bash
# ВНИМАНИЕ: Удаляет все данные!
psql -U postgres -c "DROP DATABASE protime_db;"
psql -U postgres -c "CREATE DATABASE protime_db;"
psql -U postgres -d protime_db -f server/src/database/schema.sql
```

### Экспорт базы данных (backup)

```bash
pg_dump -U postgres protime_db > protime_backup.sql
```

### Импорт базы данных (restore)

```bash
psql -U postgres -d protime_db < protime_backup.sql
```

---

## ❌ Частые ошибки

### Ошибка: "database protime_db does not exist"

**Решение:**
```bash
psql -U postgres -c "CREATE DATABASE protime_db;"
```

### Ошибка: "password authentication failed"

**Решение:**
1. Проверьте пароль в `server/.env`
2. Попробуйте сбросить пароль:
```bash
# Windows: В psql консоли от имени администратора
ALTER USER postgres PASSWORD 'новый_пароль';
```

### Ошибка: "psql is not recognized"

**Решение (Windows):**

**Вариант 1: Добавить в PATH (рекомендуется)**
1. `Win + S` → "Переменные среды"
2. Системные переменные → Path → Изменить
3. Создать → Добавить: `C:\Program Files\PostgreSQL\18\bin`
4. ОК → Перезапустить PowerShell

Подробная инструкция: [SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md)

**Вариант 2: Использовать полные пути**
```powershell
# Создайте функции в начале каждой сессии PowerShell:
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }
function pg_dump { & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $args }
```

**Вариант 3: Добавить в PowerShell профиль (навсегда)**
```powershell
notepad $PROFILE
# Добавьте функции из варианта 2
# Сохраните и перезапустите PowerShell
```

### Ошибка: "Connection refused"

**Решение:**
1. Убедитесь что PostgreSQL запущен
2. Проверьте порт (должен быть 5432):
```bash
netstat -an | findstr 5432  # Windows
netstat -an | grep 5432     # Mac/Linux
```

---

## 📊 Структура базы данных

База `protime_db` содержит:

1. **users** - Пользователи системы (сотрудники и администраторы)
2. **projects** - Проекты
3. **time_slots** - Временные слоты работы
4. **tasks** - Задачи проектов
5. **task_assignments** - Назначения задач сотрудникам
6. **task_categories** - Категории задач
7. **leave_requests** - Заявки на отпуска
8. **bookings** - Бронирования времени сотрудников

Всего: **9 таблиц** с индексами и внешними ключами.

---

## 🎯 Проверка установки

После всех шагов проверьте:

- ✅ PostgreSQL 18 запущен
- ✅ База данных `protime_db` создана
- ✅ 9 таблиц созданы
- ✅ Бэкенд запущен на порту 3001
- ✅ Фронтенд запущен на порту 5173
- ✅ Можете войти с `admin@company.com` / `password`

**Все работает?** 🎉 Поздравляю!

**Есть проблемы?** Смотрите [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) для подробной информации.

