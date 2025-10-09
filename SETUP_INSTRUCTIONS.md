# 🚀 Инструкция по запуску ProTime без Supabase

## ✅ Что было сделано

Весь проект успешно переведен с Supabase на собственный бэкенд Node.js + Express + PostgreSQL.

**Обновленные файлы:**
- ✅ `server/` - весь бэкенд сервер
- ✅ `src/lib/api.ts` - API клиент
- ✅ `src/hooks/useAuth.ts` - аутентификация
- ✅ `src/hooks/useProjects.ts` - проекты
- ✅ `src/hooks/useTimeSlots.ts` - временные слоты
- ✅ `src/hooks/useTasks.ts` - задачи
- ✅ `src/hooks/useTaskCategories.ts` - категории
- ✅ `src/hooks/useLeaveRequests.ts` - отпуска
- ✅ `src/hooks/useBookings.ts` - бронирования
- ✅ `src/hooks/useDailyStandups.ts` - работает через useTimeSlots

## 📋 Требования

- **Node.js** 18 или выше
- **PostgreSQL** 16 или выше (протестировано на PostgreSQL 18)
- **npm** или **yarn**

## 🔧 Шаг 1: Установка PostgreSQL

### Windows
1. Скачайте установщик: https://www.postgresql.org/download/windows/
2. Запустите установщик и следуйте инструкциям
3. Запомните пароль для пользователя `postgres`

### macOS
```bash
brew install postgresql@18
brew services start postgresql@18
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 🗄️ Шаг 2: Создание базы данных

```bash
# Подключитесь к PostgreSQL
psql -U postgres

# Создайте базу данных (в psql консоли)
CREATE DATABASE protime_db;

# Выйдите из psql
\q

# Примените схему базы данных
psql -U postgres -d protime_db -f server/src/database/schema.sql
```

Если у вас Windows и psql не находится в PATH:
```bash
# Найдите путь к PostgreSQL, обычно:
# C:\Program Files\PostgreSQL\18\bin\psql.exe

cd "C:\Program Files\PostgreSQL\18\bin"
.\psql.exe -U postgres -d protime_db -f "C:\путь\к\проекту\server\src\database\schema.sql"
```

## ⚙️ Шаг 3: Настройка бэкенда

```bash
# Перейдите в папку сервера
cd server

# Установите зависимости
npm install

# Создайте .env файл
# В Windows используйте Notepad или любой текстовый редактор
# В Mac/Linux можете использовать команду ниже
```

Создайте файл `server/.env` со следующим содержимым:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_NAME=protime_db
DATABASE_USER=postgres
DATABASE_PASSWORD=ваш_пароль_от_postgres

# JWT Configuration
JWT_SECRET=измените_этот_секретный_ключ_на_случайную_строку
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

**⚠️ ВАЖНО:** 
- Замените `ваш_пароль_от_postgres` на реальный пароль
- Измените `JWT_SECRET` на случайную строку (минимум 32 символа)

Для генерации JWT_SECRET можете использовать:
```bash
# В Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Или онлайн: https://www.grc.com/passwords.htm
```

## 🚀 Шаг 4: Запуск бэкенда

```bash
# Находясь в папке server/
npm run dev
```

Вы должны увидеть:
```
🚀 Сервер запущен на порту 3001
📍 API доступен по адресу: http://localhost:3001
🌍 Окружение: development
✓ Подключено к базе данных PostgreSQL
```

## 🎨 Шаг 5: Настройка фронтенда

```bash
# Вернитесь в корень проекта
cd ..

# Создайте .env файл
# В Windows используйте Notepad
# В Mac/Linux:
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

Или создайте файл `.env` в корне проекта:

```env
VITE_API_URL=http://localhost:3001/api
```

## ▶️ Шаг 6: Запуск фронтенда

```bash
# В корне проекта (если зависимости еще не установлены)
npm install

# Запуск в режиме разработки
npm run dev
```

Откроется браузер на `http://localhost:5173`

## 🔐 Шаг 7: Вход в систему

Используйте тестовые аккаунты:

**Администратор:**
- Email: `admin@company.com`
- Пароль: `password`

**Сотрудник 1:**
- Email: `ivan@company.com`
- Пароль: `password`

**Сотрудник 2:**
- Email: `maria@company.com`
- Пароль: `password`

## ✅ Проверка работоспособности

1. **Войдите** в систему
2. **Проверьте** список проектов - должны отобразиться 3 демо-проекта
3. **Создайте** новый проект
4. **Добавьте** временной слот
5. **Создайте** задачу

Если все работает - поздравляю! 🎉

## 🐛 Решение проблем

### Ошибка подключения к базе данных

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Решение:**
- Убедитесь, что PostgreSQL запущен
- Проверьте пароль в `.env` файле
- Проверьте, что база данных `protime_db` создана

Windows:
```bash
# Проверьте статус службы
services.msc
# Найдите PostgreSQL и убедитесь, что служба запущена
```

Mac/Linux:
```bash
# Проверьте статус
pg_isready

# Перезапустите PostgreSQL (Mac)
brew services restart postgresql@18

# Перезапустите PostgreSQL (Linux)
sudo systemctl restart postgresql
```

### Ошибка "JWT Secret is not defined"

**Решение:** Проверьте, что в `server/.env` установлен `JWT_SECRET`

### Фронтенд не подключается к бэкенду

```
Failed to fetch
```

**Решение:**
1. Убедитесь, что бэкенд запущен на порту 3001
2. Проверьте `.env` файл в корне проекта
3. Перезапустите фронтенд после создания/изменения `.env`

### Порт 3001 уже занят

**Решение:** Измените порт в `server/.env`:
```env
PORT=3002
```

И в корневом `.env`:
```env
VITE_API_URL=http://localhost:3002/api
```

## 📚 Дополнительная документация

- `server/README.md` - полная документация API
- `MIGRATION_GUIDE.md` - руководство по миграции с Supabase
- `REMAINING_HOOKS_UPDATE.md` - шаблоны обновления хуков

## 🔒 Безопасность

⚠️ **Перед деплоем в production:**

1. **Смените пароли** демо-пользователей
2. **Сгенерируйте** новый JWT_SECRET
3. **Используйте** environment variables вместо .env файлов
4. **Настройте** SSL/HTTPS
5. **Ограничьте** CORS только на ваш домен
6. **Включите** rate limiting

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи бэкенда в консоли где запущен `npm run dev`
2. Проверьте консоль браузера (F12) на ошибки
3. Убедитесь, что все .env файлы настроены правильно
4. Проверьте, что PostgreSQL запущен и доступен

---

## 🎯 Быстрый старт (TL;DR)

```bash
# 1. Создайте БД
psql -U postgres -c "CREATE DATABASE protime_db"
psql -U postgres -d protime_db -f server/src/database/schema.sql

# 2. Настройте бэкенд
cd server
npm install
# Создайте server/.env с настройками БД и JWT_SECRET

# 3. Запустите бэкенд
npm run dev

# 4. В новом терминале - настройте фронтенд
cd ..
echo "VITE_API_URL=http://localhost:3001/api" > .env

# 5. Запустите фронтенд
npm install
npm run dev

# 6. Откройте браузер: http://localhost:5173
# Логин: admin@company.com / password
```

Готово! 🚀

