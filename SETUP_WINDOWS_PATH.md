# 🪟 Настройка PostgreSQL 18 в Windows PATH

## Проблема

После установки PostgreSQL команды `psql`, `createdb` и другие не работают напрямую в PowerShell/CMD.

Вместо:
```bash
psql --version
```

Приходится использовать полный путь:
```bash
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version
```

## ✅ Решение: Добавить PostgreSQL в PATH

### Способ 1: Через GUI (рекомендуется)

1. Нажмите `Win + S` и найдите **"Переменные среды"** или **"Environment Variables"**

2. Выберите **"Изменение системных переменных среды"**

3. Нажмите кнопку **"Переменные среды..."** внизу

4. В разделе **"Системные переменные"** найдите переменную **Path** и нажмите **"Изменить..."**

5. Нажмите **"Создать"** и добавьте:
   ```
   C:\Program Files\PostgreSQL\18\bin
   ```

6. Нажмите **"ОК"** во всех окнах

7. **ВАЖНО:** Закройте и откройте заново PowerShell/CMD

8. Проверьте:
   ```bash
   psql --version
   # Должно показать: psql (PostgreSQL) 18.0
   ```

### Способ 2: Через PowerShell (от администратора)

```powershell
# Запустите PowerShell от имени администратора
# Добавляем PostgreSQL 18 в системный PATH
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";C:\Program Files\PostgreSQL\18\bin",
    "Machine"
)
```

**После этого:** Закройте и откройте PowerShell заново!

---

## ⚙️ Решение 2: Создать алиасы (если не хотите менять PATH)

Добавьте в ваш PowerShell профиль:

```powershell
# Откройте профиль PowerShell
notepad $PROFILE

# Добавьте эти строки:
Set-Alias psql18 "C:\Program Files\PostgreSQL\18\bin\psql.exe"
Set-Alias createdb18 "C:\Program Files\PostgreSQL\18\bin\createdb.exe"
Set-Alias pg_dump18 "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

# Сохраните и перезапустите PowerShell
```

Теперь можете использовать:
```bash
psql18 --version
createdb18 protime_db
```

---

## 🎯 Решение 3: Использовать полные пути (без настройки)

Если не хотите ничего настраивать, используйте полные пути:

### Создание базы данных
```powershell
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres protime_db
```

### Применение схемы
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d protime_db -f "C:\Users\marga\proTime_vers_with_adaptive\project\server\src\database\schema.sql"
```

### Подключение к базе
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d protime_db
```

---

## 🔍 Проверка текущей конфигурации

### Какая версия PostgreSQL по умолчанию?

```powershell
# Попробуйте без полного пути
psql --version

# Если работает - PATH настроен
# Если ошибка - нужно настроить PATH или использовать полные пути
```

### Какие версии PostgreSQL установлены?

```powershell
# Проверка PostgreSQL 18
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" --version

# Проверка PostgreSQL 17
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" --version
```

### На каком порту запущен PostgreSQL?

```powershell
# Обычно PostgreSQL 18 на порту 5432
netstat -an | findstr 5432

# Если у вас две версии, вторая может быть на порту 5433
netstat -an | findstr 5433
```

---

## ⚠️ Важно: Две версии PostgreSQL

Если у вас установлены PostgreSQL 17 и 18:

1. **Разные порты:**
   - PostgreSQL 18: порт `5432` (по умолчанию)
   - PostgreSQL 17: порт `5433` (если установлен после 18)

2. **Проверьте порт в `.env`:**
   ```env
   DATABASE_PORT=5432  # Для PostgreSQL 18
   # или
   DATABASE_PORT=5433  # Если PostgreSQL 18 на другом порту
   ```

3. **Используйте нужную версию:**
   - Для проекта используйте PostgreSQL 18
   - Убедитесь, что служба запущена:
     - `Win + R` → `services.msc`
     - Найдите `postgresql-x64-18`
     - Статус должен быть "Запущена"

---

## 🚀 Быстрая настройка для вашего проекта

После настройки PATH используйте простые команды:

```powershell
# 1. Создать базу
createdb -U postgres protime_db

# 2. Применить схему
psql -U postgres -d protime_db -f server/src/database/schema.sql

# 3. Подключиться к базе
psql -U postgres -d protime_db

# 4. Проверить таблицы
psql -U postgres -d protime_db -c "\dt"

# 5. Посмотреть данные
psql -U postgres -d protime_db -c "SELECT * FROM users;"
```

---

## 🎓 Полезные PowerShell команды

### Создать временную функцию для текущей сессии
```powershell
# Используйте это если не хотите менять PATH навсегда
function psql { & "C:\Program Files\PostgreSQL\18\bin\psql.exe" $args }
function createdb { & "C:\Program Files\PostgreSQL\18\bin\createdb.exe" $args }

# Теперь можете использовать как обычно:
psql --version
createdb -U postgres protime_db
```

### Проверить текущий PATH
```powershell
$env:Path -split ';' | Select-String -Pattern 'PostgreSQL'
```

### Добавить в PATH только для текущей сессии
```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
psql --version  # Теперь работает
```

---

## ✅ Рекомендация

**Лучший вариант:** Добавить PostgreSQL 18 в системный PATH (Способ 1).

Это позволит:
- ✅ Использовать короткие команды (`psql`, `createdb`)
- ✅ Работать со всеми инструментами PostgreSQL
- ✅ Упростить работу с базой данных
- ✅ Следовать стандартным инструкциям без изменений

После настройки PATH все команды из документации будут работать как есть! 🎉

