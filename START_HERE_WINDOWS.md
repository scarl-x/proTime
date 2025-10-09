# 🚀 С чего начать (Windows + PostgreSQL 18)

**Главная инструкция для быстрого запуска проекта ProTime**

---

## ✅ Что нужно установить

- [x] PostgreSQL 18 (у вас уже установлен!)
- [x] Node.js (проверьте: `node --version`)
- [x] Git (опционально)

---

## ⚡ Быстрый старт (3 простых шага)

### Шаг 1: Настройте PostgreSQL команды

**Скопируйте и вставьте в PowerShell:**

```powershell
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }
function pg_dump { & "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" $args }
function dropdb { & "C:\Program Files\PostgreSQL\18\bin\dropdb.exe" $args }

Write-Host "✅ PostgreSQL 18 команды готовы!" -ForegroundColor Green
```

**Теперь проверьте:**
```powershell
psql --version
# Должно быть: psql (PostgreSQL) 18.0
```

---

### Шаг 2: Создайте базу данных

**⚠️ ВАЖНО: PostgreSQL 18 использует порт 5433 (не 5432)!**

```powershell
# Создать базу данных (будет запрошен пароль)
createdb -U postgres -p 5433 protime_db

# Применить схему (из корня проекта)
cd C:\Users\marga\proTime_vers_with_adaptive\project
psql -U postgres -p 5433 -d protime_db -f server\src\database\schema.sql

# Проверить создание таблиц (должно быть 9 таблиц)
psql -U postgres -p 5433 -d protime_db -c "\dt"
```

**Должны увидеть таблицы:**
- users
- projects
- time_slots
- tasks
- task_assignments
- task_categories
- leave_requests
- bookings
- deadline_log

---

### Шаг 3: Настройте и запустите проект

#### 3.1. Настройка бэкенда

```powershell
# Перейти в папку сервера
cd C:\Users\marga\proTime_vers_with_adaptive\project\server

# Установить зависимости
npm install

# Создать .env файл
@"
PORT=3001
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=ВАШ_ПАРОЛЬ_POSTGRES
JWT_SECRET=your_random_secret_key_min_32_characters_long_12345
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
"@ | Out-File -FilePath .env -Encoding utf8
```

**⚠️ ВАЖНО: Замените `ВАШ_ПАРОЛЬ_POSTGRES` на реальный пароль!**

```powershell
# Запустить бэкенд
npm run dev
```

**Должны увидеть:**
```
🚀 Сервер запущен на порту 3001
✓ Подключено к базе данных PostgreSQL
```

#### 3.2. Настройка фронтенда (в новом окне PowerShell)

```powershell
# Вернуться в корень проекта
cd C:\Users\marga\proTime_vers_with_adaptive\project

# Создать .env для фронтенда
"VITE_API_URL=http://localhost:3001/api" | Out-File -FilePath .env -Encoding utf8

# Установить зависимости (если не установлены)
npm install

# Запустить фронтенд
npm run dev
```

---

## 🎉 Готово!

Откройте браузер: **http://localhost:5173**

**Войдите с тестовым аккаунтом:**
- Email: `admin@company.com`
- Пароль: `password`

---

## 🆘 Что-то пошло не так?

### Ошибка: "подключиться к серверу не удалось"

**Проверьте порт PostgreSQL:**
```powershell
netstat -an | findstr 5433
```

Если порт другой, измените `DATABASE_PORT` в `server\.env`

### Ошибка: "пользователь не прошёл проверку подлинности"

**Проверьте пароль:**
```powershell
psql -U postgres -p 5433
# Введите пароль который вы установили при установке PostgreSQL
```

Если забыли пароль - см. [SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md) раздел "Сброс пароля"

### Ошибка: "createdb: команда не найдена"

**Вы не создали функции из Шага 1. Вернитесь и выполните:**
```powershell
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }
```

### База данных уже существует

```powershell
# Удалить старую базу
dropdb -U postgres -p 5433 protime_db

# Создать заново
createdb -U postgres -p 5433 protime_db
psql -U postgres -p 5433 -d protime_db -f server\src\database\schema.sql
```

---

## 📚 Дополнительные инструкции

- **[QUICK_COMMANDS_WINDOWS.md](./QUICK_COMMANDS_WINDOWS.md)** - Шпаргалка команд
- **[QUICK_START_PG18.md](./QUICK_START_PG18.md)** - Полная инструкция по установке
- **[SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md)** - Настройка PATH
- **[server/README.md](./server/README.md)** - Документация API

---

## 💡 Полезные команды

```powershell
# Подключиться к базе
psql -U postgres -p 5433 -d protime_db

# Посмотреть таблицы
psql -U postgres -p 5433 -d protime_db -c "\dt"

# Посмотреть пользователей
psql -U postgres -p 5433 -d protime_db -c "SELECT id, name, email, role FROM users;"

# Backup базы
pg_dump -U postgres -p 5433 protime_db > backup.sql

# Restore базы
psql -U postgres -p 5433 -d protime_db < backup.sql
```

---

## 🎯 Контрольный список

- [ ] PostgreSQL 18 установлен и запущен
- [ ] Команды `psql` работают (функции созданы)
- [ ] База данных `protime_db` создана
- [ ] Схема применена (9 таблиц)
- [ ] Файл `server\.env` создан и заполнен
- [ ] Бэкенд запущен (порт 3001)
- [ ] Файл `.env` создан в корне проекта
- [ ] Фронтенд запущен (порт 5173)
- [ ] Успешный вход в систему

---

**Удачи с проектом ProTime! 🚀**

**Вопросы?** Смотрите [QUICK_COMMANDS_WINDOWS.md](./QUICK_COMMANDS_WINDOWS.md) или [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)
