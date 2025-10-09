// Скрипт для генерации bcrypt хешей паролей
// Запуск: cd server && node scripts/generate-password-hashes.js
// Примечание: Требуется установка зависимостей (npm install)

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password';
const saltRounds = 10;

console.log(`\n🔐 Генерация bcrypt хешей для пароля: "${password}"\n`);

// Генерируем 3 хеша (для трех демо-пользователей)
console.log('Скопируйте эти хеши в server/src/database/schema.sql:\n');

for (let i = 1; i <= 3; i++) {
  const hash = bcrypt.hashSync(password, saltRounds);
  console.log(`  -- Хеш ${i} для пользователя ${i}:`);
  console.log(`  '${hash}',\n`);
}

console.log('✅ Хеши сгенерированы!');
console.log('📝 Примечание: Каждый хеш уникален из-за случайной соли.\n');
console.log('Использование:');
console.log('  node scripts/generate-password-hashes.js           # Пароль "password"');
console.log('  node scripts/generate-password-hashes.js mypass123 # Свой пароль');

