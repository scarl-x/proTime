# ⚡ Быстрые команды для Windows

Шпаргалка для работы с PostgreSQL 18 на Windows, когда PATH не настроен.

## 🎯 Одноразовая настройка (в начале каждой сессии PowerShell)

Скопируйте и вставьте эти строки в PowerShell:

```powershell
# Создаем удобные функции для работы с PostgreSQL 18
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }
function pg_dump { & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $args }
function dropdb { & "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" $args }

Write-Host "✅ PostgreSQL 18 команды готовы к использованию!" -ForegroundColor Green
```

После этого все команды ниже будут работать! 🎉

---

## 🚀 Первоначальная настройка проекта

**⚠️ ВАЖНО: PostgreSQL 18 использует порт 5433!**

```powershell
# 1. Создать базу данных
createdb -U postgres -p 5433 protime_db

# 2. Применить схему (из корня проекта)
psql -U postgres -p 5433 -d protime_db -f server/src/database/schema.sql

# 3. Проверить создание таблиц
psql -U postgres -p 5433 -d protime_db -c "\dt"

# 4. Посмотреть пользователей
psql -U postgres -p 5433 -d protime_db -c "SELECT id, name, email, role FROM users;"
```

---

## 📋 Полезные команды PostgreSQL

### Проверка версии
```powershell
psql --version
```

### Подключиться к базе
```powershell
psql -U postgres -p 5433 -d protime_db
```

Внутри psql:
```sql
\dt              -- Список таблиц
\d users         -- Структура таблицы users
\l               -- Список баз данных
\q               -- Выход
```

### Выполнить SQL запрос
```powershell
psql -U postgres -p 5433 -d protime_db -c "SELECT COUNT(*) FROM users;"
```

### Экспорт базы (backup)
```powershell
pg_dump -U postgres -p 5433 protime_db > backup_$(Get-Date -Format 'yyyy-MM-dd').sql
```

### Импорт базы (restore)
```powershell
psql -U postgres -p 5433 -d protime_db < backup_2024-01-15.sql
```

### Удалить и создать заново
```powershell
# ВНИМАНИЕ: Удаляет все данные!
dropdb -U postgres -p 5433 protime_db
createdb -U postgres -p 5433 protime_db
psql -U postgres -p 5433 -d protime_db -f server/src/database/schema.sql
```

---

## 🔧 Настройка и запуск проекта

### Настройка бэкенда
```powershell
# Перейти в папку сервера
cd server

# Установить зависимости
npm install

# Создать .env файл (отредактируйте пароль!)
@"
PORT=3001
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=ваш_пароль
JWT_SECRET=your_random_secret_key_min_32_characters_long_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8

# Запустить бэкенд
npm run dev
```

### Настройка фронтенда (в новом окне PowerShell)
```powershell
# Вернуться в корень проекта
cd ..

# Создать .env для фронтенда
"VITE_API_URL=http://localhost:3001/api" | Out-File -FilePath .env -Encoding utf8

# Установить зависимости (если еще не установлены)
npm install

# Запустить фронтенд
npm run dev
```

---

## 🛠️ Troubleshooting

### Проверить статус PostgreSQL
```powershell
# Открыть службы
services.msc
# Найти: postgresql-x64-18
```

### Проверить порт PostgreSQL
```powershell
# PostgreSQL 18 обычно использует порт 5433
netstat -an | findstr 5433
```

### Подключиться с указанием порта
```powershell
psql -U postgres -p 5433 -d protime_db
```

### Сбросить пароль postgres
```powershell
# Запустить psql от администратора
psql -U postgres
```

В psql:
```sql
ALTER USER postgres PASSWORD 'новый_пароль';
```

### Посмотреть логи PostgreSQL
```powershell
# Логи обычно здесь:
Get-Content "C:\Program Files\PostgreSQL\18\data\log\*.log" -Tail 50
```

---

## 💾 Полезные SQL запросы

### Посмотреть всех пользователей системы
```powershell
psql -U postgres -p 5433 -d protime_db -c "SELECT id, name, email, role, has_account FROM users ORDER BY created_at;"
```

### Посмотреть все проекты
```powershell
psql -U postgres -p 5433 -d protime_db -c "SELECT id, name, status FROM projects;"
```

### Посмотреть временные слоты
```powershell
psql -U postgres -p 5433 -d protime_db -c "SELECT id, date, task, status FROM time_slots ORDER BY date DESC LIMIT 10;"
```

### Очистить все данные (оставить структуру)
```powershell
psql -U postgres -p 5433 -d protime_db -c "
TRUNCATE TABLE bookings, leave_requests, task_assignments, task_categories, 
             time_slots, tasks, projects, users RESTART IDENTITY CASCADE;
"
```

### Применить схему заново с данными
```powershell
psql -U postgres -p 5433 -d protime_db -f server/src/database/schema.sql
```

---

## 🎓 Сделать функции постоянными (опционально)

Если не хотите каждый раз вводить функции, добавьте их в профиль PowerShell:

```powershell
# Открыть профиль в блокноте
notepad $PROFILE

# Если файл не существует, создастся новый
# Добавьте в файл:
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }
function pg_dump { & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $args }
function dropdb { & "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" $args }

# Сохраните файл (Ctrl+S)
# Закройте блокнот
# Перезапустите PowerShell

# Теперь функции будут доступны в каждой новой сессии!
```

---

## 📱 Проверка работоспособности

Выполните эти команды чтобы убедиться что все работает:

```powershell
# 1. Версия PostgreSQL
psql --version

# 2. База данных создана
psql -U postgres -p 5433 -l | Select-String "protime_db"

# 3. Таблицы созданы (должно быть 9 таблиц)
psql -U postgres -p 5433 -d protime_db -c "\dt" | Select-String "table"

# 4. Пользователи добавлены (должно быть 3 пользователя)
psql -U postgres -p 5433 -d protime_db -c "SELECT COUNT(*) FROM users;"

# 5. Бэкенд запущен
Test-NetConnection localhost -Port 3001

# 6. Фронтенд запущен
Test-NetConnection localhost -Port 5173
```

Если все команды выполнились успешно - проект готов к работе! 🎉

---

## 🔗 Дополнительная документация

- [QUICK_START_PG18.md](./QUICK_START_PG18.md) - Полная инструкция по установке
- [SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md) - Настройка PATH в Windows
- [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md) - Подробная инструкция
- [server/README.md](./server/README.md) - Документация API

---

**Tip:** Сохраните этот файл в закладки для быстрого доступа! 📌

