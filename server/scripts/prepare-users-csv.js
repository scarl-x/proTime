// Скрипт для подготовки CSV файла пользователей с хэшированными паролями
// Запуск: cd server && node scripts/prepare-users-csv.js

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const saltRounds = 10;

// Функция для чтения CSV файла
function readCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return obj;
  });
}

// Функция для записи CSV файла
function writeCSV(filePath, data, headers) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');
  
  fs.writeFileSync(filePath, csvContent, 'utf8');
}

async function prepareUsersCSV() {
  try {
    console.log('🔐 Подготовка CSV файла пользователей с хэшированными паролями...\n');
    
    const inputPath = path.join(__dirname, '../../old_db/users_rows.csv');
    const outputPath = path.join(__dirname, '../../old_db/users_rows_hashed.csv');
    
    // Читаем исходный CSV
    const users = readCSV(inputPath);
    console.log(`Найдено ${users.length} пользователей\n`);
    
    // Хэшируем пароли
    const processedUsers = users.map(user => {
      if (user.password && user.password.trim() && !user.password.startsWith('$2a$')) {
        const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
        console.log(`🔐 ${user.name} (${user.email})`);
        console.log(`   Исходный: ${user.password}`);
        console.log(`   Хэш: ${hashedPassword}\n`);
        
        return {
          ...user,
          password: hashedPassword
        };
      } else {
        console.log(`✅ ${user.name} (${user.email}) - пароль уже хэширован или пустой\n`);
        return user;
      }
    });
    
    // Получаем заголовки из первой строки
    const headers = Object.keys(processedUsers[0]);
    
    // Записываем новый CSV файл
    writeCSV(outputPath, processedUsers, headers);
    
    console.log(`✅ Новый CSV файл создан: ${outputPath}`);
    console.log('📝 Теперь можно запустить миграцию с хэшированными паролями');
    
  } catch (error) {
    console.error('❌ Ошибка при подготовке CSV:', error);
  }
}

// Запуск подготовки
prepareUsersCSV()
  .then(() => {
    console.log('🎉 Процесс завершен');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
  });
