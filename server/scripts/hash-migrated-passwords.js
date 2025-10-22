// Скрипт для хэширования паролей из мигрированных данных
// Запуск: cd server && node scripts/hash-migrated-passwords.js

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Конфигурация базы данных
const pool = new Pool({
  user: process.env.DATABASE_USER || 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  database: process.env.DATABASE_NAME || 'protime',
  password: process.env.DATABASE_PASSWORD || 'password',
  port: process.env.DATABASE_PORT || 5432,
});

const saltRounds = 10;

async function hashMigratedPasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Хэширование паролей из мигрированных данных...\n');
    
    // Получаем всех пользователей с паролями
    const result = await client.query(`
      SELECT id, name, email, password 
      FROM users 
      WHERE password IS NOT NULL AND password != ''
    `);
    
    console.log(`Найдено ${result.rows.length} пользователей с паролями:\n`);
    
    for (const user of result.rows) {
      const originalPassword = user.password;
      
      // Проверяем, не хэширован ли уже пароль
      if (originalPassword.startsWith('$2a$') || originalPassword.startsWith('$2b$')) {
        console.log(`✅ ${user.name} (${user.email}) - пароль уже хэширован`);
        continue;
      }
      
      // Хэшируем пароль
      const hashedPassword = bcrypt.hashSync(originalPassword, saltRounds);
      
      // Обновляем в базе данных
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, user.id]
      );
      
      console.log(`🔐 ${user.name} (${user.email})`);
      console.log(`   Исходный: ${originalPassword}`);
      console.log(`   Хэш: ${hashedPassword}\n`);
    }
    
    console.log('✅ Все пароли успешно хэшированы!');
    
  } catch (error) {
    console.error('❌ Ошибка при хэшировании паролей:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Запуск хэширования
hashMigratedPasswords()
  .then(() => {
    console.log('🎉 Процесс завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
