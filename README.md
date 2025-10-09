# 🚀 ProTime - Система управления проектным временем

Полноценная система управления временем на проектах с переходом с Supabase на собственный бэкенд **Node.js + Express + PostgreSQL**.

---

## ⚡ Быстрый старт

### Для Windows + PostgreSQL 18

**👉 Начните здесь:** [START_HERE_WINDOWS.md](./START_HERE_WINDOWS.md)

Пошаговая инструкция специально для Windows с PostgreSQL 18.

### Для других систем

**👉 Начните здесь:** [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)

---

## 📚 Документация

### 🆕 Для быстрого старта (рекомендуется):

1. **[START_HERE_WINDOWS.md](./START_HERE_WINDOWS.md)** - 🪟 Пошаговая инструкция для Windows
2. **[QUICK_START_PG18.md](./QUICK_START_PG18.md)** - ⚡ Быстрый старт PostgreSQL 18
3. **[QUICK_COMMANDS_WINDOWS.md](./QUICK_COMMANDS_WINDOWS.md)** - 📋 Шпаргалка команд

### 🔧 Настройка системы:

- **[SETUP_WINDOWS_PATH.md](./SETUP_WINDOWS_PATH.md)** - Настройка PATH в Windows
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Полная инструкция по установке

### 📖 Подробная документация:

- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Руководство по миграции с Supabase
- **[server/README.md](./server/README.md)** - Документация API
- **[README_NEW_BACKEND.md](./README_NEW_BACKEND.md)** - Обзор нового бэкенда

---

## ✨ Возможности

- 📊 Управление проектами
- ⏰ Учёт рабочего времени
- ✅ Система задач с назначениями
- 📅 Управление отпусками и отгулами
- 📈 Отчёты и аналитика
- 👥 Бронирование времени сотрудников
- 🔔 Уведомления о дедлайнах
- 🌍 Поддержка часовых поясов
- 🔄 Повторяющиеся задачи
- 🎯 Приоритеты и дедлайны

---

## 🛠️ Технологии

### Backend
- Node.js + Express
- PostgreSQL 16-18
- TypeScript
- JWT аутентификация
- bcrypt для паролей

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
- Vite

---

## 🎯 Структура проекта

```
proTime/
├── server/                 # Backend
│   ├── src/
│   │   ├── config/        # Конфигурация
│   │   ├── controllers/   # Контроллеры API
│   │   ├── middleware/    # Middleware
│   │   ├── routes/        # Маршруты
│   │   └── database/      # SQL схема
│   └── scripts/           # Утилиты
│
├── src/                    # Frontend
│   ├── components/        # React компоненты
│   ├── hooks/             # Custom hooks
│   ├── lib/               # API клиент
│   ├── types/             # TypeScript типы
│   └── utils/             # Утилиты
│
└── docs/                   # Документация
    ├── START_HERE_WINDOWS.md
    ├── QUICK_START_PG18.md
    ├── SETUP_INSTRUCTIONS.md
    └── ...
```

---

## 🔐 Демо-данные

После установки доступны тестовые аккаунты:

**Администратор:**
- Email: `admin@company.com`
- Пароль: `password`

**Сотрудники:**
- Email: `ivan@company.com` / Пароль: `password`
- Email: `maria@company.com` / Пароль: `password`

⚠️ **Важно:** Смените пароли перед production!

---

## 📊 База данных

PostgreSQL база `protime_db` содержит:

1. **users** - Пользователи (администраторы и сотрудники)
2. **projects** - Проекты
3. **time_slots** - Временные слоты работы
4. **tasks** - Задачи проектов
5. **task_assignments** - Назначения задач
6. **task_categories** - Категории задач
7. **leave_requests** - Заявки на отпуска
8. **bookings** - Бронирования времени

**Всего:** 9 таблиц с индексами и внешними ключами

---

## 🚀 Запуск проекта

### 1. PostgreSQL

```bash
# Создать базу
createdb protime_db

# Применить схему
psql -U postgres -d protime_db -f server/src/database/schema.sql
```

### 2. Backend

```bash
cd server
npm install
# Создайте server/.env с настройками
npm run dev
```

### 3. Frontend

```bash
npm install
# Создайте .env с VITE_API_URL
npm run dev
```

Откройте http://localhost:5173

---

## 🎓 Для разработчиков

### Генерация паролей

```bash
cd server
node scripts/generate-password-hashes.js
```

### API документация

Полная документация API: [server/README.md](./server/README.md)

### Миграция с Supabase

Подробное руководство: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

---

## 🔒 Безопасность

- ✅ JWT токены для аутентификации
- ✅ bcrypt хеширование паролей (10 rounds)
- ✅ Helmet для безопасности заголовков
- ✅ CORS настроен для конкретного origin
- ✅ Валидация входных данных
- ✅ Защита от SQL injection (параметризованные запросы)

---

## 📈 Статистика проекта

- **Backend**: ~2000 строк TypeScript
- **Frontend**: 8 обновленных хуков + компоненты
- **API endpoints**: 50+ маршрутов
- **База данных**: 9 таблиц
- **Документация**: 7 руководств

---

## 🤝 Вклад в проект

Проект переведен с Supabase на собственный бэкенд для:
- ✅ Полного контроля над данными
- ✅ Независимости от внешних сервисов
- ✅ Корпоративных требований безопасности
- ✅ Гибкости в развитии

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверьте соответствующее руководство в [docs/](./docs/)
2. Убедитесь, что PostgreSQL запущен
3. Проверьте настройки в `.env` файлах
4. Посмотрите логи бэкенда и браузера

---

## 📝 Лицензия

ISC

---

## 🎉 Статус проекта

✅ **Миграция завершена!** Проект полностью готов к работе на собственном бэкенде.

- ✅ Backend: Node.js + Express + PostgreSQL
- ✅ Frontend: Все хуки обновлены
- ✅ Документация: 7 подробных руководств
- ✅ Безопасность: JWT + bcrypt
- ✅ База данных: PostgreSQL 16-18

**Начните работу:** [START_HERE_WINDOWS.md](./START_HERE_WINDOWS.md) 🚀

